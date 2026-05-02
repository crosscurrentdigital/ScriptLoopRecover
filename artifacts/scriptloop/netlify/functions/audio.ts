import { getVoices } from "../../src/lib/elevenlabs";
import { getSession, jsonResponse } from "./_lib/session";
import { withSentry, captureFunctionError } from "./_lib/sentry";
import {
  checkAndIncrement,
  getRateLimitStatus,
  rateLimitResponse,
} from "./_lib/rateLimit";

const MAX_TEXT_LENGTH = 2000;
const ROUTE = "POST /api/audio/generate";
// Must match the route name used by netlify/functions/generate-audio.ts so
// /quota reflects the same bucket users actually spend against.
const GENERATE_AUDIO_ROUTE = "generate-audio";

const handler = async (req: Request): Promise<Response> => {
  const session = await getSession(req);
  if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

  const url = new URL(req.url);

  // GET /api/audio/quota — read-only quota for the current hour. Available
  // even if ElevenLabs is unconfigured so the UI can still render.
  if (url.pathname.endsWith("/quota") && req.method === "GET") {
    try {
      const status = await getRateLimitStatus({
        userId: session.userId,
        route: GENERATE_AUDIO_ROUTE,
      });
      return jsonResponse({
        used: status.used,
        limit: status.limit,
        resetsAt: status.resetsAt.toISOString(),
      });
    } catch (e) {
      captureFunctionError(e, {
        route: "GET /api/audio/quota",
        userId: session.userId,
        status: 500,
      });
      const msg = e instanceof Error ? e.message : "Quota lookup failed";
      return jsonResponse({ error: msg }, 500);
    }
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey)
    return jsonResponse({ error: "ElevenLabs not configured" }, 500);

  // GET /api/audio/voices — list voices (no rate limit needed)
  if (url.pathname.endsWith("/voices") && req.method === "GET") {
    try {
      const voices = await getVoices(apiKey);
      return jsonResponse(
        voices.map((v) => ({
          voice_id: v.voice_id,
          name: v.name,
          preview_url: v.preview_url,
        })),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      captureFunctionError(e, {
        route: "GET /api/audio/voices",
        userId: session.userId,
        status: 502,
      });
      return jsonResponse({ error: msg }, 502);
    }
  }

  // POST /api/audio/generate — guard against accidental over-use even if
  // not the primary generate path. Mirrors /api/generate-audio limits.
  if (url.pathname.endsWith("/generate") && req.method === "POST") {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    const body = payload as { text?: unknown };
    const text = typeof body.text === "string" ? body.text : "";

    if (!text.trim()) return jsonResponse({ error: "text is required" }, 400);
    if (text.length > MAX_TEXT_LENGTH) {
      return jsonResponse(
        {
          error: "too_long",
          message: `Scripts are limited to ${MAX_TEXT_LENGTH} characters.`,
        },
        400,
      );
    }

    const limitResult = await checkAndIncrement({
      userId: session.userId,
      route: "audio.generate",
    });
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    return jsonResponse(
      { error: "Use /api/generate-audio instead" },
      404,
    );
  }

  return jsonResponse({ error: "Not found" }, 404);
};

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/audio/*",
};
