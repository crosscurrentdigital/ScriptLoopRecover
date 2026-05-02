export interface Session {
  userId: string;
}

export async function getSession(req: Request): Promise<Session | null> {
  const neonAuthUrl = process.env.VITE_NEON_AUTH_URL;
  if (!neonAuthUrl) return null;
  try {
    const res = await fetch(`${neonAuthUrl}/api/auth/get-session`, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { session?: { userId?: string } };
    return data?.session?.userId ? { userId: data.session.userId } : null;
  } catch {
    return null;
  }
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
