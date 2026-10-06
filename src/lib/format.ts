export function formatDate(iso: string | null, style: "short" | "year" = "short") {
  if (!iso) return "Undated";
  const d = new Date(iso);
  return style === "year"
    ? String(d.getUTCFullYear())
    : new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}
