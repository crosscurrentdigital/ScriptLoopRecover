import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "scriptloop:draft:";

export interface UseDraftOptions<T> {
  key: string;
  initial: T;
  debounceMs?: number;
}

export function useDraft<T>({ key, initial, debounceMs = 500 }: UseDraftOptions<T>) {
  const storageKey = STORAGE_PREFIX + key;
  const [draft, setDraftState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  const [isDirty, setIsDirty] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const setDraft = useCallback((next: T | ((prev: T) => T)) => {
    setDraftState((prev) => {
      const value =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      setIsDirty(true);
      return value;
    });
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(draft));
        setIsDirty(false);
      } catch {
        // quota exceeded — silently ignore
      }
    }, debounceMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [draft, debounceMs, storageKey, isDirty]);

  const clearDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setDraftState(initial);
    setIsDirty(false);
  }, [storageKey, initial]);

  const hasSavedDraft = useCallback(() => {
    try {
      return window.localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }, [storageKey]);

  return { draft, setDraft, clearDraft, isDirty, hasSavedDraft };
}
