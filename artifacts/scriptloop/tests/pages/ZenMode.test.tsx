import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

vi.mock("@/components/ui/select", () => {
  const React = require("react");
  const Ctx = React.createContext({});
  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value?: string;
      onValueChange?: (v: string) => void;
      children?: React.ReactNode;
    }) => (
      <Ctx.Provider value={{ onValueChange }}>
        <div data-value={value}>{children}</div>
      </Ctx.Provider>
    ),
    SelectTrigger: ({
      children,
      "aria-label": ariaLabel,
    }: {
      children?: React.ReactNode;
      "aria-label"?: string;
    }) => (
      <button type="button" role="combobox" aria-label={ariaLabel}>
        {children}
      </button>
    ),
    SelectValue: () => null,
    SelectContent: ({ children }: { children?: React.ReactNode }) => (
      <div role="listbox">{children}</div>
    ),
    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children?: React.ReactNode;
    }) => {
      const ctx = React.useContext(Ctx);
      return (
        <button
          type="button"
          role="option"
          onClick={() => ctx.onValueChange?.(value)}
        >
          {children}
        </button>
      );
    },
  };
});

const { default: ZenMode } = await import("@/pages/ZenMode");

function wrap(qc: QueryClient, path = "/scripts/1/zen") {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/scripts/:id/zen" element={children} />
          <Route path="/scripts/:id" element={<div data-testid="detail" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function mockJson(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    headers: new Headers(),
    json: async () => body,
  };
}

beforeEach(() => {
  globalThis.fetch = vi.fn();
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  HTMLMediaElement.prototype.pause = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ZenMode", () => {
  it("renders script content + controls when audio present", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJson({
        id: 1,
        userId: "u",
        title: "Z",
        content: "loop me",
        audioUrl: "https://x/a.mp3",
        audioSource: null,
        voiceId: "v",
        loopGapSeconds: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ZenMode />, { wrapper: wrap(qc) });
    expect(await screen.findByText("loop me")).toBeInTheDocument();
    expect(
      screen.getByRole("toolbar", { name: /Zen Mode controls/i }),
    ).toBeInTheDocument();
  });

  it("Play toggles to Pause and audio 'ended' events advance the loop counter", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockJson({
          id: 1,
          userId: "u",
          title: "Z",
          content: "loop content",
          audioUrl: "https://x/a.mp3",
          audioSource: null,
          voiceId: "v",
          loopGapSeconds: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      );
      const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(<ZenMode />, { wrapper: wrap(qc) });

      // Wait for the script to render so the <audio> element exists.
      await screen.findByText("loop content");
      const audioEl = document.querySelector("audio") as HTMLAudioElement;
      expect(audioEl).toBeTruthy();

      // Play toggles aria-label from "Play" to "Pause".
      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Pause" }),
        ).toBeInTheDocument(),
      );
      expect(screen.getByLabelText(/^0 loops$/)).toBeInTheDocument();

      // Drive the loop: ended → wait for the gap timer → play resolves
      // → loopCount increments to 1.
      await act(async () => {
        audioEl.dispatchEvent(new Event("ended"));
        await vi.advanceTimersByTimeAsync(50);
        await Promise.resolve();
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/^1 loops$/)).toBeInTheDocument(),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("Exit button navigates back to the detail page", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJson({
        id: 1,
        userId: "u",
        title: "Z",
        content: "x",
        audioUrl: "https://x/a.mp3",
        audioSource: null,
        voiceId: "v",
        loopGapSeconds: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ZenMode />, { wrapper: wrap(qc) });
    fireEvent.click(
      await screen.findByRole("button", { name: /Exit Zen Mode/i }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("detail")).toBeInTheDocument(),
    );
  });

  it("shows 'Generate audio first' when audioUrl is null", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJson({
        id: 1,
        userId: "u",
        title: "Z",
        content: "x",
        audioUrl: null,
        audioSource: null,
        voiceId: null,
        loopGapSeconds: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ZenMode />, { wrapper: wrap(qc) });
    expect(
      await screen.findByText(/Generate audio first/),
    ).toBeInTheDocument();
  });

  it("shows error on script fetch failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJson({ error: { code: "x", message: "down" } }, 500),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ZenMode />, { wrapper: wrap(qc) });
    await waitFor(() =>
      expect(screen.getByText(/Couldn't load script/)).toBeInTheDocument(),
    );
  });
});
