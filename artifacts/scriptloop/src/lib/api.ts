import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { Script } from "@/db/schema";

export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfterSeconds?: number;
  constructor(
    message: string,
    opts: { status: number; code?: string; retryAfterSeconds?: number },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.retryAfterSeconds = opts.retryAfterSeconds;
  }
}

async function http<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`;
    let code: string | undefined;
    let retryAfterSeconds: number | undefined;
    try {
      const body = await res.json();
      // Prefer the structured `message` (user-friendly) over the machine
      // `error` code so toasts read nicely.
      if (typeof body?.message === "string") message = body.message;
      else if (typeof body?.error === "string") message = body.error;
      if (typeof body?.error === "string") code = body.error;
      if (typeof body?.retryAfterSeconds === "number") {
        retryAfterSeconds = body.retryAfterSeconds;
      }
    } catch {
      // ignore — keep statusText
    }
    if (retryAfterSeconds === undefined) {
      const header = res.headers.get("Retry-After");
      if (header) {
        const parsed = Number(header);
        if (Number.isFinite(parsed)) retryAfterSeconds = parsed;
      }
    }
    throw new ApiError(message, {
      status: res.status,
      code,
      retryAfterSeconds,
    });
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface Voice {
  voice_id: string;
  name: string;
  preview_url: string;
}

export function useScripts() {
  return useQuery({
    queryKey: ["scripts"],
    queryFn: () => http<Script[]>("/api/scripts"),
  });
}

export function useScript(id: number | undefined) {
  return useQuery({
    queryKey: ["scripts", id],
    queryFn: () => http<Script>(`/api/scripts/${id}`),
    enabled: !!id,
  });
}

export function useCreateScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; content: string; loopGapSeconds?: number }) =>
      http<Script>("/api/scripts", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useUpdateScript(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Pick<Script, "title" | "content" | "loopGapSeconds" | "audioUrl">>) =>
      http<Script>(`/api/scripts/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["scripts"] });
      qc.setQueryData(["scripts", id], data);
    },
  });
}

export function deleteScriptRequest(id: number) {
  return http<void>(`/api/scripts/${id}`, { method: "DELETE" });
}

export function useDeleteScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteScriptRequest(id),
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: ["scripts"] });
      const previous = qc.getQueryData<Script[]>(["scripts"]);
      if (previous) {
        qc.setQueryData<Script[]>(
          ["scripts"],
          previous.filter((s) => s.id !== id),
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(["scripts"], context.previous);
      }
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: ["scripts"] });
      qc.removeQueries({ queryKey: ["scripts", id] });
    },
  });
}

export function useVoices() {
  return useQuery({
    queryKey: ["voices"],
    queryFn: () => http<Voice[]>("/api/audio/voices"),
    staleTime: 1000 * 60 * 60,
  });
}

export interface AudioQuota {
  used: number;
  limit: number;
  resetsAt: string;
}

export const audioQuotaQueryKey = ["audio-quota"] as const;

export function useAudioQuota() {
  return useQuery({
    queryKey: audioQuotaQueryKey,
    queryFn: () => http<AudioQuota>("/api/audio/quota"),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Optimistically mark the cached quota as fully consumed for the current
 * window. Called when the server returns 429 so the badge updates without
 * waiting for a refetch.
 */
export function markQuotaExhausted(
  qc: QueryClient,
  retryAfterSeconds: number,
  limit = 20,
): void {
  const resetsAt = new Date(
    Date.now() + Math.max(1, retryAfterSeconds) * 1000,
  ).toISOString();
  qc.setQueryData<AudioQuota>(audioQuotaQueryKey, (prev) => ({
    used: prev?.limit ?? limit,
    limit: prev?.limit ?? limit,
    resetsAt,
  }));
}

/** Invalidate cached quota so the next render fetches the fresh count. */
export function invalidateQuota(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: audioQuotaQueryKey });
}

export interface GenerateAudioInput {
  text: string;
  voiceId: string;
}

export interface GenerateAudioResponse {
  audioUrl: string;
  durationSeconds: number;
  script: Script | null;
}

export function generateAudioRequest(input: {
  scriptId: number;
  text: string;
  voiceId: string;
}) {
  return http<GenerateAudioResponse>("/api/generate-audio", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function useGenerateAudio(scriptId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, voiceId }: GenerateAudioInput) =>
      generateAudioRequest({ scriptId, text, voiceId }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["scripts"] });
      if (data.script) {
        qc.setQueryData(["scripts", scriptId], data.script);
      } else {
        qc.invalidateQueries({ queryKey: ["scripts", scriptId] });
      }
      invalidateQuota(qc);
    },
    onError: (err) => {
      if (
        err instanceof ApiError &&
        err.status === 429 &&
        err.retryAfterSeconds !== undefined
      ) {
        markQuotaExhausted(qc, err.retryAfterSeconds);
      } else {
        invalidateQuota(qc);
      }
    },
  });
}
