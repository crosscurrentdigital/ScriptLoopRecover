import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

const { useSessionMock } = vi.hoisted(() => ({ useSessionMock: vi.fn() }));
vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: useSessionMock },
}));

import {
  ReadingPreferencesProvider,
  useReadingPreferences,
} from "@/hooks/useReadingPreferences";
import {
  DEFAULT_PREFERENCES,
  READING_PREFERENCES_STORAGE_KEY,
  preferencesToCssVars,
} from "@/lib/reading-preferences";

const wrapper = ({ children }: { children: ReactNode }) => (
  <ReadingPreferencesProvider>{children}</ReadingPreferencesProvider>
);

const fetchMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  // Wipe inline CSS vars set by previous tests.
  for (const key of Object.keys(preferencesToCssVars(DEFAULT_PREFERENCES))) {
    document.documentElement.style.removeProperty(key);
  }
  useSessionMock.mockReset();
  useSessionMock.mockReturnValue({ data: null, isPending: false });
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ reading: null }), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ReadingPreferencesProvider", () => {
  it("writes CSS variables to documentElement when preferences change", () => {
    const { result } = renderHook(() => useReadingPreferences(), { wrapper });

    // Initial vars from defaults are applied by the mount effect.
    expect(
      document.documentElement.style.getPropertyValue("--reading-font-size"),
    ).toBe(`${DEFAULT_PREFERENCES.fontSize}px`);

    act(() => {
      result.current.setPreferences({ fontSize: 24, backgroundColor: "darkGray" });
    });

    expect(
      document.documentElement.style.getPropertyValue("--reading-font-size"),
    ).toBe("24px");
    expect(
      document.documentElement.style.getPropertyValue("--reading-bg"),
    ).toBe("#2A2A2A");
  });

  it("hydrates initial state from localStorage", () => {
    window.localStorage.setItem(
      READING_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_PREFERENCES,
        fontFamily: "lexend",
        fontSize: 22,
      }),
    );

    const { result } = renderHook(() => useReadingPreferences(), { wrapper });
    expect(result.current.preferences.fontFamily).toBe("lexend");
    expect(result.current.preferences.fontSize).toBe(22);
  });

  it("falls back to defaults when stored JSON is invalid", () => {
    window.localStorage.setItem(READING_PREFERENCES_STORAGE_KEY, "{not-json");
    const { result } = renderHook(() => useReadingPreferences(), { wrapper });
    expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES);
  });

  it("debounces the server PUT and only fires once for rapid updates", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-1" } },
      isPending: false,
    });

    const { result } = renderHook(() => useReadingPreferences(), { wrapper });

    // Drain the GET hydration request that fires on mount.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    fetchMock.mockClear();

    act(() => result.current.setPreferences({ fontSize: 20 }));
    act(() => result.current.setPreferences({ fontSize: 21 }));
    act(() => result.current.setPreferences({ fontSize: 22 }));

    // Before the debounce window elapses, no PUT should have been sent.
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    const putCalls = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "PUT",
    );
    expect(putCalls).toHaveLength(1);
    const [url, init] = putCalls[0];
    expect(url).toBe("/api/preferences");
    const body = JSON.parse((init as RequestInit).body as string) as {
      reading: { fontSize: number };
    };
    expect(body.reading.fontSize).toBe(22);
  });

  it("does not PUT to the server when the user is unauthenticated", async () => {
    const { result } = renderHook(() => useReadingPreferences(), { wrapper });

    act(() => result.current.setPreferences({ fontSize: 20 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    // localStorage still gets the change.
    const stored = JSON.parse(
      window.localStorage.getItem(READING_PREFERENCES_STORAGE_KEY) ?? "{}",
    ) as { fontSize: number };
    expect(stored.fontSize).toBe(20);
  });

  it("hydrates from server when a session exists and overrides local state", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-1" } },
      isPending: false,
    });
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          reading: { ...DEFAULT_PREFERENCES, fontFamily: "georgia", fontSize: 26 },
        }),
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useReadingPreferences(), { wrapper });

    // Flush the in-flight fetch promise + the setState that follows.
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.preferences.fontFamily).toBe("georgia");
    expect(result.current.preferences.fontSize).toBe(26);
  });

  it("throws when used outside the provider", () => {
    const Bad = () => {
      useReadingPreferences();
      return null;
    };
    // Suppress the noisy React error boundary log for this expected throw.
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/ReadingPreferencesProvider/);
    errSpy.mockRestore();
  });
});
