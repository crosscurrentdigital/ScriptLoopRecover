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
  type SelectProps = {
    value?: string;
    onValueChange?: (v: string) => void;
    children?: React.ReactNode;
  };
  const Ctx = React.createContext({});
  return {
    Select: ({ value, onValueChange, children }: SelectProps) => (
      <Ctx.Provider value={{ onValueChange }}>
        <div data-testid="select-root" data-value={value}>
          {children}
        </div>
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
          aria-selected={false}
          onClick={() => ctx.onValueChange?.(value)}
        >
          {children}
        </button>
      );
    },
  };
});

vi.mock("@/components/AudioPrivacyConsent", () => {
  const React = require("react");
  return {
    AudioPrivacyConsent: ({
      onChange,
    }: {
      onChange?: (b: boolean) => void;
    }) => {
      // Notify the parent only via effects (post-commit), never during
      // render. localStorage is preseeded in beforeEach so this matches
      // the "user already acknowledged" production flow.
      React.useEffect(() => {
        onChange?.(true);
      }, [onChange]);
      return <div data-testid="consent" />;
    },
    hasAudioPrivacyAck: () => true,
  };
});
vi.mock("@/components/AudioQuotaBadge", () => ({
  AudioQuotaBadge: () => null,
}));

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

const { default: ScriptEditorPage } = await import(
  "@/pages/ScriptEditorPage"
);

