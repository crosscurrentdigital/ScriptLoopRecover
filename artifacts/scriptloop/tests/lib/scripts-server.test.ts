import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb, dbState, resetDbState } from "../helpers/dbMock";

vi.mock("../../src/db/index", () => ({ db: fakeDb }));

const mod = await import("@/lib/scripts-server");

beforeEach(() => resetDbState());
afterEach(() => vi.clearAllMocks());

describe("getScriptForUser", () => {
  it("returns null when no row found", async () => {
    dbState.selectResult = [];
    expect(await mod.getScriptForUser(1, "u")).toBeNull();
  });
  it("returns the row when found", async () => {
    dbState.selectResult = [{ id: 1, userId: "u", title: "t" }];
    expect(await mod.getScriptForUser(1, "u")).toEqual({
      id: 1,
      userId: "u",
      title: "t",
    });
  });
});

describe("attachAudioToScript", () => {
  it("returns null when no row updated", async () => {
    dbState.updateResult = [];
    const r = await mod.attachAudioToScript({
      scriptId: 1,
      userId: "u",
      audioUrl: "https://x.mp3",
      voiceId: "v",
    });
    expect(r).toBeNull();
  });
  it("uses elevenlabs as default audioSource", async () => {
    dbState.updateResult = [{ id: 1 }];
    await mod.attachAudioToScript({
      scriptId: 1,
      userId: "u",
      audioUrl: "https://x.mp3",
      voiceId: "v",
    });
    const set = dbState.updateCalls[0]?.set as { audioSource?: string };
    expect(set.audioSource).toBe("elevenlabs");
  });
  it("respects explicit audioSource", async () => {
    dbState.updateResult = [{ id: 1 }];
    await mod.attachAudioToScript({
      scriptId: 1,
      userId: "u",
      audioUrl: "https://x.mp3",
      voiceId: "v",
      audioSource: "custom",
    });
    const set = dbState.updateCalls[0]?.set as { audioSource?: string };
    expect(set.audioSource).toBe("custom");
  });
});
