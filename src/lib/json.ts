function coerce(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function parseStringArray(value: unknown): string[] {
  const v = coerce(value);
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function parseObjectArray<T>(value: unknown, guard: (x: Record<string, unknown>) => T | null): T[] {
  const v = coerce(value);
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const mapped = guard(item as Record<string, unknown>);
      if (mapped !== null) out.push(mapped);
    }
  }
  return out;
}

export function parseRecord(value: unknown): Record<string, unknown> {
  const v = coerce(value);
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** Some legacy rows store uploads as "api/public/uploads/…" (no leading slash), which breaks under nested routes. */
export function normalizeMediaUrl(v: string | null | undefined): string | null {
  const s = v?.trim();
  if (!s) return null;
  return s.startsWith("api/public/uploads/") ? `/${s}` : s;
}
