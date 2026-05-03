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
      // New shape: { error: { code, message, retryAfterSeconds?, details? } }
      if (body?.error && typeof body.error === "object") {
        const err = body.error as {
          code?: unknown;
          message?: unknown;
          retryAfterSeconds?: unknown;
        };
        if (typeof err.message === "string") message = err.message;
        if (typeof err.code === "string") code = err.code;
        if (typeof err.retryAfterSeconds === "number") {
          retryAfterSeconds = err.retryAfterSeconds;
        }
      } else {
        // Backwards-compat: legacy flat shape { error, message, retryAfterSeconds }
        if (typeof body?.message === "string") message = body.message;
        else if (typeof body?.error === "string") message = body.error;
        if (typeof body?.error === "string") code = body.error;
        if (typeof body?.retryAfterSeconds === "number") {
          retryAfterSeconds = body.retryAfterSeconds;
        }
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

export interface CreateScriptInput {
  title: string;
  content: string;
  loopGapSeconds?: number;
  // When the user recorded their own audio, the client uploads it to
  // R2 first (via `uploadToR2`) and passes the resulting public URL
  // here together with `audioSource: "user"`. Both fields must be sent
  // together — the server rejects partial pairs with `invalid_request`.
  audioUrl?: string;
  audioSource?: "user" | "ai" | "elevenlabs";
}

export function useCreateScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScriptInput) =>
      http<Script>("/api/scripts", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (script) => {
      qc.invalidateQueries({ queryKey: ["scripts"] });
      qc.setQueryData(["scripts", script.id], script);
    },
  });
}

export interface CreateScriptWithAudioInput {
  title: string;
  content: string;
  loopGapSeconds?: number;
  voiceId: string;
}

/**
 * Atomic create-and-generate: the server generates audio first and only
 * inserts the script row after upload succeeds, so a failure here leaves
 * no row behind and no client-side rollback is needed.
 */
export function useCreateScriptWithAudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScriptWithAudioInput) =>
      http<Script>("/api/scripts/with-audio", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (script) => {
      qc.invalidateQueries({ queryKey: ["scripts"] });
      qc.setQueryData(["scripts", script.id], script);
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

export function useUpdateScript(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Partial<
        Pick<
          Script,
          | "title"
          | "content"
          | "loopGapSeconds"
          | "audioUrl"
          | "audioSource"
          | "readingOverrides"
        >
      >,
    ) =>
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

export interface MeResponse {
  userId: string;
  email: string;
  isAdmin: boolean;
  disabled: boolean;
}

export function useMe(options: { enabled?: boolean } = {}) {
  // Defaults to enabled so existing callers keep working, but pages
  // gated behind RequireAuth pass `enabled: hasSession` to avoid an
  // unauthenticated /api/me call while the auth session is still
  // bootstrapping (which would otherwise 401 and pollute the cache).
  return useQuery({
    queryKey: ["me"],
    queryFn: () => http<MeResponse>("/api/me"),
    staleTime: 60_000,
    retry: false,
    enabled: options.enabled ?? true,
  });
}

export interface AdminOverview {
  totalUsers: number;
  totalScripts: number;
  scriptsLast7Days: number;
  scriptsLast30Days: number;
  totalAdmins: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isAdmin: boolean;
  disabled: boolean;
  scriptCount: number;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminUserDetailResponse {
  user: Omit<AdminUserRow, "scriptCount">;
  scripts: Script[];
}

export function useAdminOverview(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => http<AdminOverview>("/api/admin/overview"),
    enabled,
  });
}

export function useAdminUsers(
  params: { q?: string; page: number; pageSize: number },
  enabled: boolean,
) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page));
  search.set("pageSize", String(params.pageSize));
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () =>
      http<AdminUsersResponse>(`/api/admin/users?${search.toString()}`),
    enabled,
  });
}

export function useAdminUserDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () =>
      http<AdminUserDetailResponse>(`/api/admin/users/${userId}`),
    enabled: !!userId,
  });
}

function adminAction(userId: string, action: string) {
  return http<{ ok: true }>(`/api/admin/users/${userId}/${action}`, {
    method: "POST",
  });
}

export function useAdminUserAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      action,
    }: {
      userId: string;
      action: "promote" | "demote" | "disable" | "enable";
    }) => adminAction(userId, action),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "users", userId] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useAdminDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      http<void>(`/api/admin/users/${userId}`, { method: "DELETE" }),
    onSuccess: (_d, userId) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.removeQueries({ queryKey: ["admin", "users", userId] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useAdminDeleteScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scriptId: number) =>
      http<void>(`/api/admin/scripts/${scriptId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
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
