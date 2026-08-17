"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLink, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GithubContributionCalendarProps {
  githubUrl?: string
  displayName?: string
  className?: string
}

interface ContributionDay {
  date: string
  label: string
  count: number
  level: number
}

interface GithubContributionResponse {
  username: string
  totalContributions: number
  days: ContributionDay[]
  sourceUrl: string
}

const WEEK_COUNT = 53
const DAY_COUNT = WEEK_COUNT * 7
const levelClasses = [
  "bg-muted/80 border-border/70",
  "bg-primary/20 border-primary/20",
  "bg-primary/40 border-primary/30",
  "bg-primary/65 border-primary/40",
  "bg-primary border-primary/50 shadow-[0_0_10px_hsl(var(--primary)/0.25)]",
]

function extractGithubUsername(value: string | undefined): string {
  if (!value?.trim()) {
    return "github"
  }

  try {
    const parsed = new URL(value)
    const [username] = parsed.pathname.split("/").filter(Boolean)
    return username || "github"
  } catch {
    return value.replace(/^@/, "").split("/").filter(Boolean).pop() || "github"
  }
}

function hashContributionSeed(input: string): number {
  return input.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
}

function getContributionLevel(seed: number, index: number): number {
  const wave = Math.sin((index + seed % 97) / 5) + Math.cos((index + seed % 41) / 13)
  const raw = Math.abs(Math.sin(seed * (index + 3)) * 10000 + wave * 12)

  if (raw % 11 < 4) return 0
  if (raw % 11 < 6.4) return 1
  if (raw % 11 < 8.4) return 2
  if (raw % 11 < 10) return 3
  return 4
}

function buildCalendarDays(username: string): ContributionDay[] {
  const seed = hashContributionSeed(username)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: DAY_COUNT }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (DAY_COUNT - 1 - index))

    const level = getContributionLevel(seed, index)
    const count = level === 0 ? 0 : level * 2 + ((seed + index * 7) % 5)
    const dateLabel = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    return {
      date: date.toISOString(),
      label: `${count} contributions on ${dateLabel}`,
      count,
      level,
    }
  })
}

export function GithubContributionCalendar({
  githubUrl,
  displayName = "GitHub",
  className,
}: GithubContributionCalendarProps) {
  const username = extractGithubUsername(githubUrl)
  const profileUrl = githubUrl?.trim() || `https://github.com/${username}`
  const [days, setDays] = React.useState<ContributionDay[]>([])
  const [totalContributions, setTotalContributions] = React.useState(0)
  const [isSynced, setIsSynced] = React.useState(false)
  const [syncError, setSyncError] = React.useState(false)

  React.useEffect(() => {
    let isActive = true

    async function loadContributions() {
      setIsSynced(false)
      setSyncError(false)

      try {
        const response = await fetch(`/api/public/github-contributions/${encodeURIComponent(username)}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("GitHub contribution sync failed")
        }

        const payload = (await response.json()) as GithubContributionResponse
        if (!isActive) {
          return
        }

        setDays(payload.days)
        setTotalContributions(payload.totalContributions)
        setIsSynced(true)
      } catch {
        if (!isActive) {
          return
        }

        const fallbackDays = buildCalendarDays(username)
        setDays(fallbackDays)
        setTotalContributions(fallbackDays.reduce((total, day) => total + day.count, 0))
        setSyncError(true)
      }
    }

    void loadContributions()

    return () => {
      isActive = false
    }
  }, [username])

  return (
    <section
      id="github-activity"
      className={cn("relative overflow-hidden bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24", className)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-12 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 font-code text-xs uppercase tracking-widest text-primary">
              <Github className="h-4 w-4" />
              GitHub contribution calendar
            </p>
            <div className="space-y-2">
              <h2 className="font-headline text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                Code activity for @{username}
              </h2>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                A GitHub-style activity map for recent coding momentum, experiments, write-ups, and portfolio maintenance.
              </p>
            </div>
          </div>

          <Button variant="outline" className="w-full border-primary/30 bg-background/60 text-primary hover:bg-primary/10 md:w-auto" asChild>
            <Link href={profileUrl} target="_blank" rel="noopener noreferrer">
              Open GitHub <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card/65 p-4 shadow-[0_0_32px_hsl(var(--primary)/0.08)] backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-code text-xs uppercase tracking-widest text-muted-foreground">Recent contribution map</p>
              <p className="mt-1 font-headline text-2xl font-bold text-foreground">{totalContributions.toLocaleString()} contributions</p>
              <p className="mt-1 font-code text-[10px] uppercase tracking-widest text-muted-foreground">
                {isSynced ? "Synced from GitHub profile" : syncError ? "Using fallback map while GitHub is unavailable" : "Syncing GitHub profile..."}
              </p>
            </div>
            <div className="flex items-center gap-2 font-code text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Less</span>
              {levelClasses.map((levelClass, index) => (
                <span key={levelClass} className={cn("h-3 w-3 rounded-[3px] border", levelClass)} aria-label={`Level ${index}`} />
              ))}
              <span>More</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[760px] grid-flow-col grid-rows-7 gap-1" aria-label={`${displayName} GitHub contribution calendar`}>
              {days.map((day) => (
                <span
                  key={day.date}
                  title={day.label}
                  aria-label={day.label}
                  className={cn(
                    "h-3.5 w-3.5 rounded-[3px] border transition-transform hover:scale-125",
                    levelClasses[day.level]
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
