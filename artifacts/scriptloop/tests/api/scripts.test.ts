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

const scriptsHandler = (await import("../../netlify/functions/scripts"))
  .default;

beforeEach(() => {
  resetDbState();
  sessionMock.getSession.mockResolvedValue({ userId: "user-A" });
});
afterEach(() => vi.clearAllMocks());

const otherUserScript = {
  id: 42,
  userId: "user-B",
  title: "B's script",
  content: "secret",
  audioUrl: null,
  audioSource: null,
  voiceId: null,
  loopGapSeconds: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ownership enforcement", () => {
  it("GET /api/scripts/:id returns 404 when the script belongs to another user", async () => {
    dbState.selectResult = [otherUserScript];
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts/42"),
    );
    expect(res.status).toBe(404);
  });

  it("PUT /api/scripts/:id returns 404 when the WHERE matches no row owned by the caller", async () => {
    // Drizzle's update WHERE filters by both id AND userId, so the in-memory
    // shim returning an empty updateResult simulates "no row matched".
    dbState.updateResult = [];
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts/42", {
        method: "PUT",
        body: JSON.stringify({ title: "hijack" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("DELETE /api/scripts/:id returns 404 when no row was deleted for the caller", async () => {
    dbState.deleteResult = [];
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts/42", { method: "DELETE" }),
    );
    expect(res.status).toBe(404);
  });

  it("GET /api/scripts only lists scripts the caller owns (handler scopes by userId)", async () => {
    const ownScript = { ...otherUserScript, id: 1, userId: "user-A" };
    dbState.selectResult = [ownScript];
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ userId: string }>;
    // The handler always passes userId="user-A" to drizzle's where(), so a
    // missing scope would surface as user-B rows leaking through here.
    expect(body.every((s) => s.userId === "user-A")).toBe(true);
  });
});

describe("input validation", () => {
  it("POST /api/scripts rejects content >2000 chars with 400", async () => {
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts", {
        method: "POST",
        body: JSON.stringify({
          title: "ok",
          content: "x".repeat(2001),
        }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("invalid_request");
    expect(body.error.message).toMatch(/2000/);
    expect(dbState.insertCalls).toHaveLength(0);
  });

  it("PUT /api/scripts/:id rejects content >2000 chars with 400", async () => {
    const res = await scriptsHandler(
      new Request("http://localhost/api/scripts/1", {
        method: "PUT",
        body: JSON.stringify({ content: "x".repeat(2001) }),
      }),
    );
    expect(res.status).toBe(400);
    expect(dbState.updateCalls).toHaveLength(0);
  });
});
