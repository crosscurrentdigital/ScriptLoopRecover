import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  document.head.innerHTML = "";
});
afterEach(() => vi.unstubAllEnvs());

describe("initPlausible", () => {
  it("no-ops when not in production", async () => {
    vi.stubEnv("MODE", "development");
    vi.stubEnv("PROD", false as never);
    vi.stubEnv("VITE_PLAUSIBLE_DOMAIN", "x.example");
    const { initPlausible } = await import("@/lib/plausible");
    initPlausible();
    expect(document.querySelector("script[data-plausible-injected]")).toBeNull();
  });

  it("injects script in production with domain set", async () => {
    vi.stubEnv("PROD", true as never);
    vi.stubEnv("VITE_PLAUSIBLE_DOMAIN", "x.example");
    vi.resetModules();
    const { initPlausible } = await import("@/lib/plausible");
    initPlausible();
    const s = document.querySelector(
      'script[data-plausible-injected="true"]',
    ) as HTMLScriptElement | null;
    expect(s).not.toBeNull();
    expect(s?.dataset.domain).toBe("x.example");
    // Idempotent: a second call doesn't add another tag.
    initPlausible();
    expect(
      document.querySelectorAll('script[data-plausible-injected="true"]')
        .length,
    ).toBe(1);
  });

  it("no-ops in production when domain is missing", async () => {
    vi.stubEnv("PROD", true as never);
    vi.stubEnv("VITE_PLAUSIBLE_DOMAIN", "");
    vi.resetModules();
    const { initPlausible } = await import("@/lib/plausible");
    initPlausible();
    expect(document.querySelector("script[data-plausible-injected]")).toBeNull();
  });
});
