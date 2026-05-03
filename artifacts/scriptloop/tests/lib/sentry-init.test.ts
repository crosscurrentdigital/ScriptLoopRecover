import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});
afterEach(() => vi.unstubAllEnvs());

describe("initSentry", () => {
  it("no-ops when VITE_SENTRY_DSN is unset", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    const Sentry = await import("@sentry/react");
    const { initSentry } = await import("@/lib/sentry");
    initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("initializes Sentry once when DSN is set", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://test@example/1");
    const Sentry = await import("@sentry/react");
    const { initSentry } = await import("@/lib/sentry");
    initSentry();
    initSentry();
    expect(Sentry.init).toHaveBeenCalledTimes(1);
  });

  it("beforeBreadcrumb scrubs message and string data fields", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://test@example/1");
    const Sentry = await import("@sentry/react");
    const { initSentry } = await import("@/lib/sentry");
    initSentry();
    const initCall = (Sentry.init as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const url = "https://x/audio/u/1717-foo.mp3";
    const bc = initCall.beforeBreadcrumb({
      message: `nav to ${url}`,
      data: { from: url, n: 1 },
    });
    expect(bc.message).toBe("nav to [redacted-audio-url]");
    expect(bc.data.from).toBe("[redacted-audio-url]");
    expect(bc.data.n).toBe(1);
  });

  it("beforeSend scrubs event message and exception values", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://test@example/1");
    const Sentry = await import("@sentry/react");
    const { initSentry } = await import("@/lib/sentry");
    initSentry();
    const initCall = (Sentry.init as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const url = "https://x/audio/u/1717-foo.mp3";
    const out = initCall.beforeSend({
      message: `oops ${url}`,
      exception: { values: [{ value: `boom ${url}` }] },
    });
    expect(out.message).toBe("oops [redacted-audio-url]");
    expect(out.exception.values[0].value).toBe("boom [redacted-audio-url]");
  });
});
