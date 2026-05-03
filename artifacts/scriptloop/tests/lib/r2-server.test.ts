import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: vi.fn(() => ({ send: sendMock })),
    PutObjectCommand: vi.fn((input) => ({ __cmd: "Put", input })),
    DeleteObjectCommand: vi.fn((input) => ({ __cmd: "Delete", input })),
  };
});

const r2 = await import("@/lib/r2-server");

beforeEach(() => {
  sendMock.mockReset();
  process.env.R2_BUCKET_NAME = "test-bucket";
  process.env.R2_PUBLIC_URL = "https://pub.example.com";
});
afterEach(() => vi.clearAllMocks());

describe("uploadBufferToR2", () => {
  it("uploads with PutObjectCommand and returns publicUrl", async () => {
    sendMock.mockResolvedValueOnce({});
    const out = await r2.uploadBufferToR2(
      new Uint8Array([1, 2, 3]),
      "audio/u/123-x.mp3",
      "audio/mpeg",
    );
    expect(out).toEqual({
      publicUrl: "https://pub.example.com/audio/u/123-x.mp3",
      key: "audio/u/123-x.mp3",
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0];
    expect(cmd.__cmd).toBe("Put");
    expect(cmd.input.Bucket).toBe("test-bucket");
    expect(cmd.input.CacheControl).toMatch(/immutable/);
  });

  it("strips trailing slash from public base", async () => {
    process.env.R2_PUBLIC_URL = "https://pub.example.com/";
    sendMock.mockResolvedValueOnce({});
    const out = await r2.uploadBufferToR2(
      new Uint8Array([1]),
      "audio/u/k.mp3",
      "audio/mpeg",
    );
    expect(out.publicUrl).toBe("https://pub.example.com/audio/u/k.mp3");
  });

  it("accepts ArrayBuffer input", async () => {
    sendMock.mockResolvedValueOnce({});
    const out = await r2.uploadBufferToR2(
      new ArrayBuffer(4),
      "audio/u/k.mp3",
      "audio/mpeg",
    );
    expect(out.key).toBe("audio/u/k.mp3");
  });

  it("throws when R2 not configured", async () => {
    process.env.R2_BUCKET_NAME = "";
    await expect(
      r2.uploadBufferToR2(new Uint8Array([1]), "k", "audio/mpeg"),
    ).rejects.toThrow(/not configured/);
  });
});

describe("publicUrlToKey", () => {
  it("returns null for empty input", () => {
    expect(r2.publicUrlToKey(null)).toBeNull();
    expect(r2.publicUrlToKey("")).toBeNull();
    expect(r2.publicUrlToKey(undefined)).toBeNull();
  });
  it("returns null when no public base set", () => {
    process.env.R2_PUBLIC_URL = "";
    expect(r2.publicUrlToKey("https://x/y.mp3")).toBeNull();
  });
  it("returns null when URL doesn't match base", () => {
    expect(r2.publicUrlToKey("https://other.com/audio/u/k.mp3")).toBeNull();
  });
  it("extracts key from matching URL", () => {
    expect(
      r2.publicUrlToKey("https://pub.example.com/audio/u/k.mp3"),
    ).toBe("audio/u/k.mp3");
  });
});

describe("deleteObjectByPublicUrl", () => {
  it("returns false when URL doesn't map to bucket", async () => {
    const ok = await r2.deleteObjectByPublicUrl("https://other/file.mp3");
    expect(ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });
  it("returns false when bucket env missing", async () => {
    process.env.R2_BUCKET_NAME = "";
    const ok = await r2.deleteObjectByPublicUrl(
      "https://pub.example.com/audio/u/k.mp3",
    );
    expect(ok).toBe(false);
  });
  it("issues DeleteObjectCommand for matching URL", async () => {
    sendMock.mockResolvedValueOnce({});
    const ok = await r2.deleteObjectByPublicUrl(
      "https://pub.example.com/audio/u/k.mp3",
    );
    expect(ok).toBe(true);
    const cmd = sendMock.mock.calls[0][0];
    expect(cmd.__cmd).toBe("Delete");
    expect(cmd.input.Key).toBe("audio/u/k.mp3");
  });
});
