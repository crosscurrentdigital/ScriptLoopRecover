import { afterEach, describe, expect, it } from "vitest";
import {
  buildAudioUrlScrubber,
  scrubEvent,
} from "../../netlify/functions/_lib/sentry";
import { AUDIO_URL_RE, scrubAudioUrls } from "../../src/lib/sentry";

describe("server sentry scrubber (buildAudioUrlScrubber + scrubEvent)", () => {
  const originalR2 = process.env.R2_PUBLIC_URL;

  afterEach(() => {
    if (originalR2 === undefined) delete process.env.R2_PUBLIC_URL;
    else process.env.R2_PUBLIC_URL = originalR2;
  });

  it("returns null when R2_PUBLIC_URL is unset (scrubber disabled)", () => {
    delete process.env.R2_PUBLIC_URL;
    expect(buildAudioUrlScrubber()).toBeNull();
  });

  it("returns null when R2_PUBLIC_URL is not a valid URL", () => {
    process.env.R2_PUBLIC_URL = "not a url";
    expect(buildAudioUrlScrubber()).toBeNull();
  });

  it("redacts R2 audio URLs from event message, exception value, and breadcrumbs", () => {
    process.env.R2_PUBLIC_URL = "https://r2.example.com";
    const scrub = buildAudioUrlScrubber();
    expect(scrub).not.toBeNull();

    const audioUrl =
      "https://r2.example.com/audio/user-123/1716000000000-foo.mp3";
    const event = {
      message: `playback failed for ${audioUrl} now`,
      exception: {
        values: [
          { value: `fetch ${audioUrl} threw` },
          { value: "no url here" },
        ],
      },
      breadcrumbs: [
        { message: `loaded ${audioUrl}` },
        {
          message: "with data",
          data: {
            url: audioUrl,
            count: 3,
            other: "https://other.example.com/x",
          },
        },
      ],
    };

    const out = scrubEvent(event, scrub!);

    expect(out.message).toBe("playback failed for [redacted-audio-url] now");
    expect(out.exception!.values![0]!.value).toBe(
      "fetch [redacted-audio-url] threw",
    );
    expect(out.exception!.values![1]!.value).toBe("no url here");
    expect(out.breadcrumbs![0]!.message).toBe("loaded [redacted-audio-url]");
    expect(out.breadcrumbs![1]!.data!.url).toBe("[redacted-audio-url]");
    expect(out.breadcrumbs![1]!.data!.count).toBe(3);
    expect(out.breadcrumbs![1]!.data!.other).toBe(
      "https://other.example.com/x",
    );
  });

  it("only redacts URLs that match the configured R2 host", () => {
    process.env.R2_PUBLIC_URL = "https://r2.example.com";
    const scrub = buildAudioUrlScrubber()!;
    const input =
      "a https://r2.example.com/audio/u/1-x.mp3 b https://other.example.com/audio/u/1-x.mp3 c";
    expect(scrub(input)).toBe(
      "a [redacted-audio-url] b https://other.example.com/audio/u/1-x.mp3 c",
    );
  });

  it("scrubEvent tolerates events with no message/exception/breadcrumbs", () => {
    process.env.R2_PUBLIC_URL = "https://r2.example.com";
    const scrub = buildAudioUrlScrubber()!;
    expect(scrubEvent({}, scrub)).toEqual({});
  });
});

describe("client sentry scrubber (AUDIO_URL_RE + scrubAudioUrls)", () => {
  it("matches the canonical audio key shape", () => {
    const url =
      "https://cdn.example.com/audio/user-abc_123/1716000000000-clip-1.mp3";
    expect(url).toMatch(AUDIO_URL_RE);
    expect(scrubAudioUrls(`play ${url} done`)).toBe(
      "play [redacted-audio-url] done",
    );
  });

  it("matches across hosts (path-shape based, not host based)", () => {
    expect(
      scrubAudioUrls(
        "https://anything.tld/foo/audio/uid/1234567890-bar.ogg here",
      ),
    ).toBe("[redacted-audio-url] here");
  });

  it("does not match unrelated URLs", () => {
    const samples = [
      "https://example.com/api/scripts/123",
      "https://example.com/audio/intro.mp3",
      "https://example.com/audio/user-1/foo.mp3",
      "https://example.com/audio/user-1/notatimestamp-foo.mp3",
      "/audio/user-1/1716000000000-foo.mp3",
    ];
    for (const s of samples) {
      // Reset stateful global regex between calls.
      AUDIO_URL_RE.lastIndex = 0;
      expect(s).not.toMatch(AUDIO_URL_RE);
      expect(scrubAudioUrls(s)).toBe(s);
    }
  });

  it("redacts multiple URLs in one string", () => {
    const a = "https://r2.example.com/audio/u1/1000-a.mp3";
    const b = "https://r2.example.com/audio/u2/2000-b.mp3";
    expect(scrubAudioUrls(`${a} and ${b}`)).toBe(
      "[redacted-audio-url] and [redacted-audio-url]",
    );
  });
});
