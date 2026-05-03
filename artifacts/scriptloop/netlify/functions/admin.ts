import { and, asc, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../src/db/index";
import {
  authUser,
  scripts,
  userPreferences,
  userProfiles,
} from "../../src/db/schema";
import { requireAdmin } from "./_lib/session";
import { withSentry, captureFunctionError } from "./_lib/sentry";
import {
  errorResponse,
  parseJsonBody,
  parseParam,
  updateScriptSchema,
} from "./_lib/schemas";

const ROUTE = "/api/admin/*";

const userIdParamSchema = z.string().uuid();
const scriptIdParamSchema = z.coerce.number().int().positive();

const listUsersQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const handler = async (req: Request): Promise<Response> => {
  const session = await requireAdmin(req);
  if (session instanceof Response) return session;

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // Expected: ["api","admin",resource, ...rest]
  const resource = segments[2];
  const id = segments[3];
  const action = segments[4];

  try {
    if (resource === "overview" && req.method === "GET") {
      return await getOverview();
    }

    if (resource === "users") {
      if (!id) {
        if (req.method === "GET") return await listUsers(url);
        return methodNotAllowed();
      }
      const userParse = parseParam(id, userIdParamSchema, "user id");
      if (!userParse.ok) return userParse.response;
      const targetUserId = userParse.data;

      if (!action) {
        if (req.method === "GET") return await getUserDetail(targetUserId);
        if (req.method === "DELETE") {
          return await deleteUser(targetUserId, session.userId);
        }
        return methodNotAllowed();
      }

      if (req.method !== "POST") return methodNotAllowed();
      switch (action) {
        case "promote":
          return await setAdmin(targetUserId, true, session.userId);
        case "demote":
          return await setAdmin(targetUserId, false, session.userId);
        case "disable":
          return await setDisabled(targetUserId, true, session.userId);
        case "enable":
          return await setDisabled(targetUserId, false, session.userId);
        default:
          return errorResponse(404, "not_found", "Unknown admin action.");
      }
    }

    if (resource === "scripts" && id) {
      const sParse = parseParam(id, scriptIdParamSchema, "script id");
      if (!sParse.ok) return sParse.response;
      const scriptId = sParse.data;
      if (req.method === "PUT") return await adminUpdateScript(scriptId, req);
      if (req.method === "DELETE") return await adminDeleteScript(scriptId);
      return methodNotAllowed();
    }

    return errorResponse(404, "not_found", "Unknown admin endpoint.");
  } catch (err) {
    // Don't echo raw exception messages to admin clients — they can leak
    // database schema / driver internals. Sentry has the full stack for
    // debugging; the response stays generic.
    captureFunctionError(err, { route: ROUTE });
    return errorResponse(500, "internal_error", "Internal server error.");
  }
};

function methodNotAllowed(): Response {
  return errorResponse(405, "method_not_allowed", "Method not allowed.");
}

function jsonOk(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function getOverview(): Promise<Response> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [[users], [scriptTotal], [scripts7], [scripts30], [admins]] =
    await Promise.all([
      db.select({ c: count() }).from(authUser),
      db.select({ c: count() }).from(scripts),
      db
        .select({ c: count() })
        .from(scripts)
        .where(gte(scripts.createdAt, sevenDaysAgo)),
      db
        .select({ c: count() })
        .from(scripts)
        .where(gte(scripts.createdAt, thirtyDaysAgo)),
      db
        .select({ c: count() })
        .from(userProfiles)
        .where(eq(userProfiles.isAdmin, true)),
    ]);

  return jsonOk({
    totalUsers: Number(users.c),
    totalScripts: Number(scriptTotal.c),
    scriptsLast7Days: Number(scripts7.c),
    scriptsLast30Days: Number(scripts30.c),
    totalAdmins: Number(admins.c),
  });
}

async function listUsers(url: URL): Promise<Response> {
  const q = url.searchParams.get("q") ?? undefined;
  const page = url.searchParams.get("page") ?? undefined;
  const pageSize = url.searchParams.get("pageSize") ?? undefined;
  const parsed = listUsersQuerySchema.safeParse({ q, page, pageSize });
  if (!parsed.success) {
    return errorResponse(400, "invalid_request", "Invalid query parameters.");
  }
  const { q: query, page: p, pageSize: ps } = parsed.data;

  const where = query
    ? or(
        ilike(authUser.email, `%${query}%`),
        ilike(authUser.name, `%${query}%`),
      )
    : undefined;

  const scriptCountSubquery = db
    .select({
      userId: scripts.userId,
      n: count().as("n"),
    })
    .from(scripts)
    .groupBy(scripts.userId)
    .as("script_counts");

  const baseQuery = db
    .select({
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      createdAt: authUser.createdAt,
      isAdmin: sql<boolean>`coalesce(${userProfiles.isAdmin}, false)`,
      disabled: sql<boolean>`coalesce(${userProfiles.disabled}, false)`,
      scriptCount: sql<number>`coalesce(${scriptCountSubquery.n}, 0)`,
    })
    .from(authUser)
    .leftJoin(userProfiles, eq(userProfiles.userId, authUser.id))
    .leftJoin(scriptCountSubquery, eq(scriptCountSubquery.userId, authUser.id));

  const rows = await (where ? baseQuery.where(where) : baseQuery)
    .orderBy(desc(authUser.createdAt))
    .limit(ps)
    .offset((p - 1) * ps);

  const totalQuery = db
    .select({ c: count() })
    .from(authUser);
  const [{ c: total }] = await (where ? totalQuery.where(where) : totalQuery);

  return jsonOk({
    users: rows.map((r) => ({
      ...r,
      scriptCount: Number(r.scriptCount),
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
    page: p,
    pageSize: ps,
    total: Number(total),
  });
}

async function getUserDetail(userId: string): Promise<Response> {
  const [user] = await db
    .select({
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      createdAt: authUser.createdAt,
      isAdmin: sql<boolean>`coalesce(${userProfiles.isAdmin}, false)`,
      disabled: sql<boolean>`coalesce(${userProfiles.disabled}, false)`,
    })
    .from(authUser)
    .leftJoin(userProfiles, eq(userProfiles.userId, authUser.id))
    .where(eq(authUser.id, userId));
  if (!user) return errorResponse(404, "not_found", "User not found.");

  const userScripts = await db
    .select()
    .from(scripts)
    .where(eq(scripts.userId, userId))
    .orderBy(asc(scripts.title));

  return jsonOk({
    user: {
      ...user,
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : user.createdAt,
    },
    scripts: userScripts,
  });
}

async function ensureProfile(userId: string): Promise<void> {
  await db
    .insert(userProfiles)
    .values({ userId, isAdmin: false, disabled: false })
    .onConflictDoNothing();
}

async function setAdmin(
  userId: string,
  isAdmin: boolean,
  callerId: string,
): Promise<Response> {
  if (userId === callerId && !isAdmin) {
    return errorResponse(
      400,
      "self_action_forbidden",
      "You cannot demote yourself.",
    );
  }
  const [exists] = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.id, userId));
  if (!exists) return errorResponse(404, "not_found", "User not found.");

  await ensureProfile(userId);
  await db
    .update(userProfiles)
    .set({ isAdmin, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId));
  return jsonOk({ ok: true, isAdmin });
}

async function setDisabled(
  userId: string,
  disabled: boolean,
  callerId: string,
): Promise<Response> {
  if (userId === callerId && disabled) {
    return errorResponse(
      400,
      "self_action_forbidden",
      "You cannot disable yourself.",
    );
  }
  const [exists] = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.id, userId));
  if (!exists) return errorResponse(404, "not_found", "User not found.");

  await ensureProfile(userId);
  await db
    .update(userProfiles)
    .set({ disabled, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId));
  return jsonOk({ ok: true, disabled });
}

