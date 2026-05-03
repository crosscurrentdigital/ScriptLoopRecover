import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLoopedAudio } from "@/hooks/useLoopedAudio";

class FakeAudio {
  src = "";
  paused = true;
  currentTime = 0;
  preload = "";
  private listeners = new Map<string, Set<EventListener>>();
  play = vi.fn(() => {
    this.paused = false;
    this.dispatch("play");
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.dispatch("pause");
  });
  load = vi.fn();
  addEventListener(type: string, fn: EventListener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
  }
  removeEventListener(type: string, fn: EventListener) {
    this.listeners.get(type)?.delete(fn);
  }
  dispatch(type: string) {
    for (const fn of this.listeners.get(type) ?? []) fn(new Event(type));
  }
}

let lastFake: FakeAudio | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  lastFake = null;
  // @ts-expect-error stub
  globalThis.Audio = vi.fn(() => {
    const a = new FakeAudio();
    lastFake = a;
    return a;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useLoopedAudio", () => {
  it("play sets isPlaying", async () => {
    const { result } = renderHook(() =>
      useLoopedAudio({ src: "https://x/a.mp3" }),
    );
    await act(async () => {
      result.current.play();
    });
    expect(result.current.isPlaying).toBe(true);
    expect(lastFake?.play).toHaveBeenCalled();
  });

  it("pause stops and clears playing state", async () => {
    const { result } = renderHook(() =>
      useLoopedAudio({ src: "https://x/a.mp3" }),
    );
    await act(async () => result.current.play());
    act(() => result.current.pause());
    expect(result.current.isPlaying).toBe(false);
    expect(lastFake?.pause).toHaveBeenCalled();
  });

  it("toggle flips playing state", async () => {
    const { result } = renderHook(() =>
      useLoopedAudio({ src: "https://x/a.mp3" }),
    );
    await act(async () => result.current.toggle());
    expect(result.current.isPlaying).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isPlaying).toBe(false);
  });

  it("stop resets loopCount and pauses", async () => {
    const { result } = renderHook(() =>
      useLoopedAudio({ src: "https://x/a.mp3" }),
    );
    await act(async () => result.current.play());
    act(() => result.current.stop());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.loopCount).toBe(0);
  });

  it("on ended, schedules a replay after gapSeconds and increments loop", async () => {
    const onLoopComplete = vi.fn();
    const { result } = renderHook(() =>
      useLoopedAudio({
        src: "https://x/a.mp3",
        initialGapSeconds: 1,
        onLoopComplete,
      }),
    );
    await act(async () => result.current.play());
    expect(lastFake!.play).toHaveBeenCalledTimes(1);
    await act(async () => {
      lastFake!.dispatch("ended");
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // Allow the play().then microtask to settle.
    await act(async () => {
      await Promise.resolve();
    });
    expect(lastFake!.play).toHaveBeenCalledTimes(2);
    expect(result.current.loopCount).toBe(1);
    expect(onLoopComplete).toHaveBeenCalledWith(1);
  });

  it("setGapSeconds updates returned gapSeconds", () => {
    const { result } = renderHook(() =>
      useLoopedAudio({ src: "https://x/a.mp3", initialGapSeconds: 2 }),
    );
    act(() => result.current.setGapSeconds(7));
    expect(result.current.gapSeconds).toBe(7);
  });

  it("controlled gapSeconds prop overrides internal state", () => {
    const { result, rerender } = renderHook(
      ({ g }: { g: number }) =>
        useLoopedAudio({ src: "https://x/a.mp3", gapSeconds: g }),
      { initialProps: { g: 3 } },
    );
    expect(result.current.gapSeconds).toBe(3);
    rerender({ g: 8 });
    expect(result.current.gapSeconds).toBe(8);
  });

  it("clears isPlaying when play() rejects (e.g. autoplay policy)", async () => {
    // @ts-expect-error stub
    globalThis.Audio = vi.fn(() => {
      const a = new FakeAudio();
      a.play = vi.fn(() => Promise.reject(new Error("NotAllowedError")));
      lastFake = a;
      return a;
    });
    const { result } = renderHook(() =>
      useLoopedAudio({ src: "https://x/a.mp3" }),
    );
    await act(async () => {
      result.current.play();
      await Promise.resolve();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it("aborts the loop when the replay attempt rejects mid-cycle", async () => {
    const onLoopComplete = vi.fn();
    const replayError = new Error("decode failure");
    let firstPlayCall = true;
    // @ts-expect-error stub
    globalThis.Audio = vi.fn(() => {
      const a = new FakeAudio();
      a.play = vi.fn(() => {
        if (firstPlayCall) {
          firstPlayCall = false;
          a.paused = false;
          a.dispatch("play");
          return Promise.resolve();
        }
        return Promise.reject(replayError);
      });
      lastFake = a;
      return a;
    });

    const { result } = renderHook(() =>
      useLoopedAudio({
        src: "https://x/a.mp3",
        initialGapSeconds: 1,
        onLoopComplete,
      }),
    );
    await act(async () => result.current.play());
    await act(async () => {
      lastFake!.dispatch("ended");
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.loopCount).toBe(0);
    expect(onLoopComplete).not.toHaveBeenCalled();
  });

  it("ignores `pause` events fired while a gap timer is pending", async () => {
    const { result } = renderHook(() =>
      useLoopedAudio({
        src: "https://x/a.mp3",
        initialGapSeconds: 5,
      }),
    );
    await act(async () => result.current.play());
    await act(async () => {
      lastFake!.dispatch("ended");
    });
    await act(async () => {
      lastFake!.dispatch("pause");
    });
    expect(result.current.isPlaying).toBe(true);
  });

  it("changing audioUrl resets loop state", async () => {
    const { result, rerender } = renderHook(
      ({ url }: { url: string }) => useLoopedAudio({ src: url }),
      { initialProps: { url: "https://x/a.mp3" } },
    );
    await act(async () => result.current.play());
    rerender({ url: "https://x/b.mp3" });
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.loopCount).toBe(0);
  });
});
