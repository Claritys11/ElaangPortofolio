import type { AchievementItem } from "@/lib/types";

// Repeating span pattern from the bento gallery design (4-col md grid, 60px rows).
const SPANS = [
  "md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2",
  "md:col-span-2 md:row-span-2 sm:col-span-2 sm:row-span-2",
  "md:col-span-1 md:row-span-3 sm:col-span-2 sm:row-span-2",
  "md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2",
  "md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2",
  "md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2",
  "md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2",
];

export const bentoSpan = (i: number) => `row-span-3 ${SPANS[i % SPANS.length]}`;

const monthYear = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso)) : "";

export function toMediaItems(items: AchievementItem[]) {
  return items
    .filter((a) => a.imageUrl)
    .map((a, i) => ({
      id: a.id,
      type: "image" as const,
      title: a.title,
      desc: [a.issuer ?? a.platform, monthYear(a.date)].filter(Boolean).join(" · "),
      url: a.imageUrl!,
      span: bentoSpan(i),
    }));
}
