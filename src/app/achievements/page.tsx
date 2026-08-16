import type { Metadata } from "next"
import { Award } from "lucide-react"
import { listAchievements } from "@/lib/server-storage"
import { SITE_BASE_URL } from "@/lib/seo-utils"
import { AchievementClient } from "./AchievementClient"

const achievementsUrl = `${SITE_BASE_URL}/achievements`

// Revalidate every 60 seconds — data stays fresh without hitting DB on every request.
export const revalidate = 60

export const metadata: Metadata = {
  title: "Achievements & Certifications",
  description:
    "Hall of fame: professional certifications, CTF competition placements, and competitive milestones earned by Claritys in cybersecurity.",
  alternates: {
    canonical: achievementsUrl,
  },
  openGraph: {
    title: "Achievements & Certifications | Claritys Portfolio",
    description:
      "Hall of fame: professional certifications, CTF competition placements, and competitive milestones earned by Claritys.",
    url: achievementsUrl,
    type: "website",
  },
}

// Server Component — fetches achievements at request time.
// Splits into certifications (have imageUrl + issuer) and quickStats.
export default async function AchievementsPage() {
  const raw = await listAchievements().catch(() => [])

  // Sort descending by date (same logic as before, but done server-side)
  const sorted = [...raw].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    const timeA = isNaN(dateA) ? 0 : dateA
    const timeB = isNaN(dateB) ? 0 : dateB
    if (timeA === timeB) {
      const cA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const cB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return cB - cA
    }
    return timeB - timeA
  })

  const certifications = sorted.filter((a) => a.imageUrl && a.issuer)
  const quickStats = sorted.filter((a) => !a.imageUrl || a.platform)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-primary">
            <Award className="h-5 w-5" />
            <span className="font-code text-sm font-bold uppercase tracking-widest">Hall of Fame</span>
          </div>
          <h1 className="text-4xl font-headline font-bold">Achievements &amp; Certifications</h1>
          <p className="text-muted-foreground max-w-2xl">
            A visual documentation of my professional journey, validation of skills, and competitive milestones.
          </p>
        </div>
      </div>

      {/* Dialog + Collapsible interactions handled in the client component */}
      <AchievementClient certifications={certifications} quickStats={quickStats} />
    </div>
  )
}
