import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { and, eq } from "drizzle-orm";
import { db } from "../../src/db/index";
import { scripts } from "../../src/db/schema";
import { textToSpeech, getVoices } from "../../src/lib/elevenlabs";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

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

  if (url.pathname.endsWith("/generate") && req.method === "POST") {
    const body = (await req.json()) as {
      scriptId: number;
      voiceId: string;
    };

    if (!body.scriptId || !body.voiceId) {
      return json({ error: "scriptId and voiceId are required" }, 400);
    }

    const [script] = await db
      .select()
      .from(scripts)
      .where(
        and(
          eq(scripts.id, body.scriptId),
          eq(scripts.userId, session.userId),
        ),
      );

    if (!script) return json({ error: "Script not found" }, 404);
    if (!script.content?.trim()) {
      return json({ error: "Script content is empty" }, 400);
    }

    let audioBuffer: ArrayBuffer;
    try {
      audioBuffer = await textToSpeech(apiKey, {
        voiceId: body.voiceId,
        text: script.content,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "TTS failed";
      return json({ error: msg }, 502);
    }

    const key = `audio/${session.userId}/${script.id}-${Date.now()}.mp3`;
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: new Uint8Array(audioBuffer),
          ContentType: "audio/mpeg",
        }),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "R2 upload failed";
      return json({ error: msg }, 502);
    }

    const publicUrl = `${process.env.R2_PUBLIC_URL?.replace(/\/$/, "")}/${key}`;

    const [updated] = await db
      .update(scripts)
      .set({
        audioUrl: publicUrl,
        audioSource: "tts",
        voiceId: body.voiceId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(scripts.id, body.scriptId),
          eq(scripts.userId, session.userId),
        ),
      )
      .returning();

    return json(updated);
  }

  return json({ error: "Not found" }, 404);
};

export const config = {
  path: "/api/audio/*",
};
