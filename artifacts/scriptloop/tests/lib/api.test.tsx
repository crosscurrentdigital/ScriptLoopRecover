import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ApiError,
  audioQuotaQueryKey,
  deleteScriptRequest,
  generateAudioRequest,
  invalidateQuota,
  markQuotaExhausted,
  useAudioQuota,
  useCreateScript,
  useCreateScriptWithAudio,
  useDeleteScript,
  useGenerateAudio,
  useScript,
  useScripts,
  useUpdateScript,
  useVoices,
} from "@/lib/api";
import type { ReactNode } from "react";

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    qc,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

function mockJson(body: unknown, status = 200, extra: Partial<Response> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    headers: new Headers(),
    json: async () => body,
    ...extra,
  };
}

describe("ApiError parsing", () => {
  it("parses new error shape with code/message/retryAfterSeconds", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce(
      mockJson(
        {
          error: { code: "rate_limited", message: "stop", retryAfterSeconds: 7 },
        },
        429,
      ),
    );
    await expect(deleteScriptRequest(1)).rejects.toMatchObject({
      name: "ApiError",
      status: 429,
      code: "rate_limited",
      message: "stop",
      retryAfterSeconds: 7,
    });
  });

  it("falls back to legacy flat shape", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce(
      mockJson({ error: "rate_limited", message: "old", retryAfterSeconds: 5 }, 429),
    );
    await expect(deleteScriptRequest(1)).rejects.toMatchObject({
      status: 429,
      code: "rate_limited",
      message: "old",
      retryAfterSeconds: 5,
    });
  });

  it("uses Retry-After header when no retryAfterSeconds in body", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many",
      headers: new Headers({ "Retry-After": "42" }),
      json: async () => ({}),
    });
    await expect(deleteScriptRequest(1)).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 42,
    });
  });

  it("falls back to statusText when JSON parse fails", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Boom",
      headers: new Headers(),
      json: async () => {
        throw new Error("nope");
      },
    });
    await expect(deleteScriptRequest(1)).rejects.toMatchObject({
      status: 500,
      message: "Server Boom",
    });
  });

  it("returns undefined for 204", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: "",
      headers: new Headers(),
      json: async () => null,
    });
    await expect(deleteScriptRequest(1)).resolves.toBeUndefined();
  });

  it("ApiError is throwable and has expected name", () => {
    const e = new ApiError("boom", { status: 500, code: "x" });
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ApiError");
    expect(e.code).toBe("x");
  });
});

describe("query hooks", () => {
  it("useScripts fetches /api/scripts", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce(
      mockJson([{ id: 1, title: "t" }]),
    );
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useScripts(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, title: "t" }]);
    expect((globalThis.fetch as Mock).mock.calls[0][0]).toBe("/api/scripts");
  });

  it("useScript is disabled without an id", () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useScript(undefined), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useScript fetches when id provided", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce(mockJson({ id: 5 }));
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useScript(5), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((globalThis.fetch as Mock).mock.calls[0][0]).toBe("/api/scripts/5");
  });

  it("useVoices and useAudioQuota hit their endpoints", async () => {
    (globalThis.fetch as Mock)
      .mockResolvedValueOnce(mockJson([{ voice_id: "v" }]))
      .mockResolvedValueOnce(
        mockJson({ used: 1, limit: 20, resetsAt: "2030-01-01T00:00:00Z" }),
      );
    const { Wrapper } = wrapper();
    const v = renderHook(() => useVoices(), { wrapper: Wrapper });
    await waitFor(() => expect(v.result.current.isSuccess).toBe(true));
    const q = renderHook(() => useAudioQuota(), { wrapper: Wrapper });
    await waitFor(() => expect(q.result.current.isSuccess).toBe(true));
    expect(q.result.current.data?.limit).toBe(20);
  });
});

