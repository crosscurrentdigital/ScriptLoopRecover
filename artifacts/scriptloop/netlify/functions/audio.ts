import { getVoices } from "../../src/lib/elevenlabs";
import { getSession } from "./_lib/session";
import { withSentry, captureFunctionError } from "./_lib/sentry";
import { getRateLimitStatus } from "./_lib/rateLimit";
import { errorResponse } from "./_lib/schemas";

const ROUTE = "GET /api/audio/*";
// Must match the route name used by netlify/functions/generate-audio.ts so
// /quota reflects the same bucket users actually spend against.
const GENERATE_AUDIO_ROUTE = "generate-audio";

const handler = async (req: Request): Promise<Response> => {
  const session = await getSession(req);
  if (!session) return errorResponse(401, "unauthorized", "Sign in to continue.");

  const url = new URL(req.url);
  const isQuota = url.pathname.endsWith("/quota");
  const isVoices = url.pathname.endsWith("/voices");

  // Only GET is meaningful on the read-only audio subroutes; reject other
  // verbs with a structured 405 instead of falling through to a 404.
  if ((isQuota || isVoices) && req.method !== "GET") {
    return errorResponse(405, "method_not_allowed", "Method not allowed.");
  }

  // GET /api/audio/quota — read-only quota for the current hour. Available
  // even if ElevenLabs is unconfigured so the UI can still render.
  if (isQuota) {
    try {
      const status = await getRateLimitStatus({
        userId: session.userId,
        route: GENERATE_AUDIO_ROUTE,
      });
      return new Response(
        JSON.stringify({
          used: Math.min(status.used, status.limit),
          limit: status.limit,
          resetsAt: status.resetsAt.toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (e) {
      captureFunctionError(e, {
        route: "GET /api/audio/quota",
        userId: session.userId,
        status: 500,
      });
      return errorResponse(500, "quota_lookup_failed", "Quota lookup failed.");
    }
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey)
    return errorResponse(500, "not_configured", "ElevenLabs is not configured.");

  // GET /api/audio/voices — list voices (no rate limit needed)
  if (isVoices) {
    try {
      const voices = await getVoices(apiKey);
      return new Response(
        JSON.stringify(
          voices.map((v) => ({
            voice_id: v.voice_id,
            name: v.name,
            preview_url: v.preview_url,
          })),
        ),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (e) {
      captureFunctionError(e, {
        route: "GET /api/audio/voices",
        userId: session.userId,
        status: 502,
      });
      const msg = e instanceof Error ? e.message : "Voice lookup failed.";
      return errorResponse(502, "upstream_error", msg);
    }
  }

  // POST /api/audio/generate was a legacy stub that always 404'd while
  // double-counting against a separate "audio.generate" rate-limit bucket
  // the UI never sees. Removed so the only audio generation path is
  // /api/generate-audio and the only quota bucket is "generate-audio".

  return errorResponse(404, "not_found", "Not found.");
};

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/audio/*",
};
