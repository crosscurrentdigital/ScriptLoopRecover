export interface UploadResult {
  url: string;
  key: string;
}

export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const response = await fetch("/api/storage/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, contentType }),
  });

  if (!response.ok) {
    throw new Error("Failed to get presigned URL");
  }

  return response.json() as Promise<{
    uploadUrl: string;
    publicUrl: string;
    key: string;
  }>;
}

export async function uploadToR2(
  file: Blob,
  fileName: string,
  contentType: string,
): Promise<UploadResult> {
  const { uploadUrl, publicUrl, key } = await getPresignedUploadUrl(
    fileName,
    contentType,
  );

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "contentType" },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to R2");
  }

  return { url: publicUrl, key };
}
