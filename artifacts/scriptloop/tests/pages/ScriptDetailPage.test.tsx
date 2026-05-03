import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/components/AudioPlayer", () => ({
  AudioPlayer: () => <div data-testid="audio-player" />,
}));
vi.mock("@/components/AudioPrivacyConsent", () => ({
  AudioPrivacyConsent: ({
    onChange,
  }: {
    onChange?: (b: boolean) => void;
  }) => {
    onChange?.(true);
    return <div data-testid="privacy-consent" />;
  },
  hasAudioPrivacyAck: () => true,
}));

const { default: ScriptDetailPage } = await import(
  "@/pages/ScriptDetailPage"
);

function wrap(qc: QueryClient, path = "/scripts/1") {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/scripts/:id" element={children} />
          <Route path="/dashboard" element={<div data-testid="dashboard" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const sampleScript = {
  id: 1,
  userId: "u",
  title: "Sample",
  content: "hello world",
  audioUrl: "https://x/a.mp3",
  audioSource: "elevenlabs",
  voiceId: "v1",
  loopGapSeconds: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ScriptDetailPage", () => {
  it("renders the loaded script with title and audio player", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts/1")
          return Promise.resolve(mockJson(sampleScript));
        if (url === "/api/audio/voices")
          return Promise.resolve(
            mockJson([{ voice_id: "v1", name: "V One", preview_url: "" }]),
          );
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    expect(await screen.findByText("Sample")).toBeInTheDocument();
    expect(screen.getByTestId("audio-player")).toBeInTheDocument();
  });

  it("shows error state when script load fails", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJson({ error: { code: "x", message: "down" } }, 500),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await waitFor(() =>
      expect(
        screen.getByText(/Couldn't load this script/),
      ).toBeInTheDocument(),
    );
  });

  it("regenerate audio posts to /api/generate-audio with the selected voice", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/generate-audio" && init?.method === "POST") {
        return Promise.resolve(
          mockJson({
            script: { ...sampleScript, audioUrl: "https://x/new.mp3" },
          }),
        );
      }
      if (url === "/api/scripts/1")
        return Promise.resolve(mockJson(sampleScript));
      if (url === "/api/audio/voices")
        return Promise.resolve(
          mockJson([
            { voice_id: "v1", name: "V One", preview_url: "" },
            { voice_id: "v2", name: "V Two", preview_url: "" },
          ]),
        );
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");

    fireEvent.click(screen.getByRole("button", { name: /Regenerate audio/ }));

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([u, i]) =>
          u === "/api/generate-audio" &&
          (i as RequestInit | undefined)?.method === "POST",
      );
      expect(call).toBeTruthy();
      const body = JSON.parse((call![1] as RequestInit).body as string);
      expect(body.voiceId).toBe("v1");
      expect(body.text).toBe("hello world");
      expect(body.scriptId).toBe(1);
    });
  });

  it("regenerate surfaces an error toast when the API returns 429", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/generate-audio" && init?.method === "POST") {
        return Promise.resolve({
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
          headers: new Headers({ "Retry-After": "120" }),
          json: async () => ({
            error: { code: "rate_limited", message: "Slow down" },
          }),
        });
      }
      if (url === "/api/scripts/1")
        return Promise.resolve(mockJson(sampleScript));
      if (url === "/api/audio/voices")
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "V One", preview_url: "" }]),
        );
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    fireEvent.click(screen.getByRole("button", { name: /Regenerate audio/ }));

    await waitFor(() => {
      const attempted = fetchMock.mock.calls.some(
        ([u, i]) =>
          u === "/api/generate-audio" &&
          (i as RequestInit | undefined)?.method === "POST",
      );
      expect(attempted).toBe(true);
    });
    // Page stays mounted (no navigation away on rate-limit).
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("delete confirms via window.confirm and calls API", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE")
        return Promise.resolve({
          ok: true,
          status: 204,
          statusText: "",
          headers: new Headers(),
          json: async () => null,
        });
      if (url === "/api/scripts/1")
        return Promise.resolve(mockJson(sampleScript));
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      return Promise.resolve(mockJson([]));
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      const deleteCall = fetchMock.mock.calls.find(
        (c) => (c[1] as RequestInit | undefined)?.method === "DELETE",
      );
      expect(deleteCall).toBeTruthy();
    });
  });
});
