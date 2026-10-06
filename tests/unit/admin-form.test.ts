import { describe, expect, it } from "vitest";
import { formToObject, pageParam } from "@/lib/admin/form";

describe("admin form helpers", () => {
  it("formToObject keeps last string value and drops action keys and files", () => {
    const fd = new FormData();
    fd.append("title", "A");
    fd.append("$ACTION_ID_abc", "");
    fd.append("file", new File(["x"], "x.txt"));
    expect(formToObject(fd)).toEqual({ title: "A" });
  });
  it("pageParam sanitizes", () => {
    expect(pageParam("3")).toBe(3);
    expect(pageParam(["2", "9"])).toBe(2);
    expect(pageParam("-1")).toBe(1);
    expect(pageParam("abc")).toBe(1);
    expect(pageParam(undefined)).toBe(1);
  });
});
