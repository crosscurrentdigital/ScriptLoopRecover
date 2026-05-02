// /api/generate-audio against a real PGlite-backed rate_limits table.
// Only ElevenLabs/R2 are stubbed.
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { makeTestDb, seedUser, truncateAll } from "../helpers/testDb";

const { db: testDb, client: testClient } = await makeTestDb();

vi.mock("../../src/db/index", () => ({ db: testDb }));

const sessionMock = {
  getSession: vi.fn(),
  jsonResponse: (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
};
vi.mock("../../netlify/functions/_lib/session", () => sessionMock);

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
const scriptsHandler = (await import("../../netlify/functions/scripts"))
  .default;

const USER_A = "11111111-1111-1111-1111-111111111111";

beforeAll(async () => {
  await seedUser(testClient, USER_A, "Alice");
});

beforeEach(async () => {
  await testClient.exec(
    `TRUNCATE TABLE "scripts", "rate_limits" RESTART IDENTITY;`,
  );
  vi.clearAllMocks();
  sessionMock.getSession.mockResolvedValue({ userId: USER_A });
  audioPipelineMock.checkAudioConfig.mockReturnValue(null);
  audioPipelineMock.generateAndUploadAudio.mockResolvedValue({
    audioBytes: new Uint8Array([1]),
    publicUrl: "https://r2.example.com/audio/alice/x.mp3",
    durationSeconds: 0.1,
  });
});

afterAll(async () => {
  await truncateAll(testClient);
  await testClient.close();
});

describe("integration: real hourly limit on /api/generate-audio", () => {
  it("returns 200 for the first 20 calls and 429 for the 21st (real DB upsert)", async () => {
    for (let i = 0; i < 20; i++) {
      const r = await generateAudioHandler(
        new Request("http://localhost/api/generate-audio", {
          method: "POST",
          body: JSON.stringify({ text: `t${i}`, voiceId: "v1" }),
        }),
      );
      expect(r.status).toBe(200);
    }

    const denied = await generateAudioHandler(
      new Request("http://localhost/api/generate-audio", {
        method: "POST",
        body: JSON.stringify({ text: "over limit", voiceId: "v1" }),
      }),
    );
    expect(denied.status).toBe(429);
    const body = (await denied.json()) as {
      error: {
        code: string;
        message: string;
        retryAfterSeconds: number;
        details: { limit: number };
      };
    };
    expect(body.error.code).toBe("rate_limited");
    expect(body.error.details.limit).toBe(20);
    expect(denied.headers.get("Retry-After")).toBeTruthy();

    expect(
      audioPipelineMock.generateAndUploadAudio,
    ).toHaveBeenCalledTimes(20);

    const rl = await testClient.query<{ count: number; n: number }>(
      `SELECT count, (SELECT count(*)::int FROM rate_limits) AS n
         FROM rate_limits
         WHERE user_id = $1 AND route = 'generate-audio'`,
      [USER_A],
    );
    expect(rl.rows).toHaveLength(1);
    expect(rl.rows[0]).toEqual({ count: 21, n: 1 });
  }, 30_000);

  it("attaches audio to a script: POST /api/scripts -> POST /api/generate-audio -> GET /api/scripts/:id has audioUrl", async () => {
    audioPipelineMock.generateAndUploadAudio.mockResolvedValueOnce({
      audioBytes: new Uint8Array([9, 9, 9]),
      publicUrl: "https://r2.example.com/audio/alice/attach.mp3",
      durationSeconds: 1.25,
    });

    const created = await scriptsHandler(
      new Request("http://localhost/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "My take", content: "Hello world" }),
      }),
    );
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as { id: number };
    const scriptId = createdBody.id;
    expect(typeof scriptId).toBe("number");

    const gen = await generateAudioHandler(
      new Request("http://localhost/api/generate-audio", {
        method: "POST",
        body: JSON.stringify({
          text: "Hello world",
          voiceId: "v1",
          scriptId,
        }),
      }),
    );
    expect(gen.status).toBe(200);
    const genBody = (await gen.json()) as {
      audioUrl: string;
      script: { id: number; audioUrl: string } | null;
    };
    expect(genBody.audioUrl).toBe("https://r2.example.com/audio/alice/attach.mp3");
    expect(genBody.script?.id).toBe(scriptId);
    expect(genBody.script?.audioUrl).toBe(
      "https://r2.example.com/audio/alice/attach.mp3",
    );

    const fetched = await scriptsHandler(
      new Request(`http://localhost/api/scripts/${scriptId}`, {
        method: "GET",
      }),
    );
    expect(fetched.status).toBe(200);
    const fetchedBody = (await fetched.json()) as { audioUrl: string };
    expect(fetchedBody.audioUrl).toBe(
      "https://r2.example.com/audio/alice/attach.mp3",
    );
  });
});
