import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSession } from "./_lib/session";
import { withSentry } from "./_lib/sentry";
import { errorResponse, parseJsonBody, presignSchema } from "./_lib/schemas";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return errorResponse(405, "method_not_allowed", "Method not allowed.");
  }

  const session = await getSession(req);
  if (!session) {
    return errorResponse(401, "unauthorized", "Sign in to continue.");
  }

  const parsed = await parseJsonBody(req, presignSchema);
  if (!parsed.ok) return parsed.response;
  const { fileName, contentType } = parsed.data;

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

export default withSentry("/api/storage/presign", handler);

export const config = {
  path: "/api/storage/presign",
};
