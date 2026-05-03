import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the DB before importing the module under test, so the lazy
// joins for `authUser` and `user_profiles` don't try to hit Postgres.
const userRows: Array<{ email: string }> = [];
const profileRows: Array<{ isAdmin: boolean; disabled: boolean } | undefined> =
  [];
let nextSelectIsUser = true;
vi.mock("../../src/db/index", () => {
  const select = () => ({
    from: () => ({
      where: () => {
        const rows = nextSelectIsUser ? [...userRows] : [...profileRows];
        nextSelectIsUser = !nextSelectIsUser;
        return Promise.resolve(rows);
      },
    }),
  });
  return {
    db: {
      select,
      insert: () => ({
        values: () => ({ onConflictDoNothing: async () => undefined }),
      }),
      update: () => ({
        set: () => ({ where: async () => undefined }),
      }),
    },
  };
});

const { getSession, jsonResponse } = await import(
  "../../netlify/functions/_lib/session"
);

beforeEach(() => {
  globalThis.fetch = vi.fn();
  process.env.VITE_NEON_AUTH_URL = "https://auth.example.com";
  userRows.length = 0;
  profileRows.length = 0;
  nextSelectIsUser = true;
});
afterEach(() => vi.restoreAllMocks());

describe("jsonResponse", () => {
  it("serializes the body and sets JSON content-type", async () => {
    const res = jsonResponse({ ok: true }, 201, { "X-Foo": "bar" });
    expect(res.status).toBe(201);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("X-Foo")).toBe("bar");
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("getSession", () => {
  it("returns null when VITE_NEON_AUTH_URL is missing", async () => {
    process.env.VITE_NEON_AUTH_URL = "";
    const res = await getSession(new Request("http://x"));
    expect(res).toBeNull();
  });

  it("returns null when fetch resolves non-ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    const res = await getSession(new Request("http://x"));
    expect(res).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("net"),
    );
    const res = await getSession(new Request("http://x"));
    expect(res).toBeNull();
  });

  it("returns the userId from body.session.userId", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ session: { userId: "user-A" } }),
    });
    userRows.push({ email: "user-a@example.com" });
    profileRows.push({ isAdmin: false, disabled: false });
    const req = new Request("http://x", {
      headers: { cookie: "session=abc" },
    });
    const res = await getSession(req);
    expect(res).toEqual({
      userId: "user-A",
      email: "user-a@example.com",
      isAdmin: false,
      disabled: false,
    });
  });

  it("returns null when body has no userId", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ session: {} }),
    });
    const res = await getSession(new Request("http://x"));
    expect(res).toBeNull();
  });
});