describe("mutation hooks", () => {
  it("useCreateScript posts and invalidates scripts", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce(
      mockJson({ id: 1, title: "t", content: "c" }, 201),
    );
    const { qc, Wrapper } = wrapper();
    const inv = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateScript(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ title: "t", content: "c" });
    });
    expect(inv).toHaveBeenCalledWith({ queryKey: ["scripts"] });
  });

  it("useCreateScriptWithAudio sets cached data + invalidates quota on success", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce(
      mockJson({ id: 9, title: "t", content: "c" }, 201),
    );
    const { qc, Wrapper } = wrapper();
    const set = vi.spyOn(qc, "setQueryData");
    const { result } = renderHook(() => useCreateScriptWithAudio(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        title: "t",
        content: "c",
        voiceId: "v1",
      });
    });
    expect(set).toHaveBeenCalledWith(["scripts", 9], expect.objectContaining({ id: 9 }));
  });

  it("useCreateScriptWithAudio marks quota exhausted on 429 with retry-after", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce(
      mockJson(
        {
          error: {
            code: "rate_limited",
            message: "no",
            retryAfterSeconds: 60,
          },
        },
        429,
      ),
    );
    const { qc, Wrapper } = wrapper();
    const { result } = renderHook(() => useCreateScriptWithAudio(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      try {
        await result.current.mutateAsync({
          title: "t",
          content: "c",
          voiceId: "v1",
        });
      } catch {
        /* expected */
      }
    });
    const cached = qc.getQueryData(audioQuotaQueryKey) as {
      used: number;
      limit: number;
    };
    expect(cached.used).toBe(cached.limit);
  });

  it("useUpdateScript PUTs and updates cache", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce(
      mockJson({ id: 1, title: "new", content: "c" }),
    );
    const { qc, Wrapper } = wrapper();
    const set = vi.spyOn(qc, "setQueryData");
    const { result } = renderHook(() => useUpdateScript(1), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ title: "new" });
    });
    expect(set).toHaveBeenCalledWith(["scripts", 1], expect.any(Object));
    const init = (globalThis.fetch as Mock).mock.calls[0][1];
    expect(init.method).toBe("PUT");
  });

  it("useDeleteScript optimistically removes and rolls back on error", async () => {
    const { qc, Wrapper } = wrapper();
    qc.setQueryData(["scripts"], [{ id: 1 }, { id: 2 }]);
    (globalThis.fetch as Mock).mockResolvedValueOnce(
      mockJson({ error: { code: "x", message: "fail" } }, 500),
    );
    const { result } = renderHook(() => useDeleteScript(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      try {
        await result.current.mutateAsync(1);
      } catch {
        /* expected */
      }
    });
    const after = qc.getQueryData(["scripts"]);
    expect(after).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("useGenerateAudio updates cache when script returned", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce(
      mockJson({
        audioUrl: "u",
        durationSeconds: 1,
        script: { id: 1, title: "t", audioUrl: "u" },
      }),
    );
    const { qc, Wrapper } = wrapper();
    const set = vi.spyOn(qc, "setQueryData");
    const { result } = renderHook(() => useGenerateAudio(1), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({ text: "hi", voiceId: "v" });
    });
    expect(set).toHaveBeenCalledWith(["scripts", 1], expect.objectContaining({ id: 1 }));
  });

  it("generateAudioRequest posts to /api/generate-audio", async () => {
    (globalThis.fetch as Mock).mockResolvedValueOnce(
      mockJson({ audioUrl: "u", durationSeconds: 1, script: null }),
    );
    const out = await generateAudioRequest({
      scriptId: 1,
      text: "x",
      voiceId: "v",
    });
    expect(out.audioUrl).toBe("u");
    expect((globalThis.fetch as Mock).mock.calls[0][0]).toBe(
      "/api/generate-audio",
    );
  });
});

describe("quota cache helpers", () => {
  it("markQuotaExhausted seeds limit=20 default and used=limit", () => {
    const qc = new QueryClient();
    markQuotaExhausted(qc, 60);
    const cached = qc.getQueryData(audioQuotaQueryKey) as {
      used: number;
      limit: number;
      resetsAt: string;
    };
    expect(cached.used).toBe(20);
    expect(cached.limit).toBe(20);
    expect(new Date(cached.resetsAt).getTime()).toBeGreaterThan(Date.now());
  });
  it("invalidateQuota calls invalidateQueries on the right key", () => {
    const qc = new QueryClient();
    const inv = vi.spyOn(qc, "invalidateQueries");
    invalidateQuota(qc);
    expect(inv).toHaveBeenCalledWith({ queryKey: audioQuotaQueryKey });
  });
});
