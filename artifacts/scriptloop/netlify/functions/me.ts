import { requireActiveSession } from "./_lib/session";
import { withSentry } from "./_lib/sentry";
import { errorResponse } from "./_lib/schemas";

const ROUTE = "GET /api/me";

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "GET") {
    return errorResponse(405, "method_not_allowed", "Method not allowed.");
  }
  // Disabled accounts get the same 403 `account_disabled` here as on every
  // other API route — the requirement that disabled users "cannot call any
  // API" is absolute. Surfacing the disabled state to the user is the
  // client's job (see follow-up #50): on 403 with `account_disabled` it
  // can render a dedicated screen and sign the user out.
  const session = await requireActiveSession(req);
  if (session instanceof Response) return session;
  return new Response(
    JSON.stringify({
      userId: session.userId,
      email: session.email,
      isAdmin: session.isAdmin,
      disabled: session.disabled,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export default withSentry(ROUTE, handler);

export const config = {
  path: "/api/me",
};
