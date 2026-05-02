import { textToSpeech } from "../../src/lib/elevenlabs";
import { uploadBufferToR2 } from "../../src/lib/r2-server";
import {
  attachAudioToScript,
  getScriptForUser,
} from "../../src/lib/scripts-server";
import { getSession, jsonResponse } from "./_lib/session";
import { withSentry, captureFunctionError } from "./_lib/sentry";
import { checkAndIncrement, rateLimitResponse } from "./_lib/rateLimit";

const MAX_TEXT_LENGTH = 2000;
const DEFAULT_BITRATE_BPS = 128_000;
const WORDS_PER_SECOND_FALLBACK = 2.5;
const ROUTE = "POST /api/generate-audio";

const MPEG_BITRATE_TABLE: Record<string, (number | null)[]> = {
  "1-1": [
    null, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448,
    null,
  ],
  "1-2": [
    null, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, null,
  ],
  "1-3": [
    null, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, null,
  ],
  "2-1": [
    null, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, null,
  ],
  "2-2": [
    null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, null,
  ],
  "2-3": [
    null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, null,
  ],
};

function readMp3Bitrate(buf: Uint8Array): number | null {
  const limit = Math.min(buf.length - 4, 8192);
  for (let i = 0; i < limit; i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      const versionBits = (buf[i + 1] >> 3) & 0x03;
      const layerBits = (buf[i + 1] >> 1) & 0x03;
      const bitrateIndex = (buf[i + 2] >> 4) & 0x0f;

      if (versionBits === 1 || layerBits === 0 || bitrateIndex === 0xf) {
        continue;
      }

      const versionKey =
        versionBits === 3 ? "1" : versionBits === 2 ? "2" : null;
      const layerKey =
        layerBits === 3 ? "1" : layerBits === 2 ? "2" : layerBits === 1 ? "3" : null;
      if (!versionKey || !layerKey) continue;

      const table = MPEG_BITRATE_TABLE[`${versionKey}-${layerKey}`];
      const kbps = table?.[bitrateIndex];
      if (kbps) return kbps * 1000;
    }
  }
  return null;
}

function estimateDurationSeconds(
  audioBytes: Uint8Array,
  text: string,
): number {
  const bitrate = readMp3Bitrate(audioBytes) ?? DEFAULT_BITRATE_BPS;
  const fromBytes = (audioBytes.byteLength * 8) / bitrate;

  if (Number.isFinite(fromBytes) && fromBytes > 0.05) {
    return Math.round(fromBytes * 10) / 10;
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const fallback = wordCount / WORDS_PER_SECOND_FALLBACK;
  return Math.round(Math.max(fallback, 0.1) * 10) / 10;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const session = await getSession(req);
  if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "ElevenLabs is not configured" }, 500);
  }

  const missingR2 = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ].filter((name) => !process.env[name]);
  if (missingR2.length > 0) {
    return jsonResponse(
      {
        error: `R2 storage is not configured: missing ${missingR2.join(", ")}`,
      },
      500,
    );
  }

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

  let audioBuffer: ArrayBuffer;
  try {
    audioBuffer = await textToSpeech(apiKey, { text, voiceId });
  } catch (e) {
    captureFunctionError(e, {
      route: ROUTE,
      userId: session.userId,
      status: 502,
    });
    const msg = e instanceof Error ? e.message : "Text-to-speech failed";
    return jsonResponse({ error: msg }, 502);
  }

  const audioBytes = new Uint8Array(audioBuffer);
  const key = `audio/${session.userId}/${Date.now()}-generated.mp3`;

  let publicUrl: string;
  try {
    const result = await uploadBufferToR2(audioBytes, key, "audio/mpeg");
    publicUrl = result.publicUrl;
  } catch (e) {
    captureFunctionError(e, {
      route: ROUTE,
      userId: session.userId,
      status: 502,
    });
    const msg = e instanceof Error ? e.message : "R2 upload failed";
    return jsonResponse({ error: msg }, 502);
  }

  const durationSeconds = estimateDurationSeconds(audioBytes, text);

  let script = null;
  if (scriptId !== null) {
    try {
      script = await attachAudioToScript({
        scriptId,
        userId: session.userId,
        audioUrl: publicUrl,
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

  return jsonResponse({ audioUrl: publicUrl, durationSeconds, script });
};

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/generate-audio",
};
