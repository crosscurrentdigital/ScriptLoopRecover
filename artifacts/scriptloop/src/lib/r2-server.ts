import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

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
      // Audio objects use unique, content-versioned keys
      // (`audio/<userId>/<timestamp>-generated.mp3`), so the bytes at a
      // given URL never change — long, immutable browser caching is safe.
      // Privacy posture is "public-by-design behind an unguessable URL"
      // (see `replit.md` → Audio privacy posture); the cache header is
      // explicitly `public` to match.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const publicUrl = `${publicBase.replace(/\/$/, "")}/${key}`;
  return { publicUrl, key };
}

/**
 * Map a stored audio URL back to the R2 object key, or return null when
 * the URL is empty / not hosted on our configured public base. Used by
 * {@link deleteObjectByPublicUrl} to revoke leaked URLs on rotation.
 */
export function publicUrlToKey(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const base = process.env.R2_PUBLIC_URL;
  if (!base) return null;
  const normalizedBase = base.replace(/\/$/, "") + "/";
  if (!publicUrl.startsWith(normalizedBase)) return null;
  const key = publicUrl.slice(normalizedBase.length);
  return key.length > 0 ? key : null;
}

/**
 * Best-effort delete of a previously uploaded R2 object given its public
 * URL. Used to actually revoke access after a leaked-URL rotation
 * (regenerate) so the old object stops being playable. Returns true if a
 * delete request was issued and accepted, false if the URL did not map to
 * our bucket. Throws on R2 / network errors so callers can decide whether
 * to surface or just log them — generation is the user-facing action and
 * should not fail because cleanup failed.
 */
export async function deleteObjectByPublicUrl(
  publicUrl: string | null | undefined,
): Promise<boolean> {
  const key = publicUrlToKey(publicUrl);
  if (!key) return false;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) return false;
  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key }),
  );
  return true;
}
