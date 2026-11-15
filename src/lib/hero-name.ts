const normalizeName = (value: string) => value.trim().split(/\s+/).filter(Boolean).join(" ").toLocaleLowerCase("en");

export function isHeroNameLineGroupingValid(name: string, lines: readonly string[] | null | undefined): boolean {
  const cleaned = lines?.map((line) => line.trim()).filter(Boolean) ?? [];
  return cleaned.length > 0 && cleaned.every((line) => line.length <= 80) && normalizeName(cleaned.join(" ")) === normalizeName(name);
}

/** Keep saved manual groups when they cover the full name; otherwise use first-name + remainder. */
export function resolveHeroNameLines(name: string, lines?: readonly string[] | null): string[] {
  const cleaned = lines?.map((line) => line.trim()).filter(Boolean) ?? [];
  if (isHeroNameLineGroupingValid(name, cleaned)) return cleaned;

  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length > 1 ? [words[0], words.slice(1).join(" ")] : words;
}
