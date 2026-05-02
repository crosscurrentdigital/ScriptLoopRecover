import { db } from "../../src/db/index";
import { scripts } from "../../src/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession, jsonResponse } from "./_lib/session";
import { withSentry, captureFunctionError } from "./_lib/sentry";
import { checkAndIncrement, rateLimitResponse } from "./_lib/rateLimit";
import {
  AudioPipelineError,
  MAX_TEXT_LENGTH,
  checkAudioConfig,
  generateAndUploadAudio,
} from "./_lib/audioPipeline";

const ROUTE = "/api/scripts/*";

const handler = async (req: Request): Promise<Response> => {
  const session = await getSession(req);

  if (!session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const userId = session.userId;
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1];
  const isWithAudio =
    req.method === "POST" && lastSegment === "with-audio";
  const scriptId = isWithAudio ? undefined : lastSegment;

  if (req.method === "GET") {
    if (scriptId && scriptId !== "scripts") {
      const [script] = await db
        .select()
        .from(scripts)
        .where(eq(scripts.id, Number(scriptId)));

      if (!script || script.userId !== userId) {
        return jsonResponse({ error: "Not found" }, 404);
      }

      return jsonResponse(script);
    }

    const userScripts = await db
      .select()
      .from(scripts)
      .where(eq(scripts.userId, userId));

    return jsonResponse(userScripts);
  }

  if (isWithAudio) {
    return handleCreateWithAudio(req, userId);
  }

  if (req.method === "POST") {
    const body = (await req.json()) as {
      title: string;
      content: string;
      loopGapSeconds?: number;
    };

    if (typeof body.content === "string" && body.content.length > MAX_TEXT_LENGTH) {
      return jsonResponse(
        {
          error: "too_long",
          message: `Scripts are limited to ${MAX_TEXT_LENGTH} characters.`,
        },
        400,
      );
    }

    const [newScript] = await db
      .insert(scripts)
      .values({
        userId,
        title: body.title,
        content: body.content,
        loopGapSeconds: body.loopGapSeconds ?? 2,
      })
      .returning();

    return jsonResponse(newScript, 201);
  }

  if (req.method === "PUT") {
    const body = (await req.json()) as Partial<{
      title: string;
      content: string;
      audioUrl: string;
      audioSource: string;
      voiceId: string;
      loopGapSeconds: number;
    }>;

    if (typeof body.content === "string" && body.content.length > MAX_TEXT_LENGTH) {
      return jsonResponse(
        {
          error: "too_long",
          message: `Scripts are limited to ${MAX_TEXT_LENGTH} characters.`,
        },
        400,
      );
    }

    const [updated] = await db
      .update(scripts)
      .set({ ...body, updatedAt: new Date() })
      .where(
        and(eq(scripts.id, Number(scriptId)), eq(scripts.userId, userId)),
      )
      .returning();

    if (!updated) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return jsonResponse(updated);
  }

  if (req.method === "DELETE") {
    const deleted = await db
      .delete(scripts)
      .where(
        and(eq(scripts.id, Number(scriptId)), eq(scripts.userId, userId)),
      )
      .returning({ id: scripts.id });

    if (deleted.length === 0) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return new Response(null, { status: 204 });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
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
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const body = payload as {
    title?: unknown;
    content?: unknown;
    voiceId?: unknown;
    loopGapSeconds?: unknown;
  };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  const voiceId = typeof body.voiceId === "string" ? body.voiceId : "";
  const loopGapSeconds =
    typeof body.loopGapSeconds === "number" &&
    Number.isFinite(body.loopGapSeconds)
      ? body.loopGapSeconds
      : 2;

  if (!title) return jsonResponse({ error: "title is required" }, 400);
  if (!content.trim())
    return jsonResponse({ error: "content is required" }, 400);
  if (content.length > MAX_TEXT_LENGTH) {
    return jsonResponse(
      {
        error: "too_long",
        message: `Scripts are limited to ${MAX_TEXT_LENGTH} characters.`,
      },
      400,
    );
  }
  if (!voiceId.trim())
    return jsonResponse({ error: "voiceId is required" }, 400);

  const configError = checkAudioConfig();
  if (configError) return jsonResponse({ error: configError }, 500);
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
      return jsonResponse({ error: e.message }, e.status);
    }
    throw e;
  }

  // Audio is in R2 and never referenced by a row if INSERT fails — the
  // orphaned object is harmless and naturally cycled by R2 lifecycle policy
  // (or future cleanup task). The important invariant is: no orphan ROW.
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
    return jsonResponse({ error: msg }, 500);
  }

  return jsonResponse(newScript, 201);
}

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/scripts/*",
};
