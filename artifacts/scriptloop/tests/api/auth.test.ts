import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dbState, fakeDb, resetDbState } from "../helpers/dbMock";

vi.mock("../../src/db/index", () => ({ db: fakeDb }));
vi.mock("../../netlify/functions/_lib/session", async () => {
  const actual =
    await vi.importActual<
      typeof import("../../netlify/functions/_lib/session")
    >("../../netlify/functions/_lib/session");
  return {
    ...actual,
    getSession: vi.fn(async () => null),
  };
});

const scriptsHandler = (await import("../../netlify/functions/scripts"))
  .default;
const generateAudioHandler = (
  await import("../../netlify/functions/generate-audio")
).default;
const storageHandler = (await import("../../netlify/functions/storage"))
  .default;

beforeEach(() => resetDbState());
afterEach(() => vi.clearAllMocks());

describe("authentication: 401 on protected routes", () => {
  it.each([
    ["GET", "http://localhost/api/scripts", scriptsHandler],
    ["GET", "http://localhost/api/scripts/123", scriptsHandler],
    ["POST", "http://localhost/api/scripts", scriptsHandler],
    ["POST", "http://localhost/api/scripts/with-audio", scriptsHandler],
    ["PUT", "http://localhost/api/scripts/123", scriptsHandler],
    ["DELETE", "http://localhost/api/scripts/123", scriptsHandler],
    ["POST", "http://localhost/api/generate-audio", generateAudioHandler],
    ["POST", "http://localhost/api/storage/presign", storageHandler],
  ])(
    "%s %s returns 401 without a session",
    async (method, url, handler) => {
      const req = new Request(url, {
        method,
        ...(method === "GET" || method === "DELETE"
          ? {}
          : { body: JSON.stringify({}) }),
      });
      const res = await handler(req);
      expect(res.status).toBe(401);
      // No DB writes attempted on unauth requests.
      expect(dbState.insertCalls).toHaveLength(0);
      expect(dbState.updateCalls).toHaveLength(0);
      expect(dbState.deleteCalls).toBe(0);
    },
  );
});
