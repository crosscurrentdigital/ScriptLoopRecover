import { getVoices } from "../../src/lib/elevenlabs";

async function getSession(
  req: Request,
): Promise<{ userId: string } | null> {
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req: Request) => {
  const session = await getSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);

  const url = new URL(req.url);
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return json({ error: "ElevenLabs not configured" }, 500);

  if (url.pathname.endsWith("/voices") && req.method === "GET") {
    try {
      const voices = await getVoices(apiKey);
      return json(
        voices.map((v) => ({
          voice_id: v.voice_id,
          name: v.name,
          preview_url: v.preview_url,
        })),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return json({ error: msg }, 502);
    }
  }

  return json({ error: "Not found" }, 404);
};

export const config = {
  path: "/api/audio/*",
};
