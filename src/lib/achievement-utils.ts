import type { AchievementRecord } from "@/lib/portfolio-types"

export type AchievementCategory = "certification" | "competition" | "milestone"
export type AchievementCategoryFilter = "all" | AchievementCategory
export type AchievementSortMode = "best" | "newest" | "oldest"

export const achievementCategoryLabels: Record<AchievementCategory, string> = {
  certification: "Certification",
  competition: "Competition",
  milestone: "Milestone",
}

export function getAchievementDateTime(value?: string): number {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

export function formatAchievementDate(value?: string): string {
  const time = getAchievementDateTime(value)
  if (!time) return "Undated"

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(time))
}

export function getAchievementCategory(item: AchievementRecord): AchievementCategory {
  const signal = [item.title, item.issuer, item.platform, item.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (item.imageUrl && item.issuer) return "certification"
  if (item.platform || /\b(ctf|competition|rank|place|winner|final|qual|tournament)\b/.test(signal)) {
    return "competition"
  }

  return "milestone"
}

export function getAchievementSource(item: AchievementRecord): string {
  return item.issuer?.trim() || item.platform?.trim() || "Independent"
}

export function getAchievementProofScore(item: AchievementRecord): number {
  if (typeof item.proofScore === "number" && Number.isFinite(item.proofScore)) {
    return item.proofScore
  }

  const category = getAchievementCategory(item)
  const categoryScore = category === "certification" ? 40 : category === "competition" ? 34 : 24

  return (
    categoryScore +
    (item.imageUrl ? 24 : 0) +
    (item.attachments?.length ? 18 : 0) +
    (item.issuer ? 10 : 0) +
    (item.platform ? 8 : 0) +
    (item.description ? 4 : 0)
  )
}

export function sortAchievements(items: AchievementRecord[], sortMode: AchievementSortMode): AchievementRecord[] {
  return [...items].sort((a, b) => {
    if (sortMode === "best") {
      const scoreDiff = getAchievementProofScore(b) - getAchievementProofScore(a)
      if (scoreDiff !== 0) return scoreDiff
    }

    const dateA = getAchievementDateTime(a.date) || getAchievementDateTime(a.createdAt)
    const dateB = getAchievementDateTime(b.date) || getAchievementDateTime(b.createdAt)
    return sortMode === "oldest" ? dateA - dateB : dateB - dateA
  })
}
