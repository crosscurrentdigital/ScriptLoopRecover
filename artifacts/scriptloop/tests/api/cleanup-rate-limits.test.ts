import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const executeMock = vi.fn();
vi.mock("../../src/db/index", () => ({
  db: { execute: executeMock },
}));

const cleanupHandler = (
  await import("../../netlify/functions/cleanup-rate-limits")
).default;

beforeEach(() => {
  executeMock.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("scheduled cleanup-rate-limits", () => {
  it("returns deleted count on success", async () => {
    executeMock.mockResolvedValueOnce([{ deleted: 7 }]);
    const res = await cleanupHandler(
      new Request("http://localhost/cleanup-rate-limits"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      deleted: number;
      retentionDays: number;
      cutoff: string;
    };
    expect(body.deleted).toBe(7);
    expect(body.retentionDays).toBe(7);
    expect(typeof body.cutoff).toBe("string");
  });

  it("returns 500 on db failure", async () => {
    executeMock.mockRejectedValueOnce(new Error("db down"));
    const res = await cleanupHandler(
      new Request("http://localhost/cleanup-rate-limits"),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe("cleanup_failed");
    expect(body.message).toMatch(/db down/);
  });

  it("falls back to deleted=0 on empty result", async () => {
    executeMock.mockResolvedValueOnce([]);
    const res = await cleanupHandler(
      new Request("http://localhost/cleanup-rate-limits"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: number };
    expect(body.deleted).toBe(0);
  });
});
