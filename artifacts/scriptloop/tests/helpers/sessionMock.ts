import { vi } from "vitest";

function jsonError(status: number, code: string, message: string): Response {
  return new Response(
    JSON.stringify({ error: { code, message } }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

/**
 * Build a mock for `netlify/functions/_lib/session` that exposes
 * `getSession` as a `vi.fn` and derives `requireActiveSession` /
 * `requireAdmin` from it (matching the real wrappers' behaviour).
 *
 * Tests can keep calling `mock.getSession.mockResolvedValue(...)` and
 * the require* helpers automatically reflect the same value.
 */
export function makeSessionMock() {
  const getSession = vi.fn();
  const requireActiveSession = vi.fn(async (req: Request) => {
    const s = await getSession(req);
    if (!s) return jsonError(401, "unauthorized", "Sign in to continue.");
    if (s.disabled) {
      return jsonError(
        403,
        "account_disabled",
        "Your account has been disabled. Contact an administrator.",
      );
    }
    return s;
  });
  const requireAdmin = vi.fn(async (req: Request) => {
    const result = await requireActiveSession(req);
    if (result instanceof Response) return result;
    if (!result.isAdmin) {
      return jsonError(403, "forbidden", "Admin access required.");
    }
    return result;
  });
  return {
    getSession,
    requireActiveSession,
    requireAdmin,
    jsonResponse: (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  };
}
