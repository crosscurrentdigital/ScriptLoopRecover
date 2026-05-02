import { auth } from "../../src/auth/server";
import { db, scripts } from "../../src/db/index";
import { eq } from "drizzle-orm";

export default async (req: Request) => {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;
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

    const [updated] = await db
      .update(scripts)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(scripts.id, Number(scriptId)))
      .returning();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    await db
      .delete(scripts)
      .where(eq(scripts.id, Number(scriptId)));

    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/scripts/*",
};
