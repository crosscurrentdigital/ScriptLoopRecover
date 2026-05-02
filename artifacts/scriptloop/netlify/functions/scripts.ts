import { db } from "../../src/db/index";
import { scripts } from "../../src/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "./_lib/session";
import { withSentry } from "./_lib/sentry";

const MAX_TEXT_LENGTH = 2000;

const handler = async (req: Request): Promise<Response> => {
  const session = await getSession(req);

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.userId;
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const scriptId = pathParts[pathParts.length - 1];

  if (req.method === "GET") {
    if (scriptId && scriptId !== "scripts") {
      const [script] = await db
        .select()
        .from(scripts)
        .where(eq(scripts.id, Number(scriptId)));

      if (!script || script.userId !== userId) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
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

  if (req.method === "POST") {
    const body = (await req.json()) as {
      title: string;
      content: string;
      loopGapSeconds?: number;
    };

    if (typeof body.content === "string" && body.content.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: "too_long",
          message: `Scripts are limited to ${MAX_TEXT_LENGTH} characters.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
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

    return new Response(JSON.stringify(newScript), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
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
      return new Response(
        JSON.stringify({
          error: "too_long",
          message: `Scripts are limited to ${MAX_TEXT_LENGTH} characters.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
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
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const deleted = await db
      .delete(scripts)
      .where(
        and(eq(scripts.id, Number(scriptId)), eq(scripts.userId, userId)),
      )
      .returning({ id: scripts.id });

    if (deleted.length === 0) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};

export default withSentry("/api/scripts/*", handler);

export const config = {
  path: "/api/scripts/*",
};
