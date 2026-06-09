import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    const isHidden = false;
    expect(cn("base", isHidden && "hidden", "visible")).toBe("base visible");
  });

  it("should resolve tailwind conflicts", () => {
    const result = cn("px-4 py-2", "px-6");
    expect(result).toContain("px-6");
    expect(result).not.toContain("px-4");
    expect(result).toContain("py-2");
  });

  it("should return empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("should handle undefined and null values", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra");
  });
});