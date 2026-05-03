import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy classes", () => {
    expect(cn("a", "b", false, null, undefined, "c")).toBe("a b c");
  });
  it("merges tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("handles arrays and objects", () => {
    expect(cn(["a", { b: true, c: false }], "d")).toBe("a b d");
  });
});
