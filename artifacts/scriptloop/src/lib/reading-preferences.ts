import type { ReadingPreferencesData } from "@/db/schema";

export type ReadingPreferences = ReadingPreferencesData;

export interface FontOption {
  value: string;
  label: string;
  cssFamily: string;
}

export interface ColorOption {
  value: string;
  label: string;
  hex: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    value: "atkinson",
    label: "Atkinson Hyperlegible",
    cssFamily:
      "'Atkinson Hyperlegible', system-ui, -apple-system, sans-serif",
  },
  { value: "georgia", label: "Georgia", cssFamily: "Georgia, serif" },
  {
    value: "roboto",
    label: "Roboto",
    cssFamily: "'Roboto', system-ui, sans-serif",
  },
  { value: "lato", label: "Lato", cssFamily: "'Lato', system-ui, sans-serif" },
  { value: "verdana", label: "Verdana", cssFamily: "Verdana, sans-serif" },
  {
    value: "lexend",
    label: "Lexend",
    cssFamily: "'Lexend', system-ui, sans-serif",
  },
  {
    value: "opendyslexic",
    label: "OpenDyslexic",
    cssFamily: "'OpenDyslexic', Comic Sans MS, sans-serif",
  },
  {
    value: "comic",
    label: "Comic Sans MS",
    cssFamily: "'Comic Sans MS', 'Comic Sans', cursive",
  },
];

export const BACKGROUND_OPTIONS: ColorOption[] = [
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "cream", label: "Cream", hex: "#FAF6EE" },
  { value: "paleYellow", label: "Pale Yellow", hex: "#FFF8C9" },
  { value: "paleBlue", label: "Pale Blue", hex: "#E6F1FB" },
  { value: "palePink", label: "Pale Pink", hex: "#FBE8EE" },
  { value: "sepia", label: "Sepia", hex: "#F1E4CF" },
  { value: "darkGray", label: "Dark Gray", hex: "#2A2A2A" },
];

export const TEXT_OPTIONS: ColorOption[] = [
  { value: "black", label: "Black", hex: "#111111" },
  { value: "darkGray", label: "Dark Gray", hex: "#333333" },
  { value: "darkBrown", label: "Dark Brown", hex: "#3A2A1A" },
  { value: "offWhite", label: "Off-White", hex: "#F2EFE8" },
];

export const DEFAULT_PREFERENCES: ReadingPreferences = {
  fontFamily: "atkinson",
  backgroundColor: "cream",
  textColor: "darkGray",
  letterSpacing: 0,
  lineHeight: 1.6,
  fontSize: 18,
};

export interface ThemePreset {
  id: string;
  name: string;
  prefs: ReadingPreferences;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "default", name: "Default", prefs: DEFAULT_PREFERENCES },
  {
    id: "dyslexia",
    name: "Dyslexia-Friendly",
    prefs: {
      fontFamily: "opendyslexic",
      backgroundColor: "paleYellow",
      textColor: "darkGray",
      letterSpacing: 1,
      lineHeight: 1.8,
      fontSize: 18,
    },
  },
  {
    id: "night",
    name: "Night Reading",
    prefs: {
      fontFamily: "atkinson",
      backgroundColor: "darkGray",
      textColor: "offWhite",
      letterSpacing: 0,
      lineHeight: 1.6,
      fontSize: 18,
    },
  },
];

export const SLIDER_RANGES = {
  letterSpacing: { min: 0, max: 4, step: 0.5 },
  lineHeight: { min: 1.2, max: 2.4, step: 0.1 },
  fontSize: { min: 14, max: 28, step: 1 },
} as const;

export const INFO_TEXT = {
  fontFamily:
    "Different fonts affect readability — sans-serif and dyslexia-friendly fonts can be easier to scan.",
  backgroundColor:
    "A softer background reduces glare and is gentler on the eyes during long reading sessions.",
  textColor:
    "Strong contrast between text and background improves comprehension and reduces eye strain.",
  letterSpacing:
    "Extra space between letters helps readers tell similar characters apart.",
  lineHeight:
    "More space between lines makes it easier for your eyes to track from one line to the next.",
  fontSize:
    "Larger text is easier to read and reduces eye strain, especially on long passages.",
} as const;

const DARK_BACKGROUNDS = new Set(["darkGray"]);

export function suggestTextColor(backgroundValue: string): string {
  return DARK_BACKGROUNDS.has(backgroundValue) ? "offWhite" : "darkGray";
}

export function getFontCssFamily(value: string): string {
  return (
    FONT_OPTIONS.find((f) => f.value === value)?.cssFamily ??
    FONT_OPTIONS[0].cssFamily
  );
}

export function getColorHex(
  options: ColorOption[],
  value: string,
  fallback: string,
): string {
  return options.find((c) => c.value === value)?.hex ?? fallback;
}

export function getBackgroundHex(value: string): string {
  return getColorHex(BACKGROUND_OPTIONS, value, "#FAF6EE");
}

export function getTextHex(value: string): string {
  return getColorHex(TEXT_OPTIONS, value, "#333333");
}

export function preferencesToCssVars(
  prefs: ReadingPreferences,
): Record<string, string> {
  return {
    "--reading-font": getFontCssFamily(prefs.fontFamily),
    "--reading-bg": getBackgroundHex(prefs.backgroundColor),
    "--reading-fg": getTextHex(prefs.textColor),
    "--reading-letter-spacing": `${prefs.letterSpacing}px`,
    "--reading-line-height": String(prefs.lineHeight),
    "--reading-font-size": `${prefs.fontSize}px`,
  };
}

export function sanitizePreferences(
  input: Partial<ReadingPreferences> | null | undefined,
): ReadingPreferences {
  const merged = { ...DEFAULT_PREFERENCES, ...(input ?? {}) };
  if (!FONT_OPTIONS.some((f) => f.value === merged.fontFamily)) {
    merged.fontFamily = DEFAULT_PREFERENCES.fontFamily;
  }
  if (!BACKGROUND_OPTIONS.some((c) => c.value === merged.backgroundColor)) {
    merged.backgroundColor = DEFAULT_PREFERENCES.backgroundColor;
  }
  if (!TEXT_OPTIONS.some((c) => c.value === merged.textColor)) {
    merged.textColor = DEFAULT_PREFERENCES.textColor;
  }
  const ls = SLIDER_RANGES.letterSpacing;
  merged.letterSpacing = clamp(merged.letterSpacing, ls.min, ls.max);
  const lh = SLIDER_RANGES.lineHeight;
  merged.lineHeight = clamp(merged.lineHeight, lh.min, lh.max);
  const fs = SLIDER_RANGES.fontSize;
  merged.fontSize = clamp(merged.fontSize, fs.min, fs.max);
  return merged;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export const SAMPLE_VERSE =
  "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16";

export const READING_PREFERENCES_STORAGE_KEY = "scriptloop:readingPreferences";

/**
 * Resolve the reading preferences that should be used for a given script:
 * the per-script override when present, otherwise the user-level global.
 */
export function effectiveReadingPreferences(
  globalPrefs: ReadingPreferences,
  override: Partial<ReadingPreferences> | null | undefined,
): ReadingPreferences {
  if (!override) return globalPrefs;
  return sanitizePreferences({ ...globalPrefs, ...override });
}
