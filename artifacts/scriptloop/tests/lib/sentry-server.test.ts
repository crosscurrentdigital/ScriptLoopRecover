import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  withScope: vi.fn((fn: (s: unknown) => void) =>
    fn({ setTag: vi.fn(), setUser: vi.fn() }),
  ),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const Sentry = await import("@sentry/node");
const mod = await import("../../netlify/functions/_lib/sentry");

beforeEach(() => {
  vi.clearAllMocks();
  process.env.R2_PUBLIC_URL = "https://pub.example.com";
  process.env.SENTRY_DSN = "";
});
afterEach(() => vi.clearAllMocks());

describe("buildAudioUrlScrubber", () => {
  it("returns null when R2_PUBLIC_URL is unset", () => {
    process.env.R2_PUBLIC_URL = "";
    expect(mod.buildAudioUrlScrubber()).toBeNull();
  });
  it("returns null on invalid URL", () => {
    process.env.R2_PUBLIC_URL = "::not-a-url";
    expect(mod.buildAudioUrlScrubber()).toBeNull();
  });
  it("redacts URLs matching the public host", () => {
    const scrub = mod.buildAudioUrlScrubber();
    expect(scrub).not.toBeNull();
    const out = scrub!(
      "see https://pub.example.com/audio/u/1-x.mp3 leaked",
    );
    expect(out).toBe("see [redacted-audio-url] leaked");
  });
});

describe("scrubEvent", () => {
  it("scrubs message, exceptions, and breadcrumbs", () => {
    const scrub = (s: string) => s.replace(/secret/g, "[s]");
    const event = {
      message: "secret here",
      exception: { values: [{ value: "another secret" }] },
      breadcrumbs: [
        { message: "secret bc", data: { url: "secret-url", n: 1 } },
      ],
    };
    const out = mod.scrubEvent(event as Parameters<typeof mod.scrubEvent>[0], scrub);
    expect(out.message).toBe("[s] here");
    expect(out.exception!.values![0].value).toBe("another [s]");
    expect(out.breadcrumbs![0].message).toBe("[s] bc");
    expect(out.breadcrumbs![0].data!.url).toBe("[s]-url");
  });
});

describe("captureFunctionError", () => {
  it("no-ops when SENTRY_DSN is not set", () => {
    mod.captureFunctionError(new Error("x"), { route: "r" });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});

describe("withSentry", () => {
  it("returns the inner handler's response unchanged on 2xx", async () => {
    const wrapped = mod.withSentry("/r", async () => new Response("ok"));
    const res = await wrapped(new Request("http://x"));
    expect(await res.text()).toBe("ok");
  });

  it("captures and rethrows when handler throws", async () => {
    const wrapped = mod.withSentry("/r", async () => {
      throw new Error("boom");
    });
    await expect(wrapped(new Request("http://x"))).rejects.toThrow(/boom/);
  });

  it("captures 5xx responses but still returns them", async () => {
    const wrapped = mod.withSentry(
      "/r",
      async () => new Response("server err", { status: 500 }),
    );
    const res = await wrapped(new Request("http://x"));
    expect(res.status).toBe(500);
  });
});
