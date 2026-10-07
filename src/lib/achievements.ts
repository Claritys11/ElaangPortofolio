/** Proof score scale used by the admin: 0–10. 7+ is shown largest, 4–6 large. */
export const PROOF_SCORE_MAX = 10;

// Titles that describe a ranked result rather than participation.
const NOTABLE = /\b(finalist|winner|juara\s+(\d+|umum|harapan)|champion|gold|silver|bronze|medal|rank\s*#?\d+|top\s*\d+|\d+(st|nd|rd|th)\s+place|place)\b/i;

export function achievementWeight(a: { title: string; proofScore: number | null }): number {
  if (typeof a.proofScore === "number") return Math.max(0, Math.min(PROOF_SCORE_MAX, a.proofScore));
  return NOTABLE.test(a.title) ? 5 : 0;
}

export type Emphasis = "xl" | "lg" | "base";

export function emphasisFor(weight: number): Emphasis {
  return weight >= 7 ? "xl" : weight >= 4 ? "lg" : "base";
}

/** Proof score guide shown in the admin (and used by its "Suggest" button). */
export const PROOF_SCORE_GUIDE = [
  { range: "9–10", use: "Juara 1, Gold medal, 1st place (national / international)", shows: "largest" },
  { range: "7–8", use: "Juara 2–3, Silver / Bronze, Top 10", shows: "largest" },
  { range: "5–6", use: "Finalist, Top 20–25, Juara Harapan, strong international rank", shows: "large" },
  { range: "4", use: "Score-based certificate (IELTS…), ranked qualifier", shows: "large" },
  { range: "1–3", use: "Participant, course, webinar", shows: "normal" },
] as const;

const RULES: [RegExp, number, string][] = [
  [/\b(juara\s*(1|i|pertama)\b|1st\s+place|first\s+place|gold|winner|champion)/i, 9, "1st place / gold / winner"],
  [/\b(juara\s*(2|3|ii|iii)\b|2nd|3rd|second\s+place|third\s+place|silver|bronze|runner.?up|top\s*(3|5|10)\b)/i, 7, "2nd–3rd place / silver / bronze / top 10"],
  [/\b(finalist|finalis)\b/i, 6, "finalist"],
  [/\b(juara\s+harapan|top\s*\d+|rank\s*#?\d+)/i, 5, "ranked result (Top N / Rank / Juara Harapan)"],
  [/\b(score|ielts|toefl|toeic|qualifier|qualification)\b/i, 4, "score-based certificate / qualifier"],
];

export function suggestProofScore(title: string): { score: number; reason: string } {
  for (const [re, score, reason] of RULES) if (re.test(title)) return { score, reason };
  return { score: 2, reason: "participation / course" };
}
