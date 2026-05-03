import { describe, expect, it } from "vitest";
import { AUDIO_URL_RE, scrubAudioUrls } from "@/lib/sentry";

describe("scrubAudioUrls", () => {
  it("redacts matching audio URLs", () => {
    const input =
      "see https://pub-x.r2.dev/audio/abc123/1717-foo.mp3 it leaked";
    expect(scrubAudioUrls(input)).toBe("see [redacted-audio-url] it leaked");
  });
  it("redacts multiple URLs", () => {
    AUDIO_URL_RE.lastIndex = 0;
    const out = scrubAudioUrls(
      "https://x/audio/u1/1-a.mp3 then https://y/audio/u2/2-b.mp3",
    );
    expect(out).toBe("[redacted-audio-url] then [redacted-audio-url]");
  });
  it("leaves unrelated text untouched", () => {
    expect(scrubAudioUrls("hello world")).toBe("hello world");
  });
});
