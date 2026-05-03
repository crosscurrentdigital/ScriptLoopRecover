import {
  attachAudioToScript,
  getScriptForUser,
} from "../../src/lib/scripts-server";
import { requireActiveSession } from "./_lib/session";
import { withSentry, captureFunctionError } from "./_lib/sentry";
import { checkAndIncrement, rateLimitResponse } from "./_lib/rateLimit";
import {
  AudioPipelineError,
  checkAudioConfig,
  generateAndUploadAudio,
} from "./_lib/audioPipeline";
import { deleteObjectByPublicUrl } from "../../src/lib/r2-server";
import {
  errorResponse,
  generateAudioSchema,
  parseJsonBody,
} from "./_lib/schemas";

const ROUTE = "POST /api/generate-audio";

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return errorResponse(405, "method_not_allowed", "Method not allowed.");
  }

  const session = await requireActiveSession(req);
  if (session instanceof Response) return session;

  const configError = checkAudioConfig();
  if (configError) return errorResponse(500, "not_configured", configError);
  const apiKey = process.env.ELEVENLABS_API_KEY!;

  const parsed = await parseJsonBody(req, generateAudioSchema);
  if (!parsed.ok) return parsed.response;
  const { text, voiceId, scriptId = null } = parsed.data;

  // Per-user, per-hour rate limit (defends against runaway loops and
  // limits ElevenLabs spend). Checked AFTER input validation but BEFORE we
  // touch any third-party APIs.
  const limitResult = await checkAndIncrement({
    userId: session.userId,
    route: "generate-audio",
  });
  if (!limitResult.allowed) return rateLimitResponse(limitResult);

  // Pre-flight ownership check: refuse to spend ElevenLabs credits on a
  // script the caller doesn't own (or that doesn't exist). Capture the
  // previous audioUrl so we can delete the old R2 object after a
  // successful regenerate (real leaked-URL rotation, not just a DB update
  // — see `replit.md` → Audio privacy posture).
  let previousAudioUrl: string | null = null;
  if (scriptId !== null) {
    const owned = await getScriptForUser(scriptId, session.userId);
    if (!owned) return errorResponse(404, "not_found", "Script not found.");
    previousAudioUrl = owned.audioUrl ?? null;
  }

  let generated;
  try {
    generated = await generateAndUploadAudio({
      apiKey,
      userId: session.userId,
      text,
      voiceId,
    });
  } catch (e) {
    if (e instanceof AudioPipelineError) {
      captureFunctionError(e, {
        route: ROUTE,
        userId: session.userId,
        status: e.status,
      });
      return errorResponse(e.status, "upstream_error", e.message);
    }
    throw e;
  }

  let script = null;
  if (scriptId !== null) {
    try {
      script = await attachAudioToScript({
        scriptId,
        userId: session.userId,
        audioUrl: generated.publicUrl,
        voiceId,
        audioSource: "elevenlabs",
      });
    } catch (e) {
      captureFunctionError(e, {
        route: ROUTE,
        userId: session.userId,
        status: 500,
      });
      const msg = e instanceof Error ? e.message : "Failed to save audio link";
      return errorResponse(500, "save_failed", msg);
    }
    if (!script) {
      return errorResponse(404, "not_found", "Script not found.");
    }

    // Best-effort revoke: now that the script row points at the new R2
    // object, delete the previous one so a leaked old URL stops working.
    // Failures are logged to Sentry but do not fail the request — the
    // user already got their new audio and the worst case is one orphan
    // object whose URL was already exposed.
    if (previousAudioUrl && previousAudioUrl !== generated.publicUrl) {
      try {
        await deleteObjectByPublicUrl(previousAudioUrl);
      } catch (e) {
        captureFunctionError(e, {
          route: ROUTE,
          userId: session.userId,
          status: 200,
        });
      }
    }
  }

  return new Response(
    JSON.stringify({
      audioUrl: generated.publicUrl,
      durationSeconds: generated.durationSeconds,
      script,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/generate-audio",
};
