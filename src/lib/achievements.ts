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
