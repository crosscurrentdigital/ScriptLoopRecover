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

vi.mock("../../src/lib/elevenlabs", () => ({
  getVoices: vi.fn(),
}));

const elevenlabs = await import("../../src/lib/elevenlabs");
const audioHandler = (await import("../../netlify/functions/audio")).default;

beforeEach(() => {
  resetDbState();
  sessionMock.getSession.mockResolvedValue({ userId: "user-A" });
  process.env.ELEVENLABS_API_KEY = "test-key";
});
afterEach(() => vi.clearAllMocks());

describe("GET /api/audio/quota", () => {
  it("returns the bucket usage", async () => {
    dbState.selectResult = [{ count: 3 }];
    const res = await audioHandler(
      new Request("http://localhost/api/audio/quota"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      used: number;
      limit: number;
      resetsAt: string;
    };
    expect(body.used).toBe(3);
    expect(body.limit).toBe(20);
    expect(typeof body.resetsAt).toBe("string");
  });

  it("returns 401 without a session", async () => {
    sessionMock.getSession.mockResolvedValueOnce(null);
    const res = await audioHandler(
      new Request("http://localhost/api/audio/quota"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 405 on non-GET", async () => {
    const res = await audioHandler(
      new Request("http://localhost/api/audio/quota", { method: "POST" }),
    );
    expect(res.status).toBe(405);
  });
});

describe("GET /api/audio/voices", () => {
  it("returns voice list when ElevenLabs is configured", async () => {
    (elevenlabs.getVoices as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { voice_id: "v1", name: "Alpha", preview_url: "p" },
    ]);
    const res = await audioHandler(
      new Request("http://localhost/api/audio/voices"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ voice_id: string }>;
    expect(body[0].voice_id).toBe("v1");
  });

  it("returns 502 when ElevenLabs throws", async () => {
    (elevenlabs.getVoices as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("upstream"),
    );
    const res = await audioHandler(
      new Request("http://localhost/api/audio/voices"),
    );
    expect(res.status).toBe(502);
  });

  it("returns 500 not_configured when API key missing", async () => {
    process.env.ELEVENLABS_API_KEY = "";
    const res = await audioHandler(
      new Request("http://localhost/api/audio/voices"),
    );
    expect(res.status).toBe(500);
  });
});

describe("unknown subroute", () => {
  it("returns 404 when path is neither quota nor voices", async () => {
    const res = await audioHandler(
      new Request("http://localhost/api/audio/something-else"),
    );
    expect(res.status).toBe(404);
  });
});
