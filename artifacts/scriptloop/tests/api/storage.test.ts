import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionMock = {
  getSession: vi.fn(),
  jsonResponse: (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
};
vi.mock("../../netlify/functions/_lib/session", () => sessionMock);

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example/upload"),
}));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({})),
  PutObjectCommand: vi.fn((input) => ({ input })),
}));

const storageHandler = (await import("../../netlify/functions/storage"))
  .default;

beforeEach(() => {
  sessionMock.getSession.mockResolvedValue({ userId: "user-A" });
  process.env.R2_BUCKET_NAME = "bucket";
  process.env.R2_PUBLIC_URL = "https://pub.example.com";
});
afterEach(() => vi.clearAllMocks());

describe("POST /api/storage/presign", () => {
  it("returns 401 without session", async () => {
    sessionMock.getSession.mockResolvedValueOnce(null);
    const res = await storageHandler(
      new Request("http://localhost/api/storage/presign", {
        method: "POST",
        body: JSON.stringify({
          fileName: "x.mp3",
          contentType: "audio/mpeg",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 405 on GET", async () => {
    const res = await storageHandler(
      new Request("http://localhost/api/storage/presign"),
    );
    expect(res.status).toBe(405);
  });

  it("returns 400 on invalid filename", async () => {
    const res = await storageHandler(
      new Request("http://localhost/api/storage/presign", {
        method: "POST",
        body: JSON.stringify({
          fileName: "../weird name.mp3",
          contentType: "audio/mpeg",
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid JSON", async () => {
    const res = await storageHandler(
      new Request("http://localhost/api/storage/presign", {
        method: "POST",
        body: "{not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns presigned uploadUrl + scoped publicUrl on success", async () => {
    const res = await storageHandler(
      new Request("http://localhost/api/storage/presign", {
        method: "POST",
        body: JSON.stringify({
          fileName: "audio.mp3",
          contentType: "audio/mpeg",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      uploadUrl: string;
      publicUrl: string;
      key: string;
    };
    expect(body.uploadUrl).toBe("https://signed.example/upload");
    expect(body.publicUrl).toMatch(/^https:\/\/pub\.example\.com\/audio\/user-A\//);
    expect(body.key).toMatch(/^audio\/user-A\/\d+-[a-f0-9]{32}-audio\.mp3$/);
  });
});
