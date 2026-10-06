/**
 * Timing for the footer's ELANG → CLARITYS foreshadow. Tune these to taste:
 * rarer and shorter reads as a secret; frequent or long reads as decoration.
 */
export const GLITCH_TIMING = {
  firstDelayMs: 700, // after the footer finishes revealing
  minDelayMs: 7000, // random gap between glitches while the footer is in view
  maxDelayMs: 12000,
  secretHoldS: 0.45, // how long CLARITYS stays fully visible (long enough to read)
};

export function fitScaleX(primaryWidth: number, secretWidth: number): number {
  if (primaryWidth <= 0 || secretWidth <= 0) return 1;
  return Math.min(1, primaryWidth / secretWidth);
}

export function nextGlitchDelay(min: number, max: number, rand: () => number = Math.random): number {
  return Math.round(min + (max - min) * rand());
}

export function sliceInset(rand: () => number = Math.random): string {
  const top = Math.floor(rand() * 70);
  const band = 10 + Math.floor(rand() * 20);
  const bottom = Math.max(0, 100 - top - band);
  return `inset(${top}% 0 ${bottom}% 0)`;
}
