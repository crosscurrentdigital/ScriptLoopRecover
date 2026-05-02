import { getVoices } from "../../src/lib/elevenlabs";
import { getSession, jsonResponse } from "./_lib/session";
import { withSentry, captureFunctionError } from "./_lib/sentry";
import { getRateLimitStatus } from "./_lib/rateLimit";

const ROUTE = "GET /api/audio/*";
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
        used: Math.min(status.used, status.limit),
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

  // POST /api/audio/generate was a legacy stub that always 404'd while
  // double-counting against a separate "audio.generate" rate-limit bucket
  // the UI never sees. Removed so the only audio generation path is
  // /api/generate-audio and the only quota bucket is "generate-audio".

  return jsonResponse({ error: "Not found" }, 404);
};

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/audio/*",
};
