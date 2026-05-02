import {
  attachAudioToScript,
  getScriptForUser,
} from "../../src/lib/scripts-server";
import { getSession, jsonResponse } from "./_lib/session";
import { withSentry, captureFunctionError } from "./_lib/sentry";
import { checkAndIncrement, rateLimitResponse } from "./_lib/rateLimit";
import {
  AudioPipelineError,
  MAX_TEXT_LENGTH,
  checkAudioConfig,
  generateAndUploadAudio,
} from "./_lib/audioPipeline";

const ROUTE = "POST /api/generate-audio";

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const session = await getSession(req);
  if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

  const configError = checkAudioConfig();
  if (configError) return jsonResponse({ error: configError }, 500);
  const apiKey = process.env.ELEVENLABS_API_KEY!;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const body = payload as {
    text?: unknown;
    voiceId?: unknown;
    scriptId?: unknown;
  };
  const text = typeof body.text === "string" ? body.text : "";
  const voiceId = typeof body.voiceId === "string" ? body.voiceId : "";
  const scriptId =
    typeof body.scriptId === "number" && Number.isFinite(body.scriptId)
      ? body.scriptId
      : null;

  if (!text.trim()) {
    return jsonResponse({ error: "text is required" }, 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonResponse(
      {
        error: "too_long",
        message: `Scripts are limited to ${MAX_TEXT_LENGTH} characters.`,
      },
      400,
    );
  }
  if (!voiceId.trim()) {
    return jsonResponse({ error: "voiceId is required" }, 400);
  }

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
    if (!owned) return jsonResponse({ error: "Script not found" }, 404);
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
      return jsonResponse({ error: e.message }, e.status);
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
      return jsonResponse({ error: msg }, 500);
    }
    if (!script) {
      return jsonResponse({ error: "Script not found" }, 404);
    }
  }

  return jsonResponse({
    audioUrl: generated.publicUrl,
    durationSeconds: generated.durationSeconds,
    script,
  });
};

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/generate-audio",
};
