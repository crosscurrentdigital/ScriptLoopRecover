import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getVoices, textToSpeech } from "@/lib/elevenlabs";

beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

describe("getVoices", () => {
  it("returns voices array on success", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        voices: [{ voice_id: "v1", name: "V", preview_url: "p" }],
      }),
    });
    const out = await getVoices("k");
    expect(out).toEqual([{ voice_id: "v1", name: "V", preview_url: "p" }]);
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(url).toMatch(/\/voices$/);
  });
  it("throws on error response", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: "Bad",
    });
    await expect(getVoices("k")).rejects.toThrow(/Bad/);
  });
});

describe("textToSpeech", () => {
  it("posts JSON with default model + voice settings", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });
    const buf = await textToSpeech("k", { voiceId: "v1", text: "hi" });
    expect(buf).toBeInstanceOf(ArrayBuffer);
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toContain("/text-to-speech/v1");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.text).toBe("hi");
    expect(body.model_id).toBe("eleven_turbo_v2");
    expect(body.voice_settings).toEqual({
      stability: 0.5,
      similarity_boost: 0.75,
    });
  });
  it("throws on TTS error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: "TTS down",
    });
    await expect(
      textToSpeech("k", { voiceId: "v1", text: "x" }),
    ).rejects.toThrow(/TTS down/);
  });
});
