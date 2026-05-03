import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPresignedUploadUrl, uploadToR2 } from "@/lib/r2";

beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

describe("getPresignedUploadUrl", () => {
  it("posts to /api/storage/presign and returns body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uploadUrl: "u", publicUrl: "p", key: "k" }),
    });
    const out = await getPresignedUploadUrl("a.mp3", "audio/mpeg");
    expect(out).toEqual({ uploadUrl: "u", publicUrl: "p", key: "k" });
  });
  it("throws on non-ok", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });
    await expect(getPresignedUploadUrl("a", "b")).rejects.toThrow();
  });
});

describe("uploadToR2", () => {
  it("PUTs the file with proper Cache-Control and returns url+key", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadUrl: "https://upload",
          publicUrl: "https://public",
          key: "K",
        }),
      })
      .mockResolvedValueOnce({ ok: true });
    const blob = new Blob(["x"]);
    const out = await uploadToR2(blob, "a.mp3", "audio/mpeg");
    expect(out).toEqual({ url: "https://public", key: "K" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const putCall = fetchMock.mock.calls[1];
    expect(putCall[0]).toBe("https://upload");
    expect(putCall[1].method).toBe("PUT");
    expect(putCall[1].headers["Cache-Control"]).toMatch(/immutable/);
  });
  it("throws when PUT fails", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uploadUrl: "u", publicUrl: "p", key: "k" }),
      })
      .mockResolvedValueOnce({ ok: false });
    await expect(uploadToR2(new Blob(["x"]), "a", "b")).rejects.toThrow();
  });
});
