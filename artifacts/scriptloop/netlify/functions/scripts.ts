import { db } from "../../src/db/index";
import { scripts } from "../../src/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "./_lib/session";
import { withSentry, captureFunctionError } from "./_lib/sentry";
import { checkAndIncrement, rateLimitResponse } from "./_lib/rateLimit";
import {
  AudioPipelineError,
  checkAudioConfig,
  generateAndUploadAudio,
} from "./_lib/audioPipeline";
import {
  createScriptSchema,
  createScriptWithAudioSchema,
  errorResponse,
  parseJsonBody,
  parseParam,
  scriptIdParamSchema,
  updateScriptSchema,
} from "./_lib/schemas";

const ROUTE = "/api/scripts/*";

const handler = async (req: Request): Promise<Response> => {
  const session = await getSession(req);

  if (!session) {
    return errorResponse(401, "unauthorized", "Sign in to continue.");
  }

  const userId = session.userId;
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1];
  const isWithAudio =
    req.method === "POST" && lastSegment === "with-audio";
  const hasId =
    !isWithAudio &&
    lastSegment !== undefined &&
    lastSegment !== "scripts";

  let scriptId: number | undefined;
  if (hasId) {
    const parsed = parseParam(lastSegment, scriptIdParamSchema, "script id");
    if (!parsed.ok) return parsed.response;
    scriptId = parsed.data;
  }

  if (req.method === "GET") {
    if (scriptId !== undefined) {
      const [script] = await db
        .select()
        .from(scripts)
        .where(eq(scripts.id, scriptId));

      if (!script || script.userId !== userId) {
        return errorResponse(404, "not_found", "Script not found.");
      }

      return new Response(JSON.stringify(script), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userScripts = await db
      .select()
      .from(scripts)
      .where(eq(scripts.userId, userId));

    return new Response(JSON.stringify(userScripts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (isWithAudio) {
    return handleCreateWithAudio(req, userId);
  }

  if (req.method === "POST") {
    const parsed = await parseJsonBody(req, createScriptSchema);
    if (!parsed.ok) return parsed.response;
    const { title, content, loopGapSeconds = 2 } = parsed.data;

    const [newScript] = await db
      .insert(scripts)
      .values({
        userId,
        title,
        content,
        loopGapSeconds,
      })
      .returning();

    return new Response(JSON.stringify(newScript), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "PUT") {
    if (scriptId === undefined) {
      return errorResponse(400, "invalid_param", "Script id is required.");
    }
    const parsed = await parseJsonBody(req, updateScriptSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const [updated] = await db
      .update(scripts)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
      .returning();

    if (!updated) {
      return errorResponse(404, "not_found", "Script not found.");
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    if (scriptId === undefined) {
      return errorResponse(400, "invalid_param", "Script id is required.");
    }
    const deleted = await db
      .delete(scripts)
      .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
      .returning({ id: scripts.id });

    if (deleted.length === 0) {
      return errorResponse(404, "not_found", "Script not found.");
    }

    return new Response(null, { status: 204 });
  }

  return errorResponse(405, "method_not_allowed", "Method not allowed.");
};

/**
 * POST /api/scripts/with-audio — atomic create-and-generate.
 *
 * Order of operations is deliberate: validate → rate-limit → generate audio
 * via ElevenLabs → upload to R2 → INSERT the script row last. If any step
 * before the INSERT fails, no row is created, so the user can never be
 * stranded with an orphan script that has no audio.
 */
async function handleCreateWithAudio(
  req: Request,
  userId: string,
): Promise<Response> {
  const parsed = await parseJsonBody(req, createScriptWithAudioSchema);
  if (!parsed.ok) return parsed.response;
  const { title, content, voiceId, loopGapSeconds = 2 } = parsed.data;

  const configError = checkAudioConfig();
  if (configError) return errorResponse(500, "not_configured", configError);
  const apiKey = process.env.ELEVENLABS_API_KEY!;

  // Share the same hourly bucket as /api/generate-audio so total
  // ElevenLabs spend per user per hour is bounded.
  const limitResult = await checkAndIncrement({
    userId,
    route: "generate-audio",
  });
  if (!limitResult.allowed) return rateLimitResponse(limitResult);

  let generated;
  try {
    generated = await generateAndUploadAudio({
      apiKey,
      userId,
      text: content,
      voiceId,
    });
  } catch (e) {
    if (e instanceof AudioPipelineError) {
      captureFunctionError(e, {
        route: "POST /api/scripts/with-audio",
        userId,
        status: e.status,
      });
      return errorResponse(e.status, "upstream_error", e.message);
    }
    throw e;
  }

  // If the INSERT below fails, the uploaded R2 object is left
  // unreferenced — harmless, and orphan-object cleanup is out of scope.
  // The invariant this endpoint guarantees is: no orphan script ROW.
  let newScript;
  try {
    [newScript] = await db
      .insert(scripts)
      .values({
        userId,
        title,
        content,
        loopGapSeconds,
        audioUrl: generated.publicUrl,
        voiceId,
        audioSource: "elevenlabs",
      })
      .returning();
  } catch (e) {
    captureFunctionError(e, {
      route: "POST /api/scripts/with-audio",
      userId,
      status: 500,
    });
    const msg = e instanceof Error ? e.message : "Failed to save script";
    return errorResponse(500, "save_failed", msg);
  }

  return new Response(JSON.stringify(newScript), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/scripts/*",
};