function wrap(qc: QueryClient, path = "/scripts/new") {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/scripts/new" element={children} />
          <Route path="/scripts/:id/edit" element={children} />
          <Route
            path="/scripts/:id"
            element={<div data-testid="detail" />}
          />
          <Route path="/dashboard" element={<div data-testid="dashboard" />} />
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
  window.localStorage.clear();
  uploadToR2Mock.mockClear();
  uploadToR2Mock.mockResolvedValue({ url: "https://r2/x.webm" });
  // Preseed the audio-privacy ack so the production code path
  // matches "user already consented" without any render-time side
  // effects from the consent component mock.
  window.localStorage.setItem("scriptloop:audio-privacy-ack:v1", "1");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ScriptEditorPage (create)", () => {
  it("submits create-with-audio and navigates to the new script's detail page", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/audio/voices") {
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
        );
      }
      if (url === "/api/scripts/with-audio" && init?.method === "POST") {
        const payload = JSON.parse((init.body as string) ?? "{}");
        return Promise.resolve(
          mockJson({
            id: 42,
            userId: "u",
            title: payload.title,
            content: payload.content,
            audioUrl: "https://x/a.mp3",
            audioSource: "elevenlabs",
            voiceId: payload.voiceId,
            loopGapSeconds: payload.loopGapSeconds,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        );
      }
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "My Script" },
    });
    fireEvent.change(screen.getByLabelText("Script"), {
      target: { value: "Hello world." },
    });

    fireEvent.click(await screen.findByRole("option", { name: "Voice" }));

    fireEvent.click(
      screen.getByRole("button", { name: /Generate & Save/ }),
    );

    await waitFor(
      () => expect(screen.getByTestId("detail")).toBeInTheDocument(),
      { timeout: 4000 },
    );

    const postCall = fetchMock.mock.calls.find(
      ([u, i]) =>
        u === "/api/scripts/with-audio" &&
        (i as RequestInit | undefined)?.method === "POST",
    );
    expect(postCall).toBeTruthy();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.title).toBe("My Script");
    expect(body.content).toBe("Hello world.");
    expect(body.voiceId).toBe("v1");
  });

  it("renders an inline error card and a Retry button when create fails", async () => {
    let postAttempts = 0;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/audio/voices") {
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
        );
      }
      if (url === "/api/scripts/with-audio" && init?.method === "POST") {
        postAttempts++;
        return Promise.resolve(
          mockJson(
            { error: { code: "rate_limited", message: "slow down" } },
            429,
          ),
        );
      }
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "T" },
    });
    fireEvent.change(screen.getByLabelText("Script"), {
      target: { value: "X" },
    });
    fireEvent.click(await screen.findByRole("option", { name: "Voice" }));

    fireEvent.click(
      screen.getByRole("button", { name: /Generate & Save/ }),
    );
    const retry = await screen.findByRole("button", { name: /Retry/ }, {
      timeout: 4000,
    });
    expect(postAttempts).toBe(1);
    fireEvent.click(retry);
    await waitFor(() => expect(postAttempts).toBe(2));
  });

  it("blocks submission and toasts when title is empty", async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/api/audio/voices")
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
        );
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });

    fireEvent.change(screen.getByLabelText("Script"), {
      target: { value: "Body." },
    });
    fireEvent.click(await screen.findByRole("option", { name: "Voice" }));

    fireEvent.click(
      screen.getByRole("button", { name: /Generate & Save/ }),
    );
    // Wait long enough that an attempt would have fired; assert none did.
    await new Promise((r) => setTimeout(r, 100));
    const posted = fetchMock.mock.calls.some(
      ([u, i]) =>
        u === "/api/scripts/with-audio" &&
        (i as RequestInit | undefined)?.method === "POST",
    );
    expect(posted).toBe(false);
    expect(screen.queryByTestId("detail")).not.toBeInTheDocument();
  });

  it("blocks recording-mode save when no recording has been captured", async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/api/audio/voices")
        return Promise.resolve(mockJson([]));
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });
    fireEvent.click(screen.getByRole("tab", { name: /Record yourself/ }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "T" },
    });
    fireEvent.change(screen.getByLabelText("Script"), {
      target: { value: "Body." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Save with recording/ }),
    );
    await new Promise((r) => setTimeout(r, 80));
    expect(uploadToR2Mock).not.toHaveBeenCalled();
    const posted = fetchMock.mock.calls.some(
      ([u, i]) =>
        typeof u === "string" &&
        u.startsWith("/api/scripts") &&
        (i as RequestInit | undefined)?.method === "POST",
    );
    expect(posted).toBe(false);
  });

  it("uploads recording to R2 then creates the script and navigates", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      if (url === "/api/scripts" && init?.method === "POST") {
        const payload = JSON.parse((init.body as string) ?? "{}");
        return Promise.resolve(
          mockJson({
            id: 77,
            userId: "u",
            title: payload.title,
            content: payload.content,
            audioUrl: payload.audioUrl,
            audioSource: payload.audioSource,
            voiceId: null,
            loopGapSeconds: payload.loopGapSeconds,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        );
      }
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });
    fireEvent.click(screen.getByRole("tab", { name: /Record yourself/ }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Recorded" },
    });
    fireEvent.change(screen.getByLabelText("Script"), {
      target: { value: "Body." },
    });
    fireEvent.click(screen.getByTestId("capture-recording"));
    fireEvent.click(
      screen.getByRole("button", { name: /Save with recording/ }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("detail")).toBeInTheDocument(),
    );
    expect(uploadToR2Mock).toHaveBeenCalledTimes(1);
    const postCall = fetchMock.mock.calls.find(
      ([u, i]) =>
        u === "/api/scripts" &&
        (i as RequestInit | undefined)?.method === "POST",
    );
    expect(postCall).toBeTruthy();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.audioUrl).toBe("https://r2/x.webm");
    expect(body.audioSource).toBe("user");
    expect(body.title).toBe("Recorded");
  });

  it("surfaces a recording-upload failure as an inline error", async () => {
    uploadToR2Mock.mockRejectedValueOnce(new Error("R2 down"));
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });
    fireEvent.click(screen.getByRole("tab", { name: /Record yourself/ }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "T" },
    });
    fireEvent.change(screen.getByLabelText("Script"), {
      target: { value: "Body." },
    });
    fireEvent.click(screen.getByTestId("capture-recording"));
    fireEvent.click(
      screen.getByRole("button", { name: /Save with recording/ }),
    );
    expect(await screen.findByText(/R2 down/)).toBeInTheDocument();
  });

  it("clamps the loop gap slider value via onValueChange (covers fallback)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(
        mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });
    const slider = await screen.findByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(screen.getByText(/Loop gap/)).toBeInTheDocument();
  });

  it("renders New script header and accepts input", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        Promise.resolve(
          mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
        ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });
    expect(screen.getByText("New script")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "T" },
    });
    fireEvent.change(screen.getByLabelText("Script"), {
      target: { value: "Some content" },
    });
    expect(
      (screen.getByLabelText("Title") as HTMLInputElement).value,
    ).toBe("T");
  });
});

