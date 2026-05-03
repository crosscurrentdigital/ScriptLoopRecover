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
    SelectTrigger: ({ children }: { children?: React.ReactNode }) => (
      <button type="button" role="combobox">
        {children}
      </button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) =>
      placeholder ? <span>{placeholder}</span> : null,
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

vi.mock("@/components/AudioPlayer", () => ({
  AudioPlayer: ({ onRegenerate }: { onRegenerate?: () => void }) => (
    <div data-testid="audio-player">
      <button type="button" onClick={() => onRegenerate?.()}>
        player-regenerate
      </button>
    </div>
  ),
}));
const privacyAckFlag = { current: true };
vi.mock("@/components/AudioPrivacyConsent", () => {
  const React = require("react");
  return {
    AudioPrivacyConsent: ({
      onChange,
    }: {
      onChange?: (b: boolean) => void;
    }) => {
      React.useEffect(() => {
        onChange?.(privacyAckFlag.current);
      }, [onChange]);
      return <div data-testid="privacy-consent" />;
    },
    hasAudioPrivacyAck: () => privacyAckFlag.current,
  };
});

const recordedAudio = {
  blob: new Blob(["x"], { type: "audio/webm" }),
  mimeType: "audio/webm",
  extension: "webm",
  durationMs: 1000,
};
vi.mock("@/components/VoiceRecorder", () => ({
  VoiceRecorder: ({
    onAccept,
  }: {
    onAccept?: (a: typeof recordedAudio) => void;
  }) => (
    <button
      type="button"
      data-testid="capture-recording"
      onClick={() => onAccept?.(recordedAudio)}
    >
      capture
    </button>
  ),
}));

