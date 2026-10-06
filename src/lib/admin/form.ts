export type ActionState = { ok: boolean; message?: string; fields?: Record<string, string[] | undefined> };

export function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$ACTION") || typeof v !== "string") continue;
    out[k] = v;
  }
  return out;
}

export function pageParam(v: string | string[] | undefined): number {
  const n = Number.parseInt(Array.isArray(v) ? v[0] : (v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
