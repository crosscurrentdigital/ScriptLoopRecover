import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDraft } from "@/hooks/useDraft";

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useDraft", () => {
  it("returns initial value when nothing is stored", () => {
    const { result } = renderHook(() => useDraft("k1", { a: 1 }));
    expect(result.current.draft).toEqual({ a: 1 });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.hasSavedDraft()).toBe(false);
  });

  it("rehydrates from localStorage when present", () => {
    window.localStorage.setItem(
      "scriptloop:draft:k2",
      JSON.stringify({ a: 5 }),
    );
    const { result } = renderHook(() => useDraft("k2", { a: 1 }));
    expect(result.current.draft).toEqual({ a: 5 });
    expect(result.current.hasSavedDraft()).toBe(true);
  });

  it("persists to localStorage after debounce", () => {
    const { result } = renderHook(() =>
      useDraft({ key: "k3", initial: { a: 1 }, debounceMs: 100 }),
    );
    act(() => result.current.setDraft({ a: 2 }));
    expect(result.current.isDirty).toBe(true);
    expect(window.localStorage.getItem("scriptloop:draft:k3")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(101);
    });
    expect(window.localStorage.getItem("scriptloop:draft:k3")).toBe(
      JSON.stringify({ a: 2 }),
    );
    expect(result.current.isDirty).toBe(false);
  });

  it("supports functional updates", () => {
    const { result } = renderHook(() =>
      useDraft({ key: "k4", initial: { n: 0 }, debounceMs: 10 }),
    );
    act(() => result.current.setDraft((p) => ({ n: p.n + 1 })));
    act(() => result.current.setDraft((p) => ({ n: p.n + 1 })));
    expect(result.current.draft).toEqual({ n: 2 });
  });

  it("clearDraft wipes storage and resets to initial", () => {
    window.localStorage.setItem(
      "scriptloop:draft:k5",
      JSON.stringify({ a: 9 }),
    );
    const { result } = renderHook(() => useDraft("k5", { a: 0 }));
    expect(result.current.draft).toEqual({ a: 9 });
    act(() => result.current.clearDraft());
    expect(result.current.draft).toEqual({ a: 0 });
    expect(window.localStorage.getItem("scriptloop:draft:k5")).toBeNull();
    expect(result.current.hasSavedDraft()).toBe(false);
  });

  it("falls back to initial when stored JSON is invalid", () => {
    window.localStorage.setItem("scriptloop:draft:k6", "{not json");
    const { result } = renderHook(() => useDraft("k6", { a: 1 }));
    expect(result.current.draft).toEqual({ a: 1 });
  });

  it("does not write when serialized value matches last persisted", () => {
    window.localStorage.setItem(
      "scriptloop:draft:k7",
      JSON.stringify({ a: 1 }),
    );
    const { result } = renderHook(() =>
      useDraft({ key: "k7", initial: { a: 1 }, debounceMs: 10 }),
    );
    const setSpy = vi.spyOn(Storage.prototype, "setItem");
    act(() => result.current.setDraft({ a: 1 }));
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(setSpy).not.toHaveBeenCalled();
    setSpy.mockRestore();
  });

  it("does not react to cross-tab `storage` events (per-tab snapshot)", () => {
    const { result } = renderHook(() =>
      useDraft({ key: "k-storage", initial: { a: 1 }, debounceMs: 10 }),
    );
    expect(result.current.draft).toEqual({ a: 1 });

    act(() => {
      window.localStorage.setItem(
        "scriptloop:draft:k-storage",
        JSON.stringify({ a: 99 }),
      );
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "scriptloop:draft:k-storage",
          newValue: JSON.stringify({ a: 99 }),
          storageArea: window.localStorage,
        }),
      );
    });

    expect(result.current.draft).toEqual({ a: 1 });
    expect(result.current.hasSavedDraft()).toBe(true);
  });

  it("survives setItem throwing (quota exceeded) without breaking subsequent updates", () => {
    const { result } = renderHook(() =>
      useDraft({ key: "k-quota", initial: { a: 0 }, debounceMs: 10 }),
    );
    const setSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new DOMException("quota", "QuotaExceededError");
      });
    act(() => result.current.setDraft({ a: 1 }));
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(result.current.draft).toEqual({ a: 1 });

    setSpy.mockRestore();
    act(() => result.current.setDraft({ a: 2 }));
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(window.localStorage.getItem("scriptloop:draft:k-quota")).toBe(
      JSON.stringify({ a: 2 }),
    );
  });

  it("tuple form is iterable as [draft, setDraft, clearDraft]", () => {
    const { result } = renderHook(() => useDraft("k8", { a: 1 }));
    const [draft, setDraft, clearDraft] = result.current;
    expect(draft).toEqual({ a: 1 });
    expect(typeof setDraft).toBe("function");
    expect(typeof clearDraft).toBe("function");
  });
});
