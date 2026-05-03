import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/index";
import { userPreferences } from "../../src/db/schema";
import { requireActiveSession } from "./_lib/session";
import { withSentry } from "./_lib/sentry";
import {
  errorResponse,
  parseJsonBody,
  readingPreferencesSchema,
} from "./_lib/schemas";

const ROUTE = "/api/preferences";

const updatePreferencesSchema = z
  .object({
    reading: readingPreferencesSchema,
  })
  .strict();

const handler = async (req: Request): Promise<Response> => {
  const sessionResult = await requireActiveSession(req);
  if (sessionResult instanceof Response) return sessionResult;
  const userId = sessionResult.userId;

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
