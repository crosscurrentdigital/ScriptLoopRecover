import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dbState, fakeDb, resetDbState } from "../helpers/dbMock";
import { DEFAULT_PREFERENCES } from "@/lib/reading-preferences";

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

const preferencesHandler = (
  await import("../../netlify/functions/preferences")
).default;

beforeEach(() => {
  resetDbState();
  sessionMock.getSession.mockResolvedValue({ userId: "user-A" });
});
afterEach(() => vi.clearAllMocks());

describe("/api/preferences auth", () => {
  it("returns 401 when there is no session (GET)", async () => {
    sessionMock.getSession.mockResolvedValueOnce(null);
    const res = await preferencesHandler(
      new Request("http://localhost/api/preferences"),
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("unauthorized");
  });

  it("returns 401 when there is no session (PUT)", async () => {
    sessionMock.getSession.mockResolvedValueOnce(null);
    const res = await preferencesHandler(
      new Request("http://localhost/api/preferences", {
        method: "PUT",
        body: JSON.stringify({ reading: DEFAULT_PREFERENCES }),
      }),
    );
    expect(res.status).toBe(401);
    expect(dbState.insertCalls).toHaveLength(0);
  });
});

describe("GET /api/preferences", () => {
  it("returns { reading: null } when no row exists for the user", async () => {
    dbState.selectResult = [];
    const res = await preferencesHandler(
      new Request("http://localhost/api/preferences"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reading: unknown };
    expect(body).toEqual({ reading: null });
  });

  it("returns the stored reading prefs when a row exists", async () => {
    const stored = {
      ...DEFAULT_PREFERENCES,
      fontFamily: "lexend",
      fontSize: 22,
    };
    dbState.selectResult = [
      { userId: "user-A", reading: stored, updatedAt: new Date() },
    ];
    const res = await preferencesHandler(
      new Request("http://localhost/api/preferences"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reading: typeof stored };
    expect(body.reading).toEqual(stored);
  });
});

describe("PUT /api/preferences validation", () => {
  it("rejects bodies missing the `reading` field with 400", async () => {
    const res = await preferencesHandler(
      new Request("http://localhost/api/preferences", {
        method: "PUT",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    expect(dbState.insertCalls).toHaveLength(0);
  });

  it("rejects out-of-range numeric values with 400", async () => {
    const res = await preferencesHandler(
      new Request("http://localhost/api/preferences", {
        method: "PUT",
        body: JSON.stringify({
          reading: { ...DEFAULT_PREFERENCES, fontSize: 999 },
        }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("invalid_request");
    expect(dbState.insertCalls).toHaveLength(0);
  });

  it("rejects unknown extra keys with 400 (strict schema)", async () => {
    const res = await preferencesHandler(
      new Request("http://localhost/api/preferences", {
        method: "PUT",
        body: JSON.stringify({
          reading: DEFAULT_PREFERENCES,
          extra: "nope",
        }),
      }),
    );
    expect(res.status).toBe(400);
    expect(dbState.insertCalls).toHaveLength(0);
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await preferencesHandler(
      new Request("http://localhost/api/preferences", {
        method: "PUT",
        body: "{not json",
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/preferences upsert + readback", () => {
  it("upserts the row and returns the saved reading prefs", async () => {
    const newPrefs = {
      ...DEFAULT_PREFERENCES,
      fontFamily: "georgia",
      fontSize: 24,
    };
    dbState.insertResult = [
      { userId: "user-A", reading: newPrefs, updatedAt: new Date() },
    ];

    const res = await preferencesHandler(
      new Request("http://localhost/api/preferences", {
        method: "PUT",
        body: JSON.stringify({ reading: newPrefs }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { reading: typeof newPrefs };
    expect(body.reading).toEqual(newPrefs);

    expect(dbState.insertCalls).toHaveLength(1);
    const inserted = dbState.insertCalls[0].values as {
      userId: string;
      reading: typeof newPrefs;
    };
    expect(inserted.userId).toBe("user-A");
    expect(inserted.reading).toEqual(newPrefs);

    // A subsequent GET on the same dbState (simulating readback) should
    // surface the same row that the upsert wrote.
    dbState.selectResult = [
      { userId: "user-A", reading: newPrefs, updatedAt: new Date() },
    ];
    const getRes = await preferencesHandler(
      new Request("http://localhost/api/preferences"),
    );
    const getBody = (await getRes.json()) as { reading: typeof newPrefs };
    expect(getBody.reading).toEqual(newPrefs);
  });
});

describe("/api/preferences method routing", () => {
  it("returns 405 for unsupported methods", async () => {
    const res = await preferencesHandler(
      new Request("http://localhost/api/preferences", { method: "DELETE" }),
    );
    expect(res.status).toBe(405);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("method_not_allowed");
  });
});
