import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb, resetDbState } from "../helpers/dbMock";

vi.mock("../../src/db/index", () => ({ db: fakeDb }));

const sessionMock = {
  getSession: vi.fn(),
  jsonResponse: (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
};
vi.mock("../../netlify/functions/_lib/session", () => sessionMock);

const rateLimitMock = {
  checkAndIncrement: vi.fn(),
  rateLimitResponse: (result: { retryAfterSeconds: number; limit: number }) =>
    new Response(
      JSON.stringify({
        error: "rate_limited",
        message: "limit reached",
        retryAfterSeconds: result.retryAfterSeconds,
        limit: result.limit,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfterSeconds),
        },
      },
    ),
};
vi.mock("../../netlify/functions/_lib/rateLimit", () => rateLimitMock);

const audioPipelineMock = {
  MAX_TEXT_LENGTH: 2000,
  AudioPipelineError: class extends Error {
    status: number;
    stage: string;
    constructor(message: string, status: number, stage: string) {
      super(message);
      this.status = status;
      this.stage = stage;
    }
  },
  checkAudioConfig: vi.fn((): string | null => null),
  generateAndUploadAudio: vi.fn(),
  estimateDurationSeconds: vi.fn(() => 1.0),
};
vi.mock("../../netlify/functions/_lib/audioPipeline", () => audioPipelineMock);

const generateAudioHandler = (
  await import("../../netlify/functions/generate-audio")
).default;

beforeEach(() => {
  resetDbState();
  sessionMock.getSession.mockResolvedValue({ userId: "user-A" });
  rateLimitMock.checkAndIncrement.mockResolvedValue({
    allowed: true,
    count: 1,
    limit: 20,
    retryAfterSeconds: 3600,
  });
  audioPipelineMock.checkAudioConfig.mockReturnValue(null);
  audioPipelineMock.generateAndUploadAudio.mockResolvedValue({
    audioBytes: new Uint8Array(),
    publicUrl: "https://r2.example.com/audio/user-A/123.mp3",
    durationSeconds: 1.5,
  });
});
afterEach(() => vi.clearAllMocks());

function post(body: unknown): Request {
  return new Request("http://localhost/api/generate-audio", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("/api/generate-audio: input validation", () => {
  it("rejects missing text with 400", async () => {
    const res = await generateAudioHandler(post({ voiceId: "v1" }));
    expect(res.status).toBe(400);
    expect(audioPipelineMock.generateAndUploadAudio).not.toHaveBeenCalled();
  });

  it("rejects oversized text with 400 too_long", async () => {
    const res = await generateAudioHandler(
      post({ text: "x".repeat(2001), voiceId: "v1" }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("invalid_request");
    expect(body.error.message).toMatch(/2000/);
    expect(audioPipelineMock.generateAndUploadAudio).not.toHaveBeenCalled();
  });

  it("rejects missing voiceId with 400", async () => {
    const res = await generateAudioHandler(post({ text: "hello" }));
    expect(res.status).toBe(400);
    expect(audioPipelineMock.generateAndUploadAudio).not.toHaveBeenCalled();
  });

  it("rejects empty/whitespace voiceId with 400", async () => {
    const res = await generateAudioHandler(
      post({ text: "hello", voiceId: "   " }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects non-string voiceId (e.g. number) with 400", async () => {
    const res = await generateAudioHandler(
      post({ text: "hello", voiceId: 12345 }),
    );
    expect(res.status).toBe(400);
    expect(audioPipelineMock.generateAndUploadAudio).not.toHaveBeenCalled();
  });

  it("rejects non-string text (e.g. number) with 400", async () => {
    const res = await generateAudioHandler(post({ text: 42, voiceId: "v1" }));
    expect(res.status).toBe(400);
  });

  it("rejects non-POST methods with 405", async () => {
    const res = await generateAudioHandler(
      new Request("http://localhost/api/generate-audio", { method: "GET" }),
    );
    expect(res.status).toBe(405);
  });
});

describe("/api/generate-audio: rate limiting", () => {
  it("returns 429 when the rate limiter denies the request", async () => {
    rateLimitMock.checkAndIncrement.mockResolvedValueOnce({
      allowed: false,
      count: 21,
      limit: 20,
      retryAfterSeconds: 1800,
    });
    const res = await generateAudioHandler(
      post({ text: "hi", voiceId: "v1" }),
    );
    expect(res.status).toBe(429);
    const body = (await res.json()) as {
      error: string;
      retryAfterSeconds: number;
      limit: number;
    };
    expect(body.error).toBe("rate_limited");
    expect(body.limit).toBe(20);
    expect(body.retryAfterSeconds).toBe(1800);
    expect(res.headers.get("Retry-After")).toBe("1800");
    // Confirms wiring: no audio is generated when the limiter denies.
    expect(audioPipelineMock.generateAndUploadAudio).not.toHaveBeenCalled();
  });

  it("calls the rate limiter exactly once per allowed request", async () => {
    await generateAudioHandler(post({ text: "hi", voiceId: "v1" }));
    expect(rateLimitMock.checkAndIncrement).toHaveBeenCalledTimes(1);
    expect(rateLimitMock.checkAndIncrement).toHaveBeenCalledWith({
      userId: "user-A",
      route: "generate-audio",
    });
  });
});

describe("/api/generate-audio: TTS / upload errors", () => {
  it("propagates AudioPipelineError status to the response", async () => {
    audioPipelineMock.generateAndUploadAudio.mockRejectedValueOnce(
      new audioPipelineMock.AudioPipelineError("boom", 502, "tts"),
    );
    const res = await generateAudioHandler(
      post({ text: "hi", voiceId: "v1" }),
    );
    expect(res.status).toBe(502);
    const body = (await res.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("upstream_error");
    expect(body.error.message).toBe("boom");
  });

  it("returns 500 when ElevenLabs/R2 are not configured", async () => {
    audioPipelineMock.checkAudioConfig.mockReturnValueOnce(
      "ElevenLabs is not configured",
    );
    const res = await generateAudioHandler(
      post({ text: "hi", voiceId: "v1" }),
    );
    expect(res.status).toBe(500);
  });
});