async function deleteUser(
  userId: string,
  callerId: string,
): Promise<Response> {
  if (userId === callerId) {
    return errorResponse(
      400,
      "self_action_forbidden",
      "You cannot delete yourself.",
    );
  }
  // Cascade: scripts and user_preferences both have ON DELETE CASCADE
  // against neon_auth.user, so deleting from there removes the user's
  // app data. The Neon Auth sync owns the auth row; we delete the FK
  // targets first to keep behaviour deterministic if the cascade ever
  // changes upstream. Wrapped in a transaction so a partial failure
  // can't leave dangling rows or a half-deleted account.
  const deleted = await db.transaction(async (tx) => {
    await tx.delete(scripts).where(eq(scripts.userId, userId));
    await tx
      .delete(userPreferences)
      .where(eq(userPreferences.userId, userId));
    await tx.delete(userProfiles).where(eq(userProfiles.userId, userId));
    return tx
      .delete(authUser)
      .where(eq(authUser.id, userId))
      .returning({ id: authUser.id });
  });
  if (deleted.length === 0) {
    return errorResponse(404, "not_found", "User not found.");
  }
  return jsonOk({ ok: true });
}

async function adminUpdateScript(
  scriptId: number,
  req: Request,
): Promise<Response> {
  const parsed = await parseJsonBody(req, updateScriptSchema);
  if (!parsed.ok) return parsed.response;
  const [updated] = await db
    .update(scripts)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(scripts.id, scriptId))
    .returning();
  if (!updated) return errorResponse(404, "not_found", "Script not found.");
  return jsonOk(updated);
}

async function adminDeleteScript(scriptId: number): Promise<Response> {
  const deleted = await db
    .delete(scripts)
    .where(eq(scripts.id, scriptId))
    .returning({ id: scripts.id });
  if (deleted.length === 0) {
    return errorResponse(404, "not_found", "Script not found.");
  }
  return new Response(null, { status: 204 });
}

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/admin/*",
};
