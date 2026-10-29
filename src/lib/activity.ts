/** Contribution-calendar math shared by the GitHub and CTF activity views. Pure, so it is unit-tested. */

export type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
export type Calendar = {
  weeks: Day[][];
  months: { label: string; week: number }[];
  total: number;
  best: { date: string; count: number } | null;
  activeDays: number;
  longestStreak: number;
};

const WEEKS = 53;
const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** GitHub's public contributions fragment: cells carry the date, their tooltips carry the count. */
export function parseGithubContributions(html: string): Map<string, number> {
  const dateById = new Map<string, string>();
  for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"\s+id="([^"]+)"/g)) dateById.set(m[2], m[1]);
  const out = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const date = dateById.get(m[1]);
    if (!date) continue;
    const n = /^(\d+)\s+contribution/.exec(m[2].trim());
    out.set(date, n ? Number(n[1]) : 0);
  }
  return out;
}

export function githubUser(url: string | null): string | null {
  const m = url && /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/?$/.exec(url.trim());
  return m ? m[1] : null;
}

export function countByDay(dates: (string | null)[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const d of dates) if (d) out.set(d.slice(0, 10), (out.get(d.slice(0, 10)) ?? 0) + 1);
  return out;
}

/** The last 53 Sunday-first weeks up to today, with levels scaled 1–4 against the busiest day. */
export function buildCalendar(counts: Map<string, number>, today: Date): Calendar {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end.getTime() - (end.getUTCDay() + (WEEKS - 1) * 7) * DAY_MS);
  const days: { date: string; count: number }[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const date = iso(new Date(t));
    days.push({ date, count: counts.get(date) ?? 0 });
  }
  const max = Math.max(0, ...days.map((d) => d.count));
  const level = (c: number): Day["level"] => (c === 0 ? 0 : (Math.min(4, Math.max(1, Math.ceil((c / max) * 4))) as Day["level"]));

  const weeks: Day[][] = [];
  const months: Calendar["months"] = [];
  days.forEach((d, i) => {
    const w = Math.floor(i / 7);
    (weeks[w] ??= []).push({ ...d, level: level(d.count) });
    if (d.date.endsWith("-01")) months.push({ label: MONTHS[Number(d.date.slice(5, 7)) - 1], week: w });
  });

  let best: Calendar["best"] = null;
  let run = 0;
  let longestStreak = 0;
  for (const d of days) {
    if (d.count > 0 && (!best || d.count > best.count)) best = { date: d.date, count: d.count };
    run = d.count > 0 ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }
  return {
    weeks,
    months,
    total: days.reduce((n, d) => n + d.count, 0),
    best,
    activeDays: days.filter((d) => d.count > 0).length,
    longestStreak,
  };
}
