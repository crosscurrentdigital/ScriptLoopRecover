import { db } from "../../src/db/index";
import { scripts } from "../../src/db/schema";
import { and, eq } from "drizzle-orm";
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
  const sessionResult = await requireActiveSession(req);
  if (sessionResult instanceof Response) return sessionResult;
  const userId = sessionResult.userId;
  const isAdmin = sessionResult.isAdmin;
  // Admins can read/update/delete any user's scripts so the existing
  // detail/editor pages work from the admin user-detail view without
  // duplicating the entire UI behind a separate set of admin-only
  // endpoints. Ownership-restricted writes still apply to non-admins.
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

      if (!script || (script.userId !== userId && !isAdmin)) {
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
    const {
      title,
      content,
      loopGapSeconds = 2,
      audioUrl,
      audioSource,
    } = parsed.data;

    // audioUrl + audioSource must be provided together. This is the
    // user-recorded path: the client uploads the recording to R2 first
    // (via /api/storage/presign), then creates the script row in one
    // shot. Either both come through or neither does.
    if ((audioUrl === undefined) !== (audioSource === undefined)) {
      return errorResponse(
        400,
        "invalid_request",
        "audioUrl and audioSource must be provided together.",
      );
    }

    const [newScript] = await db
      .insert(scripts)
      .values({
        userId,
        title,
        content,
        loopGapSeconds,
        ...(audioUrl !== undefined ? { audioUrl } : {}),
        ...(audioSource !== undefined ? { audioSource } : {}),
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

    // Capture the previous audioUrl BEFORE the update so we can
    // best-effort delete the old R2 object after a successful rotation.
    // This mirrors the privacy posture of the regenerate flow (see
    // generate-audio.ts and `replit.md` → Audio privacy posture):
    // recorded audio also lives at a public-by-design URL, so a
    // re-record must actually revoke access to the previous URL, not
    // just stop linking to it.
    //
    // Known race: two concurrent re-records of the same script can both
    // read the same prior URL and both delete it; the losing writer's
    // newly uploaded R2 object is then orphaned (still public-by-design
    // behind its unguessable URL but no longer referenced from the row).
    // We accept this for parity with generate-audio's identical
    // pre-read-then-update pattern; the practical risk is bounded by
    // the unguessable R2 key shape and the per-user rate limits. If
    // this ever matters, switch to `SELECT … FOR UPDATE` here and in
    // generate-audio together.
    const ownershipFilter = isAdmin
      ? eq(scripts.id, scriptId)
      : and(eq(scripts.id, scriptId), eq(scripts.userId, userId));

    let previousAudioUrl: string | null = null;
    if (body.audioUrl !== undefined) {
      const existing = await db
        .select({ audioUrl: scripts.audioUrl })
        .from(scripts)
        .where(ownershipFilter);
      previousAudioUrl = existing[0]?.audioUrl ?? null;
    }

    const [updated] = await db
      .update(scripts)
      .set({ ...body, updatedAt: new Date() })
      .where(ownershipFilter)
      .returning();

    if (!updated) {
      return errorResponse(404, "not_found", "Script not found.");
    }

    if (
      previousAudioUrl &&
      body.audioUrl !== undefined &&
      previousAudioUrl !== body.audioUrl
    ) {
      try {
        await deleteObjectByPublicUrl(previousAudioUrl);
      } catch (err) {
        // Non-fatal: the row already points at the new URL. Log and
        // move on so the user isn't blocked on a stuck cleanup.
        // Phase: rotate-old-audio. Best-effort cleanup of the prior R2
        // object after the row already points at the new audioUrl.
        captureFunctionError(err, { route: ROUTE });
      }
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
      .where(
        isAdmin
          ? eq(scripts.id, scriptId)
          : and(eq(scripts.id, scriptId), eq(scripts.userId, userId)),
      )
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
