export function heatmapStaggerDelay(index: number, total: number, amountMs = 1100): number {
  if (total <= 1) return 0;
  const position = Math.min(total - 1, Math.max(0, index));
  return Math.round((position / (total - 1)) * amountMs);
}

export function easeOutExpo(progress: number): number {
  const value = Math.min(1, Math.max(0, progress));
  return value === 1 ? 1 : 1 - 2 ** (-10 * value);
}

export function easeBackOut(progress: number, overshoot = 2): number {
  const value = Math.min(1, Math.max(0, progress));
  const shifted = value - 1;
  return 1 + (overshoot + 1) * shifted ** 3 + overshoot * shifted ** 2;
}
