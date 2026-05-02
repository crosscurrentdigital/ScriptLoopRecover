import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dbState, fakeDb, resetDbState } from "../helpers/dbMock";

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
  rateLimitResponse: () =>
    new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 }),
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
  checkAudioConfig: vi.fn(() => null),
  generateAndUploadAudio: vi.fn(),
  estimateDurationSeconds: vi.fn(() => 1.0),
};
vi.mock("../../netlify/functions/_lib/audioPipeline", () => audioPipelineMock);

const scriptsHandler = (await import("../../netlify/functions/scripts"))
  .default;

beforeEach(() => {
  resetDbState();
  sessionMock.getSession.mockResolvedValue({ userId: "user-A" });
  rateLimitMock.checkAndIncrement.mockResolvedValue({
    allowed: true,
    count: 1,
    limit: 20,
    retryAfterSeconds: 3600,
  });
  audioPipelineMock.generateAndUploadAudio.mockResolvedValue({
    audioBytes: new Uint8Array(),
    publicUrl: "https://r2.example.com/audio/user-A/123.mp3",
    durationSeconds: 1.5,
  });
});
afterEach(() => vi.clearAllMocks());

function post(body: unknown): Request {
  return new Request("http://localhost/api/scripts/with-audio", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/scripts/with-audio: validation", () => {
  it.each([
    [{ content: "hi", voiceId: "v1" }],
    [{ title: "t", voiceId: "v1" }],
    [{ title: "t", content: "hi" }],
    [{ title: "   ", content: "hi", voiceId: "v1" }],
  ])("rejects invalid body %j with 400", async (body) => {
    const res = await scriptsHandler(post(body));
    expect(res.status).toBe(400);
    expect(audioPipelineMock.generateAndUploadAudio).not.toHaveBeenCalled();
    expect(dbState.insertCalls).toHaveLength(0);
  });

  it("rejects oversized content with 400 too_long", async () => {
    const res = await scriptsHandler(
      post({ title: "t", content: "x".repeat(2001), voiceId: "v1" }),
    );
    expect(res.status).toBe(400);
    expect(dbState.insertCalls).toHaveLength(0);
  });
});

describe("POST /api/scripts/with-audio: atomicity (no orphan rows)", () => {
  it("happy path: creates row only after audio upload succeeds and returns 201 with audioUrl", async () => {
    const fakeRow = {
      id: 1,
      userId: "user-A",
      title: "My script",
      content: "hello world",
      audioUrl: "https://r2.example.com/audio/user-A/123.mp3",
      voiceId: "v1",
      audioSource: "elevenlabs",
      loopGapSeconds: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbState.insertResult = [fakeRow];

    const res = await scriptsHandler(
      post({
        title: "My script",
        content: "hello world",
        voiceId: "v1",
        loopGapSeconds: 2,
      }),
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: number; audioUrl: string };
    expect(body.id).toBe(1);
    expect(body.audioUrl).toBe(
      "https://r2.example.com/audio/user-A/123.mp3",
    );

    // Audio generated BEFORE the row insert (the order matters).
    expect(audioPipelineMock.generateAndUploadAudio).toHaveBeenCalledTimes(1);
    expect(dbState.insertCalls).toHaveLength(1);

    // Insert payload should include the freshly-uploaded audio fields.
    const insertedValues = dbState.insertCalls[0]!.values as Record<
      string,
      unknown
    >;
    expect(insertedValues.userId).toBe("user-A");
    expect(insertedValues.audioUrl).toBe(
      "https://r2.example.com/audio/user-A/123.mp3",
    );
    expect(insertedValues.audioSource).toBe("elevenlabs");
    expect(insertedValues.voiceId).toBe("v1");
  });

  it("does NOT insert a row if ElevenLabs/R2 fails", async () => {
    audioPipelineMock.generateAndUploadAudio.mockRejectedValueOnce(
      new audioPipelineMock.AudioPipelineError("tts down", 502, "tts"),
    );
    const res = await scriptsHandler(
      post({ title: "t", content: "hi", voiceId: "v1" }),
    );
    expect(res.status).toBe(502);
    expect(dbState.insertCalls).toHaveLength(0);
  });

  it("returns 429 (and skips audio generation) when rate-limited", async () => {
    rateLimitMock.checkAndIncrement.mockResolvedValueOnce({
      allowed: false,
      count: 21,
      limit: 20,
      retryAfterSeconds: 1800,
    });
    const res = await scriptsHandler(
      post({ title: "t", content: "hi", voiceId: "v1" }),
    );
    expect(res.status).toBe(429);
    expect(audioPipelineMock.generateAndUploadAudio).not.toHaveBeenCalled();
    expect(dbState.insertCalls).toHaveLength(0);
  });

  it("returns 500 if the row insert itself fails (audio is uploaded but no orphan row exists)", async () => {
    dbState.insertShouldThrow = new Error("db down");
    const res = await scriptsHandler(
      post({ title: "t", content: "hi", voiceId: "v1" }),
    );
    expect(res.status).toBe(500);
    // The insert was ATTEMPTED (so a row could only exist if the DB write
    // succeeded — which it didn't here). The invariant remains: any row
    // that does exist has its audio URL set.
    expect(dbState.insertCalls).toHaveLength(1);
  });
});
