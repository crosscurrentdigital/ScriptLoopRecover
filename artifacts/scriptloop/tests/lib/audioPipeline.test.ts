import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/elevenlabs", () => ({
  textToSpeech: vi.fn(),
}));
vi.mock("../../src/lib/r2-server", () => ({
  uploadBufferToR2: vi.fn(),
}));

const elevenlabs = await import("../../src/lib/elevenlabs");
const r2server = await import("../../src/lib/r2-server");
const mod = await import("../../netlify/functions/_lib/audioPipeline");

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of [
    "ELEVENLABS_API_KEY",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ]) {
    process.env[k] = "x";
  }
});
afterEach(() => vi.clearAllMocks());

describe("checkAudioConfig", () => {
  it("returns null when fully configured", () => {
    expect(mod.checkAudioConfig()).toBeNull();
  });
  it("flags missing ElevenLabs key", () => {
    process.env.ELEVENLABS_API_KEY = "";
    expect(mod.checkAudioConfig()).toMatch(/ElevenLabs/);
  });
  it("lists missing R2 vars", () => {
    process.env.R2_BUCKET_NAME = "";
    expect(mod.checkAudioConfig()).toMatch(/R2_BUCKET_NAME/);
  });
});

describe("estimateDurationSeconds", () => {
  it("falls back to word count when bytes are tiny", () => {
    const out = mod.estimateDurationSeconds(new Uint8Array(2), "one two three");
    expect(out).toBeGreaterThan(0);
  });
  it("derives duration from byte size at 128 kbps default", () => {
    const buf = new Uint8Array(16_000); // 16KB → ~1s @ 128kbps
    expect(mod.estimateDurationSeconds(buf, "x")).toBeCloseTo(1, 1);
  });
});

describe("generateAndUploadAudio", () => {
  it("returns publicUrl + duration on success", async () => {
    (elevenlabs.textToSpeech as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Uint8Array(16_000).buffer,
    );
    (r2server.uploadBufferToR2 as ReturnType<typeof vi.fn>).mockResolvedValue(
      { publicUrl: "https://pub/audio/u/1-x.mp3" },
    );
    const out = await mod.generateAndUploadAudio({
      apiKey: "k",
      userId: "u",
      text: "hi",
      voiceId: "v",
    });
    expect(out.publicUrl).toBe("https://pub/audio/u/1-x.mp3");
    expect(out.durationSeconds).toBeGreaterThan(0);
  });

  it("wraps TTS errors as AudioPipelineError(stage='tts')", async () => {
    (elevenlabs.textToSpeech as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("tts fail"),
    );
    await expect(
      mod.generateAndUploadAudio({
        apiKey: "k",
        userId: "u",
        text: "hi",
        voiceId: "v",
      }),
    ).rejects.toMatchObject({
      name: "AudioPipelineError",
      stage: "tts",
      status: 502,
    });
  });

  it("wraps R2 upload errors as AudioPipelineError(stage='upload')", async () => {
    (elevenlabs.textToSpeech as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Uint8Array(16).buffer,
    );
    (r2server.uploadBufferToR2 as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("r2 fail"),
    );
    await expect(
      mod.generateAndUploadAudio({
        apiKey: "k",
        userId: "u",
        text: "hi",
        voiceId: "v",
      }),
    ).rejects.toMatchObject({ stage: "upload", status: 502 });
  });

  it("uses unguessable key shape audio/<userId>/<ts>-<hex32>-generated.mp3", async () => {
    (elevenlabs.textToSpeech as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Uint8Array(16).buffer,
    );
    (r2server.uploadBufferToR2 as ReturnType<typeof vi.fn>).mockResolvedValue(
      { publicUrl: "https://pub/x" },
    );
    await mod.generateAndUploadAudio({
      apiKey: "k",
      userId: "user-A",
      text: "hi",
      voiceId: "v",
    });
    const callArgs = (r2server.uploadBufferToR2 as ReturnType<typeof vi.fn>)
      .mock.calls[0];
    const key = callArgs[1] as string;
    expect(key).toMatch(/^audio\/user-A\/\d+-[a-f0-9]{32}-generated\.mp3$/);
    expect(callArgs[2]).toBe("audio/mpeg");
  });
});
