import { describe, expect, it } from "vitest";
import { buildCalendar, countByDay, githubUser, parseGithubContributions } from "@/lib/activity";

describe("parseGithubContributions", () => {
  it("reads day counts from the cells' tooltips", () => {
    const html = `
      <td data-date="2026-03-14" id="contribution-day-component-6-20" data-level="0"></td>
      <td data-date="2026-03-15" id="contribution-day-component-0-21" data-level="2"></td>
      <td data-date="2026-03-16" id="contribution-day-component-1-21" data-level="1"></td>
      <tool-tip for="contribution-day-component-6-20" class="sr-only">No contributions on March 14th.</tool-tip>
      <tool-tip for="contribution-day-component-0-21" class="sr-only">3 contributions on March 15th.</tool-tip>
      <tool-tip for="contribution-day-component-1-21" class="sr-only">1 contribution on March 16th.</tool-tip>`;
    expect(Object.fromEntries(parseGithubContributions(html))).toEqual({ "2026-03-14": 0, "2026-03-15": 3, "2026-03-16": 1 });
  });
  it("returns an empty map for a page without cells", () => {
    expect(parseGithubContributions("<html></html>").size).toBe(0);
  });
});

describe("githubUser", () => {
  it("takes the login from a profile URL", () => {
    expect(githubUser("https://github.com/Claritys11")).toBe("Claritys11");
    expect(githubUser("https://github.com/Claritys11/")).toBe("Claritys11");
    expect(githubUser("https://example.com/x")).toBeNull();
    expect(githubUser(null)).toBeNull();
  });
});

describe("countByDay", () => {
  it("counts ISO timestamps per calendar day and skips missing dates", () => {
    const m = countByDay(["2026-08-22T00:00:00.000Z", "2026-08-22T10:00:00.000Z", null, "2026-08-23T00:00:00.000Z"]);
    expect(Object.fromEntries(m)).toEqual({ "2026-08-22": 2, "2026-08-23": 1 });
  });
});

describe("buildCalendar", () => {
  const today = new Date("2026-10-29T12:00:00Z"); // a Thursday
  const counts = new Map([
    ["2026-10-27", 2],
    ["2026-10-28", 5],
    ["2026-10-29", 1],
    ["2026-10-20", 1],
    ["2025-01-01", 9], // outside the window
  ]);
  const cal = buildCalendar(counts, today);

  it("lays out Sunday-first weeks ending with the current week", () => {
    expect(cal.weeks.length).toBe(53);
    const last = cal.weeks.at(-1)!;
    expect(last[0].date).toBe("2026-10-25");
    expect(last.at(-1)!.date).toBe("2026-10-29");
    expect(cal.weeks[0]).toHaveLength(7);
  });
  it("totals only the window and finds the best day, active days and longest streak", () => {
    expect(cal.total).toBe(9);
    expect(cal.best).toEqual({ date: "2026-10-28", count: 5 });
    expect(cal.activeDays).toBe(4);
    expect(cal.longestStreak).toBe(3);
  });
  it("scales levels 1–4 against the busiest day", () => {
    const day = (d: string) => cal.weeks.flat().find((x) => x.date === d)!;
    expect(day("2026-10-28").level).toBe(4);
    expect(day("2026-10-29").level).toBe(1);
    expect(day("2026-10-26").level).toBe(0);
  });
  it("labels the first week of each month", () => {
    expect(cal.months.at(-1)).toEqual({ label: "Oct", week: 48 });
  });
});
