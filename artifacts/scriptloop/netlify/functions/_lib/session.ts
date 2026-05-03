import { eq } from "drizzle-orm";
import { db } from "../../../src/db/index";
import { authUser, userProfiles } from "../../../src/db/schema";
import { errorResponse } from "./schemas";

export interface Session {
  userId: string;
  email: string;
  isAdmin: boolean;
  disabled: boolean;
}

const DEFAULT_ADMIN_EMAIL = "cbutcher@cruciblelab.org";

function adminEmail(): string {
  return (
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    DEFAULT_ADMIN_EMAIL.toLowerCase()
  );
}

/**
 * Loads the current Neon Auth session and joins it with the local
 * `user_profiles` row. Auto-promotes the configured admin email on
 * every sign-in (idempotent), and lazily creates a profile row on the
 * first call for any signed-in user so admin actions can flip flags
 * without a separate provisioning step.
 *
 * Returns `null` only when there's no auth session — disabled users
 * still resolve here so callers can return a 403 with a clear message
 * (use `requireActiveSession` for that).
 */
export async function getSession(req: Request): Promise<Session | null> {
  const neonAuthUrl = process.env.VITE_NEON_AUTH_URL;
  if (!neonAuthUrl) return null;
  let userId: string | undefined;
  try {
    const res = await fetch(`${neonAuthUrl}/api/auth/get-session`, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { session?: { userId?: string } };
    userId = data?.session?.userId;
  } catch {
    return null;
  }
  if (!userId) return null;

  const [user] = await db
    .select({ email: authUser.email })
    .from(authUser)
    .where(eq(authUser.id, userId));
  if (!user) return null;
  const email = user.email;

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId));

  const matchesAdmin = email.trim().toLowerCase() === adminEmail();
  let isAdmin = profile?.isAdmin ?? false;
  const disabled = profile?.disabled ?? false;

  if (!profile) {
    // First touch — create the profile, auto-promoting if this is
    // the configured admin email.
    isAdmin = matchesAdmin;
    try {
      await db
        .insert(userProfiles)
        .values({ userId, isAdmin, disabled: false })
        .onConflictDoNothing();
    } catch {
      // Race with another insert — fine, we'll re-read on the next call.
    }
  } else if (matchesAdmin && !profile.isAdmin) {
    // Admin email signed in but isn't admin yet — fix that.
    isAdmin = true;
    await db
      .update(userProfiles)
      .set({ isAdmin: true, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId));
  }

  return { userId, email, isAdmin, disabled };
}

/**
 * Convenience wrapper for handlers: returns either a Response (401 for
 * unauthenticated, 403 for disabled) or an active Session. Use this
 * instead of `getSession` in feature endpoints so disabled accounts
 * get a clear "account disabled" message rather than a generic 401.
 */
export async function requireActiveSession(
  req: Request,
): Promise<Response | Session> {
  const session = await getSession(req);
  if (!session) {
    return errorResponse(401, "unauthorized", "Sign in to continue.");
  }
  if (session.disabled) {
    return errorResponse(
      403,
      "account_disabled",
      "Your account has been disabled. Contact an administrator.",
    );
  }
  return session;
}

/**
 * Like `requireActiveSession` but additionally requires `isAdmin`.
 * Returns 403 for non-admins so existence of admin endpoints isn't
 * leaked to authenticated users.
 */
export async function requireAdmin(
  req: Request,
): Promise<Response | Session> {
  const result = await requireActiveSession(req);
  if (result instanceof Response) return result;
  if (!result.isAdmin) {
    return errorResponse(403, "forbidden", "Admin access required.");
  }
  return result;
}

export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