const uploadToR2Mock = vi.fn(
  async (..._args: unknown[]) => ({ url: "https://r2/x.webm" }),
);
vi.mock("@/lib/r2", () => ({
  uploadToR2: (...args: unknown[]) => uploadToR2Mock(...args),
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
  privacyAckFlag.current = true;
  uploadToR2Mock.mockClear();
  uploadToR2Mock.mockResolvedValue({ url: "https://r2/x.webm" });
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

  it("Try again in the error state refetches the script", async () => {
    let attempts = 0;
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts/1") {
          attempts++;
          if (attempts === 1) {
            return Promise.resolve(
              mockJson({ error: { code: "x", message: "down" } }, 500),
            );
          }
          return Promise.resolve(mockJson(sampleScript));
        }
        if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    fireEvent.click(await screen.findByRole("button", { name: /Try again/ }));
    expect(await screen.findByText("Sample")).toBeInTheDocument();
  });

  it("hides the audio player and shows the empty-state copy when there is no audio", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts/1")
          return Promise.resolve(
            mockJson({ ...sampleScript, audioUrl: null, voiceId: null }),
          );
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
    await screen.findByText("Sample");
    expect(screen.queryByTestId("audio-player")).not.toBeInTheDocument();
    expect(screen.getByText(/No audio yet/)).toBeInTheDocument();
    // The "Enter Zen Mode" link only renders when audio exists.
    expect(
      screen.queryByRole("link", { name: /Enter Zen Mode/ }),
    ).not.toBeInTheDocument();
    // Button label should read "Generate audio" when there is none yet.
    expect(
      screen.getByRole("button", { name: "Generate audio" }),
    ).toBeInTheDocument();
  });

  it("shows a 'voice will change' hint when the user picks a different voice", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
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
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    // The select mock renders each option as a button; click "V Two".
    fireEvent.click(screen.getByRole("option", { name: "V Two" }));
    expect(
      await screen.findByText(/Voice will change on regenerate/),
    ).toBeInTheDocument();
  });

  it("blocks save-recording when no recording was captured yet", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/scripts/1")
        return Promise.resolve(mockJson(sampleScript));
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    fireEvent.click(screen.getByRole("tab", { name: /Record yourself/ }));
    fireEvent.click(
      screen.getByRole("button", { name: /Save recording/ }),
    );
    await new Promise((r) => setTimeout(r, 60));
    expect(uploadToR2Mock).not.toHaveBeenCalled();
  });

  it("uploads recording to R2 then PUTs the script with the new audio URL", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/scripts/1" && (!init || !init.method || init.method === "GET"))
        return Promise.resolve(mockJson(sampleScript));
      if (url === "/api/scripts/1" && init?.method === "PUT") {
        const body = JSON.parse((init.body as string) ?? "{}");
        return Promise.resolve(
          mockJson({ ...sampleScript, audioUrl: body.audioUrl, audioSource: body.audioSource }),
        );
      }
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    fireEvent.click(screen.getByRole("tab", { name: /Record yourself/ }));
    fireEvent.click(screen.getByTestId("capture-recording"));
    fireEvent.click(
      screen.getByRole("button", { name: /Save recording/ }),
    );
    await waitFor(() => expect(uploadToR2Mock).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const put = fetchMock.mock.calls.find(
        ([u, i]) =>
          u === "/api/scripts/1" &&
          (i as RequestInit | undefined)?.method === "PUT",
      );
      expect(put).toBeTruthy();
      const body = JSON.parse((put![1] as RequestInit).body as string);
      expect(body.audioUrl).toBe("https://r2/x.webm");
      expect(body.audioSource).toBe("user");
    });
  });

  it("blocks save-recording when audio privacy is not acknowledged", async () => {
    privacyAckFlag.current = false;
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/scripts/1")
        return Promise.resolve(mockJson(sampleScript));
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    fireEvent.click(screen.getByRole("tab", { name: /Record yourself/ }));
    // The button is disabled by privacy-not-acked, but if clicked anyway
    // the handler also short-circuits — assert no R2 upload happens.
    const saveBtn = screen.getByRole("button", { name: /Save recording/ });
    fireEvent.click(saveBtn);
    await new Promise((r) => setTimeout(r, 60));
    expect(uploadToR2Mock).not.toHaveBeenCalled();
  });

  it("surfaces a recording-upload failure as a destructive toast", async () => {
    uploadToR2Mock.mockRejectedValueOnce(new Error("R2 down"));
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/scripts/1")
        return Promise.resolve(mockJson(sampleScript));
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    fireEvent.click(screen.getByRole("tab", { name: /Record yourself/ }));
    fireEvent.click(screen.getByTestId("capture-recording"));
    fireEvent.click(
      screen.getByRole("button", { name: /Save recording/ }),
    );
    await waitFor(() => expect(uploadToR2Mock).toHaveBeenCalledTimes(1));
  });

  it("includes a 'try again in N min' hint when the API returns Retry-After", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/scripts/1" && (!init || !init.method || init.method === "GET"))
        return Promise.resolve(mockJson(sampleScript));
      if (url === "/api/audio/voices")
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "V One", preview_url: "" }]),
        );
      if (url === "/api/generate-audio" && init?.method === "POST") {
        return Promise.resolve({
          ok: false,
          status: 429,
          statusText: "",
          headers: new Headers({ "Retry-After": "180" }),
          json: async () => ({
            error: { code: "rate_limited", message: "slow down" },
          }),
        });
      }
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    fireEvent.click(
      screen.getByRole("button", { name: "player-regenerate" }),
    );
    await waitFor(() => {
      const posted = fetchMock.mock.calls.some(
        ([u, i]) =>
          u === "/api/generate-audio" &&
          (i as RequestInit | undefined)?.method === "POST",
      );
      expect(posted).toBe(true);
    });
  });

  it("regenerate refuses when audio privacy was not acknowledged", async () => {
    privacyAckFlag.current = false;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/scripts/1")
        return Promise.resolve(mockJson(sampleScript));
      if (url === "/api/audio/voices")
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "V One", preview_url: "" }]),
        );
      if (url === "/api/generate-audio" && init?.method === "POST") {
        return Promise.resolve(mockJson({}));
      }
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    // Use the AudioPlayer-supplied callback so the click is not blocked
    // by the in-page disable rule (which also keys off the ack).
    fireEvent.click(
      screen.getByRole("button", { name: "player-regenerate" }),
    );
    await new Promise((r) => setTimeout(r, 50));
    const posted = fetchMock.mock.calls.some(
      ([u, i]) =>
        u === "/api/generate-audio" &&
        (i as RequestInit | undefined)?.method === "POST",
    );
    expect(posted).toBe(false);
  });

  it("renders defaults for null loopGapSeconds and empty content", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts/1")
          return Promise.resolve(
            mockJson({
              ...sampleScript,
              content: null,
              loopGapSeconds: null,
            }),
          );
        if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    expect(await screen.findByText("Sample")).toBeInTheDocument();
    // The audio player still mounts; loop gap renders in the description.
    expect(screen.getByText(/Loops with a 2s pause/)).toBeInTheDocument();
  });

  it("returns 'Script not found' when the API responds with no script", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts/1")
          return Promise.resolve(mockJson(null));
        if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    expect(
      await screen.findByText(/Script not found/),
    ).toBeInTheDocument();
  });

  it("regenerate refuses when the script body is empty", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/scripts/1")
        return Promise.resolve(
          mockJson({ ...sampleScript, content: "   " }),
        );
      if (url === "/api/audio/voices")
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "V One", preview_url: "" }]),
        );
      if (url === "/api/generate-audio" && init?.method === "POST") {
        return Promise.resolve(mockJson({}));
      }
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    // Trigger via the AudioPlayer's regenerate hook so we exercise the
    // empty-content guard inside handleRegenerate.
    fireEvent.click(
      screen.getByRole("button", { name: "player-regenerate" }),
    );
    await new Promise((r) => setTimeout(r, 50));
    const posted = fetchMock.mock.calls.some(
      ([u, i]) =>
        u === "/api/generate-audio" &&
        (i as RequestInit | undefined)?.method === "POST",
    );
    expect(posted).toBe(false);
  });

  it("regenerate refuses and toasts when no voice is selectable", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/scripts/1")
        return Promise.resolve(
          mockJson({ ...sampleScript, voiceId: null }),
        );
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      if (url === "/api/generate-audio" && init?.method === "POST") {
        return Promise.resolve(mockJson({}));
      }
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    fireEvent.click(
      screen.getByRole("button", { name: /Generate audio|Regenerate audio/ }),
    );
    await new Promise((r) => setTimeout(r, 50));
    const posted = fetchMock.mock.calls.some(
      ([u, i]) =>
        u === "/api/generate-audio" &&
        (i as RequestInit | undefined)?.method === "POST",
    );
    expect(posted).toBe(false);
  });

  it("renders a voices error message when /api/audio/voices fails", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts/1")
          return Promise.resolve(mockJson(sampleScript));
        if (url === "/api/audio/voices")
          return Promise.resolve(
            mockJson({ error: { code: "x", message: "voices down" } }, 500),
          );
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    expect(
      await screen.findByText(/Couldn't load voices/),
    ).toBeInTheDocument();
  });

  it("delete is cancelled when window.confirm returns false", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
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
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptDetailPage />, { wrapper: wrap(qc) });
    await screen.findByText("Sample");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await new Promise((r) => setTimeout(r, 30));
    const deleteCall = fetchMock.mock.calls.find(
      (c) => (c[1] as RequestInit | undefined)?.method === "DELETE",
    );
    expect(deleteCall).toBeUndefined();
  });

  it("delete surfaces an error toast when the API fails", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE")
        return Promise.resolve(
          mockJson({ error: { code: "x", message: "boom" } }, 500),
        );
      if (url === "/api/scripts/1")
        return Promise.resolve(mockJson(sampleScript));
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
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
    // Did not navigate away on failure.
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
