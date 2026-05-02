import { useMemo } from "react";

export type HideStrategy = "random" | "last-words" | "every-other";

export interface Token {
  type: "word" | "gap";
  text: string;
  hidden: boolean;
  length: number;
}

const HIDE_SCHEDULE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [1, 0.1],
  [2, 0.25],
  [4, 0.5],
  [6, 0.75],
  [8, 0.9],
];

export function hidePercentForLoop(loopCount: number): number {
  if (loopCount <= 0) return 0;
  let pct = 0;
  for (const [loop, p] of HIDE_SCHEDULE) {
    if (loopCount >= loop) pct = p;
    else break;
  }
  return pct;
}

function tokenize(text: string): Token[] {
  if (!text) return [];
  const tokens: Token[] = [];
  const regex = /(\s+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const word = text.slice(lastIndex, match.index);
      tokens.push({
        type: "word",
        text: word,
        hidden: false,
        length: word.length,
      });
    }
    tokens.push({
      type: "gap",
      text: match[0],
      hidden: false,
      length: match[0].length,
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    const word = text.slice(lastIndex);
    tokens.push({
      type: "word",
      text: word,
      hidden: false,
      length: word.length,
    });
  }
  return tokens;
}

function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickHiddenIndices(
  wordIndices: number[],
  hideCount: number,
  strategy: HideStrategy,
  seed: number,
): Set<number> {
  const hidden = new Set<number>();
  if (hideCount <= 0 || wordIndices.length === 0) return hidden;
  const clamped = Math.min(hideCount, wordIndices.length);

  if (strategy === "last-words") {
    for (let i = wordIndices.length - clamped; i < wordIndices.length; i += 1) {
      hidden.add(wordIndices[i]!);
    }
    return hidden;
  }

  if (strategy === "every-other") {
    const evens: number[] = [];
    const odds: number[] = [];
    wordIndices.forEach((tokenIdx, wordPos) => {
      if (wordPos % 2 === 1) odds.push(tokenIdx);
      else evens.push(tokenIdx);
    });
    const ordered = [...odds, ...evens];
    for (let i = 0; i < clamped; i += 1) hidden.add(ordered[i]!);
    return hidden;
  }

  const rand = mulberry32(seed);
  const pool = [...wordIndices];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  for (let i = 0; i < clamped; i += 1) hidden.add(pool[i]!);
  return hidden;
}

export interface UseWordHidingOptions {
  text: string;
  loopCount: number;
  hideStrategy?: HideStrategy;
}

export interface UseWordHidingResult {
  tokens: Token[];
  hidePercent: number;
  hiddenCount: number;
  wordCount: number;
}

export function useWordHiding({
  text,
  loopCount,
  hideStrategy = "random",
}: UseWordHidingOptions): UseWordHidingResult {
  const baseTokens = useMemo(() => tokenize(text), [text]);

  const wordIndices = useMemo(() => {
    const out: number[] = [];
    baseTokens.forEach((t, i) => {
      if (t.type === "word") out.push(i);
    });
    return out;
  }, [baseTokens]);

  const hidePercent = useMemo(() => hidePercentForLoop(loopCount), [loopCount]);

  const seed = useMemo(
    () => hashString(`${text}::${Math.round(hidePercent * 1000)}`),
    [text, hidePercent],
  );

  return useMemo(() => {
    const wordCount = wordIndices.length;
    const hideCount = Math.round(wordCount * hidePercent);
    const hiddenSet = pickHiddenIndices(
      wordIndices,
      hideCount,
      hideStrategy,
      seed,
    );
    const tokens = baseTokens.map((t, i) =>
      t.type === "word" && hiddenSet.has(i) ? { ...t, hidden: true } : t,
    );
    return {
      tokens,
      hidePercent,
      hiddenCount: hiddenSet.size,
      wordCount,
    };
  }, [baseTokens, wordIndices, hidePercent, hideStrategy, seed]);
}
