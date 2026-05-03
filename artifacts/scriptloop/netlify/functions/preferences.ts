import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/index";
import { userPreferences } from "../../src/db/schema";
import { getSession } from "./_lib/session";
import { withSentry } from "./_lib/sentry";
import { errorResponse, parseJsonBody } from "./_lib/schemas";

const ROUTE = "/api/preferences";

const readingPreferencesSchema = z
  .object({
    fontFamily: z.string().min(1).max(64),
    backgroundColor: z.string().min(1).max(64),
    textColor: z.string().min(1).max(64),
    letterSpacing: z.number().min(0).max(8),
    lineHeight: z.number().min(1).max(3),
    fontSize: z.number().int().min(10).max(48),
  })
  .strict();

const updatePreferencesSchema = z
  .object({
    reading: readingPreferencesSchema,
  })
  .strict();

const handler = async (req: Request): Promise<Response> => {
  const session = await getSession(req);
  if (!session) {
    return errorResponse(401, "unauthorized", "Sign in to continue.");
  }
  const userId = session.userId;

  if (req.method === "GET") {
    const [row] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return new Response(
      JSON.stringify({ reading: row?.reading ?? null }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (req.method === "PUT") {
    const parsed = await parseJsonBody(req, updatePreferencesSchema);
    if (!parsed.ok) return parsed.response;
    const { reading } = parsed.data;

    const [row] = await db
      .insert(userPreferences)
      .values({ userId, reading, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { reading, updatedAt: new Date() },
      })
      .returning();

    return new Response(JSON.stringify({ reading: row.reading }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return errorResponse(405, "method_not_allowed", "Method not allowed.");
};

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/preferences",
};
