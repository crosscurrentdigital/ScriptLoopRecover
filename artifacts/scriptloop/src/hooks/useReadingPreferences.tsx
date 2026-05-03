import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { authClient } from "@/lib/auth-client";
import {
  DEFAULT_PREFERENCES,
  READING_PREFERENCES_STORAGE_KEY,
  preferencesToCssVars,
  sanitizePreferences,
  type ReadingPreferences,
} from "@/lib/reading-preferences";

interface ReadingPreferencesContextValue {
  preferences: ReadingPreferences;
  setPreferences: (next: Partial<ReadingPreferences>) => void;
  resetPreferences: () => void;
  applyPreset: (preset: ReadingPreferences) => void;
  isLoaded: boolean;
}

const ReadingPreferencesContext =
  createContext<ReadingPreferencesContextValue | null>(null);

function readLocal(): ReadingPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(READING_PREFERENCES_STORAGE_KEY);
    if (!raw) return null;
    return sanitizePreferences(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocal(prefs: ReadingPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      READING_PREFERENCES_STORAGE_KEY,
      JSON.stringify(prefs),
    );
  } catch {
    // ignore quota errors
  }
}

const SAVE_DEBOUNCE_MS = 800;

export function ReadingPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = authClient.useSession();
  const userId = session.data?.user?.id;

  const [preferences, setPreferencesState] = useState<ReadingPreferences>(
    () => readLocal() ?? DEFAULT_PREFERENCES,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);
  const lastSavedRef = useRef<string>(JSON.stringify(preferences));
  const hydratedForUserRef = useRef<string | null>(null);

  // Hydrate from server when authenticated.
  useEffect(() => {
    if (!userId) {
      setIsLoaded(true);
      return;
    }
    if (hydratedForUserRef.current === userId) return;
    hydratedForUserRef.current = userId;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/preferences", {
          credentials: "include",
        });
        if (!res.ok) {
          if (!cancelled) setIsLoaded(true);
          return;
        }
        const data = (await res.json()) as {
          reading?: Partial<ReadingPreferences> | null;
        };
        if (cancelled) return;
        if (data.reading) {
          const next = sanitizePreferences(data.reading);
          setPreferencesState(next);
          writeLocal(next);
          lastSavedRef.current = JSON.stringify(next);
        }
      } catch {
        // offline / network — keep local
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Apply CSS variables globally on the root element.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const vars = preferencesToCssVars(preferences);
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }, [preferences]);

  const persist = useCallback(
    (next: ReadingPreferences) => {
      writeLocal(next);
      if (!userId) return;
      if (saveTimer.current !== undefined) {
        window.clearTimeout(saveTimer.current);
      }
      saveTimer.current = window.setTimeout(() => {
        const serialized = JSON.stringify(next);
        if (serialized === lastSavedRef.current) return;
        lastSavedRef.current = serialized;
        fetch("/api/preferences", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reading: next }),
        }).catch(() => {
          // best-effort; localStorage already has it
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [userId],
  );

  const setPreferences = useCallback(
    (patch: Partial<ReadingPreferences>) => {
      setPreferencesState((prev) => {
        const next = sanitizePreferences({ ...prev, ...patch });
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const applyPreset = useCallback(
    (preset: ReadingPreferences) => {
      const next = sanitizePreferences(preset);
      setPreferencesState(next);
      persist(next);
    },
    [persist],
  );

  const resetPreferences = useCallback(() => {
    setPreferencesState(DEFAULT_PREFERENCES);
    persist(DEFAULT_PREFERENCES);
  }, [persist]);

  const value = useMemo<ReadingPreferencesContextValue>(
    () => ({
      preferences,
      setPreferences,
      resetPreferences,
      applyPreset,
      isLoaded,
    }),
    [preferences, setPreferences, resetPreferences, applyPreset, isLoaded],
  );

  return (
    <ReadingPreferencesContext.Provider value={value}>
      {children}
    </ReadingPreferencesContext.Provider>
  );
}

export function useReadingPreferences(): ReadingPreferencesContextValue {
  const ctx = useContext(ReadingPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useReadingPreferences must be used inside ReadingPreferencesProvider",
    );
  }
  return ctx;
}
