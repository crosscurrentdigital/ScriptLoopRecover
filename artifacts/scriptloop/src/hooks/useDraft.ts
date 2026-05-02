import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_PREFIX = "scriptloop:draft:";
const DEFAULT_DEBOUNCE_MS = 5000;

export interface UseDraftOptions<T> {
  key: string;
  initial: T;
  debounceMs?: number;
}

export type DraftSetter<T> = (next: T | ((prev: T) => T)) => void;

export type DraftTuple<T> = readonly [T, DraftSetter<T>, () => void] & {
  readonly draft: T;
  readonly setDraft: DraftSetter<T>;
  readonly clearDraft: () => void;
  readonly isDirty: boolean;
  readonly hasSavedDraft: () => boolean;
};

function readFromStorage<T>(storageKey: string, initial: T): T {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return initial;
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

function readRawFromStorage(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function useDraft<T>(key: string, initial: T): DraftTuple<T>;
export function useDraft<T>(options: UseDraftOptions<T>): DraftTuple<T>;
export function useDraft<T>(
  keyOrOptions: string | UseDraftOptions<T>,
  maybeInitial?: T,
): DraftTuple<T> {
  const isOptionsForm = typeof keyOrOptions === "object";
  const key = isOptionsForm ? keyOrOptions.key : keyOrOptions;
  const initial = isOptionsForm ? keyOrOptions.initial : (maybeInitial as T);
  const debounceMs = isOptionsForm
    ? (keyOrOptions.debounceMs ?? DEFAULT_DEBOUNCE_MS)
    : DEFAULT_DEBOUNCE_MS;

  const storageKey = STORAGE_PREFIX + key;

  const [draft, setDraftState] = useState<T>(() =>
    readFromStorage(storageKey, initial),
  );

  const lastPersistedRef = useRef<string | null>(readRawFromStorage(storageKey));
  const dirtyRef = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const setDraft = useCallback<DraftSetter<T>>((next) => {
    setDraftState((prev) => {
      const value =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      dirtyRef.current = true;
      setIsDirty(true);
      return value;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!dirtyRef.current) return;

    let serialized: string;
    try {
      serialized = JSON.stringify(draft);
    } catch {
      return;
    }
    if (serialized === lastPersistedRef.current) {
      dirtyRef.current = false;
      setIsDirty(false);
      return;
    }

    if (timer.current !== undefined) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, serialized);
        lastPersistedRef.current = serialized;
        dirtyRef.current = false;
        setIsDirty(false);
      } catch {
        // quota exceeded — silently ignore
      }
    }, debounceMs);

    return () => {
      if (timer.current !== undefined) {
        window.clearTimeout(timer.current);
        timer.current = undefined;
      }
    };
  }, [draft, debounceMs, storageKey]);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    if (timer.current !== undefined && typeof window !== "undefined") {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
    lastPersistedRef.current = null;
    dirtyRef.current = false;
    setIsDirty(false);
    setDraftState(initial);
  }, [storageKey, initial]);

  const hasSavedDraft = useCallback(() => {
    return readRawFromStorage(storageKey) !== null;
  }, [storageKey]);

  return useMemo(() => {
    const tuple = [draft, setDraft, clearDraft] as const;
    const result = tuple as unknown as Mutable<DraftTuple<T>>;
    result.draft = draft;
    result.setDraft = setDraft;
    result.clearDraft = clearDraft;
    result.isDirty = isDirty;
    result.hasSavedDraft = hasSavedDraft;
    return result as DraftTuple<T>;
  }, [draft, setDraft, clearDraft, isDirty, hasSavedDraft]);
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