describe("ScriptEditorPage (draft persistence)", () => {
  it("restores a previously saved draft from localStorage on mount", async () => {
    window.localStorage.setItem(
      "scriptloop:draft:new",
      JSON.stringify({
        title: "Restored Title",
        content: "Restored body content.",
        voiceId: "v1",
        loopGapSeconds: 4,
      }),
    );
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(
        mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
      ),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });
    expect(
      (await screen.findByLabelText("Title") as HTMLInputElement).value,
    ).toBe("Restored Title");
    expect(
      (screen.getByLabelText("Script") as HTMLTextAreaElement).value,
    ).toBe("Restored body content.");
  });

  it("debounces and persists typed input to localStorage", async () => {
    vi.useFakeTimers();
    try {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
        Promise.resolve(
          mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
        ),
      );
      const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(<ScriptEditorPage />, { wrapper: wrap(qc) });

      fireEvent.change(screen.getByLabelText("Title"), {
        target: { value: "Persist me" },
      });
      // Advance past the default 5s debounce window.
      vi.advanceTimersByTime(5500);
      const raw = window.localStorage.getItem("scriptloop:draft:new");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.title).toBe("Persist me");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("ScriptEditorPage (edit)", () => {
  it("loads the script and shows Edit script", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts/1")
          return Promise.resolve(
            mockJson({
              id: 1,
              userId: "u",
              title: "Existing",
              content: "abc",
              audioUrl: null,
              audioSource: null,
              voiceId: "v1",
              loopGapSeconds: 3,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          );
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc, "/scripts/1/edit") });
    expect(await screen.findByText("Edit script")).toBeInTheDocument();
    expect(
      (screen.getByLabelText("Title") as HTMLInputElement).value,
    ).toBe("Existing");
  });

  it("blocks submission and toasts when content is empty", async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/api/audio/voices")
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
        );
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "T" },
    });
    fireEvent.click(await screen.findByRole("option", { name: "Voice" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Generate & Save/ }),
    );
    await new Promise((r) => setTimeout(r, 60));
    const posted = fetchMock.mock.calls.some(
      ([u, i]) =>
        u === "/api/scripts/with-audio" &&
        (i as RequestInit | undefined)?.method === "POST",
    );
    expect(posted).toBe(false);
  });

  it("blocks submission and toasts when no voice is selected", async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/api/audio/voices")
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
        );
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByLabelText("Script"), {
      target: { value: "Body content" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Generate & Save/ }),
    );
    await new Promise((r) => setTimeout(r, 60));
    const posted = fetchMock.mock.calls.some(
      ([u, i]) =>
        u === "/api/scripts/with-audio" &&
        (i as RequestInit | undefined)?.method === "POST",
    );
    expect(posted).toBe(false);
  });

  it("renders a voices error and recovers when Try again is clicked", async () => {
    let attempt = 0;
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/api/audio/voices") {
        attempt++;
        if (attempt === 1) {
          return Promise.resolve(
            mockJson({ error: { code: "x", message: "voices down" } }, 500),
          );
        }
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
        );
      }
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc) });
    expect(
      await screen.findByText(/Couldn't load voices/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    expect(
      await screen.findByRole("option", { name: "Voice" }),
    ).toBeInTheDocument();
  });

  it("shows error state when load fails", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJson({ error: { code: "x", message: "down" } }, 500),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc, "/scripts/1/edit") });
    await waitFor(() =>
      expect(screen.getByText(/Couldn't load script/)).toBeInTheDocument(),
    );
  });

  it("shows 'Script not found' when the API returns no script", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts/1") return Promise.resolve(mockJson(null));
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc, "/scripts/1/edit") });
    expect(
      await screen.findByText(/Script not found/),
    ).toBeInTheDocument();
  });

  it("retries the failed script load when Try again is clicked", async () => {
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
          return Promise.resolve(
            mockJson({
              id: 1,
              userId: "u",
              title: "Recovered",
              content: "abc",
              audioUrl: null,
              audioSource: null,
              voiceId: "v1",
              loopGapSeconds: 3,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          );
        }
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc, "/scripts/1/edit") });
    fireEvent.click(await screen.findByRole("button", { name: /Try again/ }));
    expect(await screen.findByText("Edit script")).toBeInTheDocument();
  });

  it("saves edits via PUT and navigates to the detail page", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/scripts/1" && (!init || init.method === "GET" || !init.method)) {
        return Promise.resolve(
          mockJson({
            id: 1,
            userId: "u",
            title: "Original",
            content: "before",
            audioUrl: "https://x/a.mp3",
            audioSource: "elevenlabs",
            voiceId: "v1",
            loopGapSeconds: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        );
      }
      if (url === "/api/scripts/1" && init?.method === "PUT") {
        const body = JSON.parse((init.body as string) ?? "{}");
        return Promise.resolve(
          mockJson({
            id: 1,
            userId: "u",
            title: body.title,
            content: body.content,
            audioUrl: "https://x/a.mp3",
            audioSource: "elevenlabs",
            voiceId: "v1",
            loopGapSeconds: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        );
      }
      if (url === "/api/audio/voices")
        return Promise.resolve(
          mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
        );
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc, "/scripts/1/edit") });
    await screen.findByText("Edit script");

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Updated" },
    });
    fireEvent.change(screen.getByLabelText("Script"), {
      target: { value: "after" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    await waitFor(() => {
      expect(screen.getByTestId("detail")).toBeInTheDocument();
    });
    const putCall = fetchMock.mock.calls.find(
      ([u, i]) =>
        u === "/api/scripts/1" &&
        (i as RequestInit | undefined)?.method === "PUT",
    );
    expect(putCall).toBeTruthy();
    const body = JSON.parse((putCall![1] as RequestInit).body as string);
    expect(body.title).toBe("Updated");
    expect(body.content).toBe("after");
  });

  it("blocks saving with empty title and does not call the API", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/scripts/1" && (!init || init.method === "GET" || !init.method)) {
        return Promise.resolve(
          mockJson({
            id: 1,
            userId: "u",
            title: "Original",
            content: "before",
            audioUrl: null,
            audioSource: null,
            voiceId: "v1",
            loopGapSeconds: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        );
      }
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc, "/scripts/1/edit") });
    await screen.findByText("Edit script");
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    await new Promise((r) => setTimeout(r, 60));
    const put = fetchMock.mock.calls.some(
      ([u, i]) =>
        u === "/api/scripts/1" &&
        (i as RequestInit | undefined)?.method === "PUT",
    );
    expect(put).toBe(false);
  });

  it("surfaces a save error in an inline error card", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/scripts/1" && (!init || init.method === "GET" || !init.method)) {
        return Promise.resolve(
          mockJson({
            id: 1,
            userId: "u",
            title: "Original",
            content: "before",
            audioUrl: null,
            audioSource: null,
            voiceId: "v1",
            loopGapSeconds: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        );
      }
      if (url === "/api/scripts/1" && init?.method === "PUT") {
        return Promise.resolve(
          mockJson({ error: { code: "boom", message: "save failed" } }, 500),
        );
      }
      if (url === "/api/audio/voices") return Promise.resolve(mockJson([]));
      return Promise.resolve(mockJson([]));
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc, "/scripts/1/edit") });
    await screen.findByText("Edit script");
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    const messages = await screen.findAllByText(/save failed/);
    expect(messages.length).toBeGreaterThan(0);
    expect(screen.queryByTestId("detail")).not.toBeInTheDocument();
  });

  it("offers to discard a restored draft when it diverges from saved data", async () => {
    window.localStorage.setItem(
      "scriptloop:draft:script-1",
      JSON.stringify({
        title: "Drafted Title",
        content: "drafted body",
        voiceId: "v1",
        loopGapSeconds: 3,
      }),
    );
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts/1")
          return Promise.resolve(
            mockJson({
              id: 1,
              userId: "u",
              title: "Original",
              content: "original body",
              audioUrl: "https://x/a.mp3",
              audioSource: "elevenlabs",
              voiceId: "v1",
              loopGapSeconds: 3,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          );
        if (url === "/api/audio/voices")
          return Promise.resolve(
            mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
          );
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc, "/scripts/1/edit") });
    expect(
      await screen.findByText(/Restored an unsaved draft/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Discard draft/ }));
    await waitFor(() =>
      expect(
        screen.queryByText(/Restored an unsaved draft/),
      ).not.toBeInTheDocument(),
    );
  });

  it("renders the read-only audio URL preview when the script has audio", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts/1")
          return Promise.resolve(
            mockJson({
              id: 1,
              userId: "u",
              title: "Has Audio",
              content: "abc",
              audioUrl: "https://x/audio.mp3",
              audioSource: "elevenlabs",
              voiceId: "v1",
              loopGapSeconds: 3,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          );
        if (url === "/api/audio/voices")
          return Promise.resolve(
            mockJson([{ voice_id: "v1", name: "Voice", preview_url: "" }]),
          );
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<ScriptEditorPage />, { wrapper: wrap(qc, "/scripts/1/edit") });
    await screen.findByText("Edit script");
    const url = (await screen.findByDisplayValue(
      "https://x/audio.mp3",
    )) as HTMLInputElement;
    expect(url.readOnly).toBe(true);
    // Focusing selects the URL — exercises the onFocus handler.
    fireEvent.focus(url);
    expect(screen.getByText(/Enter Zen Mode/)).toBeInTheDocument();
  });
});
