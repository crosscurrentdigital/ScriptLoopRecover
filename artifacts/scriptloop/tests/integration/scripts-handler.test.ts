// Integration tests for netlify/functions/scripts.ts against PGlite
// (in-process Postgres). For mutations the handlers scope by userId in
// SQL; GET-by-id selects by id and then enforces ownership in JS, which
// is functionally equivalent for these assertions.
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

import { makeSessionMock } from "../helpers/sessionMock";
const sessionMock = makeSessionMock();
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

const scriptsHandler = (await import("../../netlify/functions/scripts"))
  .default;

const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";

beforeAll(async () => {
  await seedUser(testClient, USER_A, "Alice");
  await seedUser(testClient, USER_B, "Bob");
});

beforeEach(async () => {
  // Wipe scripts+rate_limits between tests but keep the seeded users so
  // FK constraints don't fail.
  await testClient.exec(
    `TRUNCATE TABLE "scripts", "rate_limits" RESTART IDENTITY;`,
  );
  vi.clearAllMocks();
  sessionMock.getSession.mockResolvedValue({ userId: USER_A });
  audioPipelineMock.checkAudioConfig.mockReturnValue(null);
  audioPipelineMock.generateAndUploadAudio.mockResolvedValue({
    audioBytes: new Uint8Array([1, 2, 3]),
    publicUrl: "https://r2.example.com/audio/alice/1.mp3",
    durationSeconds: 1.5,
  });
});

afterAll(async () => {
  await truncateAll(testClient);
  await testClient.close();
});

describe("integration: real-DB authorization on /api/scripts/:id", () => {
  it("user A cannot read user B's script (handler enforces ownership, returns 404)", async () => {
    // Seed a row owned by USER_B.
    await testClient.query(
      `INSERT INTO scripts (user_id, title, content) VALUES ($1, $2, $3) RETURNING id`,
      [USER_B, "Bob's secret", "do not leak"],
    );
    const [{ id: bobsId }] = (
      await testClient.query<{ id: number }>(
        `SELECT id FROM scripts WHERE user_id = $1`,
        [USER_B],
      )
    ).rows;

    sessionMock.getSession.mockResolvedValue({ userId: USER_A });
    const res = await scriptsHandler(
      new Request(`http://localhost/api/scripts/${bobsId}`),
    );
    expect(res.status).toBe(404);
  });

  it("user A cannot UPDATE user B's script (WHERE id AND user_id, returns 404, row unchanged)", async () => {
    const inserted = await testClient.query<{ id: number }>(
      `INSERT INTO scripts (user_id, title, content) VALUES ($1, $2, $3) RETURNING id`,
      [USER_B, "Bob's title", "Bob's content"],
    );
    const bobsId = inserted.rows[0]!.id;

    sessionMock.getSession.mockResolvedValue({ userId: USER_A });
    const res = await scriptsHandler(
      new Request(`http://localhost/api/scripts/${bobsId}`, {
        method: "PUT",
        body: JSON.stringify({ title: "HIJACKED" }),
      }),
    );
    expect(res.status).toBe(404);

    const after = await testClient.query<{ title: string }>(
      `SELECT title FROM scripts WHERE id = $1`,
      [bobsId],
    );
    expect(after.rows[0]!.title).toBe("Bob's title");
  });

  it("user A cannot DELETE user B's script (WHERE id AND user_id, returns 404, row still present)", async () => {
    const inserted = await testClient.query<{ id: number }>(
      `INSERT INTO scripts (user_id, title, content) VALUES ($1, $2, $3) RETURNING id`,
      [USER_B, "Bob delete-target", "still here"],
    );
    const bobsId = inserted.rows[0]!.id;

    sessionMock.getSession.mockResolvedValue({ userId: USER_A });
    const res = await scriptsHandler(
      new Request(`http://localhost/api/scripts/${bobsId}`, {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(404);

    const after = await testClient.query<{ id: number }>(
      `SELECT id FROM scripts WHERE id = $1`,
      [bobsId],
    );
    expect(after.rows).toHaveLength(1);
  });

  it("GET /api/scripts only returns the caller's rows (WHERE user_id)", async () => {
    await testClient.query(
      `INSERT INTO scripts (user_id, title, content) VALUES ($1,$2,$3),($1,$4,$5),($6,$7,$8)`,
      [
        USER_A,
        "A1",
        "alice 1",
        "A2",
        "alice 2",
        USER_B,
        "B1",
        "bob 1",
      ],
    );

    sessionMock.getSession.mockResolvedValue({ userId: USER_A });
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ userId: string; title: string }>;
    expect(body).toHaveLength(2);
    expect(body.every((s) => s.userId === USER_A)).toBe(true);
    expect(body.map((s) => s.title).sort()).toEqual(["A1", "A2"]);
  });
});

describe("integration: required-field validation on POST /api/scripts", () => {
  it("rejects missing title with 400 and no row inserted (regression: handler used to crash on NOT NULL)", async () => {
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts", {
        method: "POST",
        body: JSON.stringify({ content: "no title here" }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: {
        code: string;
        details: Array<{ path: string; message: string }>;
      };
    };
    expect(body.error.code).toBe("invalid_request");
    expect(body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "title" })]),
    );

    const rows = await testClient.query(`SELECT * FROM scripts`);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects whitespace-only title with 400", async () => {
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts", {
        method: "POST",
        body: JSON.stringify({ title: "   ", content: "ok" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects missing content with 400", async () => {
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts", {
        method: "POST",
        body: JSON.stringify({ title: "ok" }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: {
        code: string;
        details: Array<{ path: string; message: string }>;
      };
    };
    expect(body.error.code).toBe("invalid_request");
    expect(body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "content" })]),
    );
  });

  it("rejects malformed JSON body with 400", async () => {
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts", {
        method: "POST",
        body: "{ not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("happy path: valid POST inserts a real row owned by the caller", async () => {
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts", {
        method: "POST",
        body: JSON.stringify({ title: "Hello", content: "World" }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: number; userId: string };
    expect(body.userId).toBe(USER_A);

    const row = await testClient.query<{ user_id: string; title: string }>(
      `SELECT user_id, title FROM scripts WHERE id = $1`,
      [body.id],
    );
    expect(row.rows[0]).toEqual({ user_id: USER_A, title: "Hello" });
  });
});

