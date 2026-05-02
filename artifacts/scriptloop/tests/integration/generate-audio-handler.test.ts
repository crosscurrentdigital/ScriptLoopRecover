/**
 * Integration test for /api/generate-audio against a real in-process
 * Postgres (PGlite). The rate-limit table, ON CONFLICT DO UPDATE upsert,
 * and per-user/per-route bucket logic are NOT mocked — only ElevenLabs
 * and R2 are stubbed via the audioPipeline mock.
 *
 * This is the canonical end-to-end exercise of the per-user hourly
 * limit: 20 successful calls then a 21st that must return 429.
 */
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
    const body = (await denied.json()) as { error: string; limit: number };
    expect(body.error).toBe("rate_limited");
    expect(body.limit).toBe(20);
    expect(denied.headers.get("Retry-After")).toBeTruthy();

    // The 21st call must NOT have generated audio.
    expect(
      audioPipelineMock.generateAndUploadAudio,
    ).toHaveBeenCalledTimes(20);

    // Real DB state: exactly one rate_limits row reflecting 21 increments.
    // (If the unique constraint on (user_id, route, window_start) were
    // missing, ON CONFLICT DO UPDATE would have raised instead, and we
    // would either see N rows here or earlier 500s above.)
    const rl = await testClient.query<{ count: number; n: number }>(
      `SELECT count, (SELECT count(*)::int FROM rate_limits) AS n
         FROM rate_limits
         WHERE user_id = $1 AND route = 'generate-audio'`,
      [USER_A],
    );
    expect(rl.rows).toHaveLength(1);
    expect(rl.rows[0]).toEqual({ count: 21, n: 1 });
  }, 30_000);
});
