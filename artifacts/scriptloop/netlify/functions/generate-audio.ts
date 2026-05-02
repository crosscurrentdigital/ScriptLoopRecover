import {
  attachAudioToScript,
  getScriptForUser,
} from "../../src/lib/scripts-server";
import { getSession } from "./_lib/session";
import { withSentry, captureFunctionError } from "./_lib/sentry";
import { checkAndIncrement, rateLimitResponse } from "./_lib/rateLimit";
import {
  AudioPipelineError,
  checkAudioConfig,
  generateAndUploadAudio,
} from "./_lib/audioPipeline";
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

  const session = await getSession(req);
  if (!session) return errorResponse(401, "unauthorized", "Sign in to continue.");

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
  // script the caller doesn't own (or that doesn't exist).
  if (scriptId !== null) {
    const owned = await getScriptForUser(scriptId, session.userId);
    if (!owned) return errorResponse(404, "not_found", "Script not found.");
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