describe("integration: atomic POST /api/scripts/with-audio happy path", () => {
  it("create script → audio uploaded → row persisted → GET returns audioUrl", async () => {
    audioPipelineMock.generateAndUploadAudio.mockResolvedValueOnce({
      audioBytes: new Uint8Array([1, 2, 3]),
      publicUrl: "https://r2.example.com/audio/alice/integration.mp3",
      durationSeconds: 2.0,
    });

    const createRes = await scriptsHandler(
      new Request("http://localhost/api/scripts/with-audio", {
        method: "POST",
        body: JSON.stringify({
          title: "My memorized line",
          content: "to be or not to be",
          voiceId: "voice-1",
          loopGapSeconds: 3,
        }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      id: number;
      audioUrl: string;
      voiceId: string;
      audioSource: string;
    };
    expect(created.audioUrl).toBe(
      "https://r2.example.com/audio/alice/integration.mp3",
    );

    // Fetch via GET — the canonical user-visible round-trip.
    const getRes = await scriptsHandler(
      new Request(`http://localhost/api/scripts/${created.id}`),
    );
    expect(getRes.status).toBe(200);
    const fetched = (await getRes.json()) as {
      audioUrl: string;
      audioSource: string;
      voiceId: string;
      loopGapSeconds: number;
      userId: string;
    };
    expect(fetched).toMatchObject({
      audioUrl: "https://r2.example.com/audio/alice/integration.mp3",
      audioSource: "elevenlabs",
      voiceId: "voice-1",
      loopGapSeconds: 3,
      userId: USER_A,
    });
  });

  it("does NOT persist a row when ElevenLabs/R2 fails (no orphan row in real DB)", async () => {
    audioPipelineMock.generateAndUploadAudio.mockRejectedValueOnce(
      new audioPipelineMock.AudioPipelineError("tts down", 502, "tts"),
    );

    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts/with-audio", {
        method: "POST",
        body: JSON.stringify({
          title: "should not persist",
          content: "boom",
          voiceId: "v1",
        }),
      }),
    );
    expect(res.status).toBe(502);

    const rows = await testClient.query(
      `SELECT * FROM scripts WHERE user_id = $1`,
      [USER_A],
    );
    expect(rows.rows).toHaveLength(0);
  });
});

describe("integration: real per-user hourly rate limit (21st request denied) on /api/scripts/with-audio", () => {
  it("allows 20 calls in the same hour and denies the 21st with 429", async () => {
    audioPipelineMock.generateAndUploadAudio.mockResolvedValue({
      audioBytes: new Uint8Array([1]),
      publicUrl: "https://r2.example.com/audio/alice/rate.mp3",
      durationSeconds: 0.1,
    });

    // 20 successful create-with-audio calls (each increments the real
    // rate_limits row in pglite via ON CONFLICT DO UPDATE).
    for (let i = 0; i < 20; i++) {
      const r = await scriptsHandler(
        new Request("http://localhost/api/scripts/with-audio", {
          method: "POST",
          body: JSON.stringify({
            title: `t${i}`,
            content: `c${i}`,
            voiceId: "v1",
          }),
        }),
      );
      expect(r.status).toBe(201);
    }

    // 21st call must be denied by the real limiter.
    const denied = await scriptsHandler(
      new Request("http://localhost/api/scripts/with-audio", {
        method: "POST",
        body: JSON.stringify({
          title: "over limit",
          content: "should be blocked",
          voiceId: "v1",
        }),
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

    // The denied call must NOT have generated audio or inserted a row.
    expect(
      audioPipelineMock.generateAndUploadAudio,
    ).toHaveBeenCalledTimes(20);
    const rows = await testClient.query(
      `SELECT count(*)::int AS n FROM scripts WHERE user_id = $1`,
      [USER_A],
    );
    expect(rows.rows[0]).toEqual({ n: 20 });

    // And the rate_limits table reflects exactly 21 increments.
    const rl = await testClient.query<{ count: number }>(
      `SELECT count FROM rate_limits WHERE user_id = $1 AND route = 'generate-audio'`,
      [USER_A],
    );
    expect(rl.rows[0]!.count).toBe(21);
  }, 30_000);
});
