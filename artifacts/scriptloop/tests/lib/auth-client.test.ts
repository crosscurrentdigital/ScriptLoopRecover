import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createAuthClientMock = vi.fn(() => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));
const adapterMock = vi.fn(() => ({ kind: "react-adapter" }));

vi.mock("@neondatabase/auth", () => ({
  createAuthClient: createAuthClientMock,
}));
vi.mock("@neondatabase/auth/react/adapters", () => ({
  BetterAuthReactAdapter: adapterMock,
}));

beforeEach(() => {
  vi.resetModules();
  createAuthClientMock.mockClear();
  adapterMock.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe("auth-client", () => {
  it("creates a Neon Auth client with the configured VITE_NEON_AUTH_URL", async () => {
    vi.stubEnv("VITE_NEON_AUTH_URL", "https://auth.test.example/api");
    const { authClient } = await import("@/lib/auth-client");
    expect(createAuthClientMock).toHaveBeenCalledTimes(1);
    expect(createAuthClientMock).toHaveBeenCalledWith(
      "https://auth.test.example/api",
      expect.objectContaining({
        adapter: expect.objectContaining({ kind: "react-adapter" }),
      }),
    );
    expect(adapterMock).toHaveBeenCalledTimes(1);
    expect(authClient).toBeDefined();
    expect(typeof (authClient as { useSession: unknown }).useSession).toBe(
      "function",
    );
    expect(typeof (authClient as { signOut: unknown }).signOut).toBe(
      "function",
    );
  });

  it("exports a single shared client instance (module-level singleton)", async () => {
    vi.stubEnv("VITE_NEON_AUTH_URL", "https://auth.test.example/api");
    const a = (await import("@/lib/auth-client")).authClient;
    const b = (await import("@/lib/auth-client")).authClient;
    expect(a).toBe(b);
    expect(createAuthClientMock).toHaveBeenCalledTimes(1);
  });
});
