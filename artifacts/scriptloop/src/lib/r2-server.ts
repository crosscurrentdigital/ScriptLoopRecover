import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
  return cachedClient;
}

export interface ServerUploadResult {
  publicUrl: string;
  key: string;
}

export async function uploadBufferToR2(
  body: ArrayBuffer | Uint8Array,
  key: string,
  contentType: string,
): Promise<ServerUploadResult> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_URL;
  if (!bucket || !publicBase) {
    throw new Error("R2 bucket is not configured");
  }

  const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    }),
  );

  const publicUrl = `${publicBase.replace(/\/$/, "")}/${key}`;
  return { publicUrl, key };
}
