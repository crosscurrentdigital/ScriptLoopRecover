import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    const data = (await res.json()) as {
      session?: { userId?: string };
    };
    return data?.session?.userId ? { userId: data.session.userId } : null;
  } catch {
    return null;
  }
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await getSession(req);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { fileName, contentType } = (await req.json()) as {
    fileName: string;
    contentType: string;
  };

  const key = `audio/${session.userId}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return new Response(JSON.stringify({ uploadUrl, publicUrl, key }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/storage/presign",
};
