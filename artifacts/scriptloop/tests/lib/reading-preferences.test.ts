import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  preferencesToCssVars,
  sanitizePreferences,
  suggestTextColor,
  type ReadingPreferences,
} from "@/lib/reading-preferences";

describe("sanitizePreferences", () => {
  it("returns defaults when given null/undefined", () => {
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(sanitizePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
  });

  it("replaces unknown enum values with defaults", () => {
    const out = sanitizePreferences({
      fontFamily: "wingdings",
      backgroundColor: "neon",
      textColor: "magenta",
    } as Partial<ReadingPreferences>);
    expect(out.fontFamily).toBe(DEFAULT_PREFERENCES.fontFamily);
    expect(out.backgroundColor).toBe(DEFAULT_PREFERENCES.backgroundColor);
    expect(out.textColor).toBe(DEFAULT_PREFERENCES.textColor);
  });

  it("preserves valid enum values", () => {
    const out = sanitizePreferences({
      fontFamily: "lexend",
      backgroundColor: "darkGray",
      textColor: "offWhite",
    });
    expect(out.fontFamily).toBe("lexend");
    expect(out.backgroundColor).toBe("darkGray");
    expect(out.textColor).toBe("offWhite");
  });

  it("clamps numeric values into their slider ranges", () => {
    const high = sanitizePreferences({
      letterSpacing: 999,
      lineHeight: 999,
      fontSize: 999,
    });
    expect(high.letterSpacing).toBe(4);
    expect(high.lineHeight).toBeCloseTo(2.4);
    expect(high.fontSize).toBe(28);

    const low = sanitizePreferences({
      letterSpacing: -10,
      lineHeight: -10,
      fontSize: -10,
    });
    expect(low.letterSpacing).toBe(0);
    expect(low.lineHeight).toBeCloseTo(1.2);
    expect(low.fontSize).toBe(14);
  });

  it("treats non-finite numbers as the minimum", () => {
    const out = sanitizePreferences({
      letterSpacing: Number.NaN,
      lineHeight: Number.POSITIVE_INFINITY,
      fontSize: Number.NEGATIVE_INFINITY,
    });
    // Non-finite values fall back to the slider minimum.
    expect(out.letterSpacing).toBe(0);
    expect(out.lineHeight).toBeCloseTo(1.2);
    expect(out.fontSize).toBe(14);
  });

  it("merges partial input over the defaults", () => {
    const out = sanitizePreferences({ fontSize: 22 });
    expect(out).toEqual({ ...DEFAULT_PREFERENCES, fontSize: 22 });
  });
});

describe("suggestTextColor", () => {
  it("suggests off-white text on dark backgrounds", () => {
    expect(suggestTextColor("darkGray")).toBe("offWhite");
  });

  it("suggests dark text on light backgrounds", () => {
    expect(suggestTextColor("white")).toBe("darkGray");
    expect(suggestTextColor("cream")).toBe("darkGray");
    expect(suggestTextColor("paleYellow")).toBe("darkGray");
  });

  it("falls back to dark text for unknown background values", () => {
    expect(suggestTextColor("not-a-color")).toBe("darkGray");
  });
});

describe("preferencesToCssVars", () => {
  it("maps preference fields to the expected CSS custom properties", () => {
    const vars = preferencesToCssVars({
      fontFamily: "georgia",
      backgroundColor: "cream",
      textColor: "black",
      letterSpacing: 1.5,
      lineHeight: 1.8,
      fontSize: 20,
    });
    expect(vars).toEqual({
      "--reading-font": "Georgia, serif",
      "--reading-bg": "#FAF6EE",
      "--reading-fg": "#111111",
      "--reading-letter-spacing": "1.5px",
      "--reading-line-height": "1.8",
      "--reading-font-size": "20px",
    });
  });

  it("falls back to the first font and default colors for unknown enum values", () => {
    const vars = preferencesToCssVars({
      fontFamily: "missing-font",
      backgroundColor: "missing-bg",
      textColor: "missing-text",
      letterSpacing: 0,
      lineHeight: 1.6,
      fontSize: 18,
    });
    expect(vars["--reading-font"]).toContain("Atkinson Hyperlegible");
    expect(vars["--reading-bg"]).toBe("#FAF6EE");
    expect(vars["--reading-fg"]).toBe("#333333");
  });
});
