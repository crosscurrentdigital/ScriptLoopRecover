import "@testing-library/jest-dom/vitest";

// Provide minimal env so importing modules that read process.env at top
// level (e.g. r2-server creating an S3Client) doesn't crash. None of these
// are real — tests mock the modules that would otherwise try to use them.
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.ELEVENLABS_API_KEY ??= "test-key";
process.env.R2_ACCOUNT_ID ??= "test-account";
process.env.R2_ACCESS_KEY_ID ??= "test-access-key";
process.env.R2_SECRET_ACCESS_KEY ??= "test-secret-key";
process.env.R2_BUCKET_NAME ??= "test-bucket";
process.env.R2_PUBLIC_URL ??= "https://test.example.com";
process.env.VITE_NEON_AUTH_URL ??= "https://auth.test.example.com";

// jsdom doesn't provide ResizeObserver, but Radix UI primitives use it.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

if (typeof window !== "undefined" && !("PointerEvent" in window)) {
  // @ts-expect-error - jsdom shim
  window.PointerEvent = window.MouseEvent;
}

if (typeof Element !== "undefined" && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}
