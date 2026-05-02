import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Script } from "@/db/schema";

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
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message || `HTTP ${res.status}`);
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

export function useDeleteScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      http<void>(`/api/scripts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scripts"] });
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

export interface GenerateAudioInput {
  text: string;
  voiceId: string;
}

export interface GenerateAudioResponse {
  audioUrl: string;
  durationSeconds: number;
  script: Script | null;
}

export function useGenerateAudio(scriptId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, voiceId }: GenerateAudioInput) =>
      http<GenerateAudioResponse>("/api/generate-audio", {
        method: "POST",
        body: JSON.stringify({ text, voiceId, scriptId }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["scripts"] });
      if (data.script) qc.setQueryData(["scripts", scriptId], data.script);
    },
  });
}
