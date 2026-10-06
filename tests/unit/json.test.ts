import { describe, expect, it } from "vitest";
import { parseObjectArray, parseRecord, parseStringArray } from "@/lib/json";

describe("parseStringArray", () => {
  it("keeps trimmed non-empty strings", () => {
    expect(parseStringArray(["PWN", " heap ", "", 3, null])).toEqual(["PWN", "heap"]);
  });
  it("accepts a JSON string", () => {
    expect(parseStringArray('["a","b"]')).toEqual(["a", "b"]);
  });
  it("returns [] for objects, garbage strings, null", () => {
    expect(parseStringArray({})).toEqual([]);
    expect(parseStringArray("not json")).toEqual([]);
    expect(parseStringArray(null)).toEqual([]);
  });
});

describe("parseObjectArray", () => {
  const guard = (x: Record<string, unknown>) =>
    typeof x.name === "string" ? { name: x.name, level: typeof x.level === "number" ? x.level : 0 } : null;
  it("maps valid entries and drops invalid ones", () => {
    expect(parseObjectArray([{ name: "Pwn", level: 70 }, { level: 3 }, "x", { name: "Rev" }], guard)).toEqual([
      { name: "Pwn", level: 70 },
      { name: "Rev", level: 0 },
    ]);
  });
  it("returns [] for non-arrays", () => {
    expect(parseObjectArray({ name: "x" }, guard)).toEqual([]);
  });
});

describe("parseRecord", () => {
  it("returns objects, rejects arrays and primitives", () => {
    expect(parseRecord({ a: 1 })).toEqual({ a: 1 });
    expect(parseRecord([1])).toEqual({});
    expect(parseRecord("x")).toEqual({});
  });
});
