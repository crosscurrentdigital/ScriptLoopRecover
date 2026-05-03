import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  hidePercentForLoop,
  useWordHiding,
} from "@/hooks/useWordHiding";

describe("hidePercentForLoop", () => {
  it("returns 0 for loop count <= 0", () => {
    expect(hidePercentForLoop(0)).toBe(0);
    expect(hidePercentForLoop(-1)).toBe(0);
  });
  it("steps up across the schedule", () => {
    expect(hidePercentForLoop(1)).toBe(0.1);
    expect(hidePercentForLoop(2)).toBe(0.25);
    expect(hidePercentForLoop(3)).toBe(0.25);
    expect(hidePercentForLoop(4)).toBe(0.5);
    expect(hidePercentForLoop(6)).toBe(0.75);
    expect(hidePercentForLoop(8)).toBe(0.9);
    expect(hidePercentForLoop(99)).toBe(0.9);
  });
});

describe("useWordHiding", () => {
  it("returns no tokens for empty text", () => {
    const { result } = renderHook(() =>
      useWordHiding({ text: "", loopCount: 5 }),
    );
    expect(result.current.tokens).toEqual([]);
    expect(result.current.wordCount).toBe(0);
    expect(result.current.hiddenCount).toBe(0);
  });

  it("hides 0 words on loop 0", () => {
    const { result } = renderHook(() =>
      useWordHiding({ text: "one two three four", loopCount: 0 }),
    );
    expect(result.current.wordCount).toBe(4);
    expect(result.current.hiddenCount).toBe(0);
    expect(result.current.tokens.every((t) => !t.hidden)).toBe(true);
  });

  it("hides last words deterministically with last-words strategy", () => {
    const { result } = renderHook(() =>
      useWordHiding({
        text: "a b c d",
        loopCount: 4,
        hideStrategy: "last-words",
      }),
    );
    const wordTokens = result.current.tokens.filter((t) => t.type === "word");
    expect(wordTokens.length).toBe(4);
    const hiddenWords = wordTokens.filter((t) => t.hidden).map((t) => t.text);
    expect(hiddenWords).toEqual(["c", "d"]);
  });

  it("every-other strategy hides odd-position words first", () => {
    const { result } = renderHook(() =>
      useWordHiding({
        text: "a b c d",
        loopCount: 2,
        hideStrategy: "every-other",
      }),
    );
    const wordTokens = result.current.tokens.filter((t) => t.type === "word");
    const hidden = wordTokens.filter((t) => t.hidden).map((t) => t.text);
    expect(hidden.length).toBe(1);
    expect(hidden[0]).toBe("b");
  });

  it("random strategy is deterministic for same text+percent", () => {
    const r1 = renderHook(() =>
      useWordHiding({ text: "alpha beta gamma delta", loopCount: 4 }),
    );
    const r2 = renderHook(() =>
      useWordHiding({ text: "alpha beta gamma delta", loopCount: 4 }),
    );
    const w1 = r1.result.current.tokens
      .filter((t) => t.hidden)
      .map((t) => t.text);
    const w2 = r2.result.current.tokens
      .filter((t) => t.hidden)
      .map((t) => t.text);
    expect(w1).toEqual(w2);
  });

  it("emits gap tokens between words", () => {
    const { result } = renderHook(() =>
      useWordHiding({ text: "a  b\nc", loopCount: 0 }),
    );
    const types = result.current.tokens.map((t) => t.type);
    expect(types).toEqual(["word", "gap", "word", "gap", "word"]);
  });
});
