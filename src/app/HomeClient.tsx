"use client"

import * as React from "react"
import { Activity, CheckCircle2, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Hero } from "@/components/ui/animated-hero"
import { cn } from "@/lib/utils"
import { BRAND_ALIAS, BRAND_NAME } from "@/lib/seo-utils"
import type { HomeSummaryResponse, ProfileSettingsRecord } from "@/lib/portfolio-types"

interface HomeClientProps {
  profileSettings: ProfileSettingsRecord
  summary: HomeSummaryResponse | null
}

export function HomeClient({ profileSettings, summary }: HomeClientProps) {
  const [terminalLoaded, setTerminalLoaded] = React.useState(false)

  const writeupCount = summary?.writeupCount ?? 0
  const projectCount = summary?.projectCount ?? 0
  const achievementCount = summary?.achievementCount ?? 0
  const latestActivity = summary?.latestActivity ?? null
  const displayName = profileSettings.displayName && profileSettings.displayName !== "My Name" ? profileSettings.displayName : BRAND_NAME
  const alias = profileSettings.alias && profileSettings.alias !== "Claritys" ? profileSettings.alias : BRAND_ALIAS
  const aboutText =
    profileSettings.aboutText?.trim() ||
    "Cybersecurity enthusiast, CTF player, and web developer documenting the things I learn, break, build, and sharpen."

  React.useEffect(() => {
    const timer = setTimeout(() => setTerminalLoaded(true), 1800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative overflow-hidden bg-background">
      <Hero
        displayName={displayName}
        alias={alias}
        aboutText={aboutText}
        writeupCount={writeupCount}
        projectCount={projectCount}
        achievementCount={achievementCount}
        latestActivityTitle={latestActivity?.title}
        animatedTitles={profileSettings.seo?.heroAnimatedTitles}
      />

      <section id="terminal-session" className="relative bg-grid-pattern px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-12 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div className="space-y-4">
            <p className="font-code text-xs uppercase tracking-widest text-primary">Live terminal</p>
            <h2 className="font-headline text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
              Portfolio signal, live from the terminal.
            </h2>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              A quick snapshot of identity, focus areas, and latest activity. The terminal keeps the cybersecurity tone while the hero stays clean and easy to explore.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 opacity-50 blur-xl transition duration-1000 group-hover:opacity-100" />
            <div className="relative overflow-hidden rounded-lg border border-border">
              <GlowingEffect disabled={false} proximity={80} spread={60} glow={true} />
              <Card className="relative overflow-hidden rounded-lg border-none bg-card/80 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
                  <div className="flex space-x-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/50 md:h-3 md:w-3" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50 md:h-3 md:w-3" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/50 md:h-3 md:w-3" />
                  </div>
                  <div className="flex items-center font-code text-[9px] text-muted-foreground md:text-[10px]">
                    <Lock className="mr-1 h-3 w-3" /> session --secure-mode
                  </div>
                </div>

                <CardContent className="space-y-4 p-4 md:p-6">
                  <div className="space-y-2 font-code text-xs md:text-sm">
                    <p className="text-primary">$ whoami</p>
                    <p className="text-foreground">{alias ? `${displayName} | ${alias}` : displayName}</p>
                    <p className="pt-2 text-primary">$ cat skill-matrix.json</p>
                    <div className="space-y-1 pl-4 font-bold text-primary brightness-150">
                      <p>{"{"}</p>
                      <p className="pl-4">{'"web": ["XSS", "SQLi", "SSRF"],'}</p>
                      <p className="pl-4">{'"pwn": ["Buffer Overflow", "ROP"],'}</p>
                      <p className="pl-4">{'"rev": ["x86-64", "MIPS"],'}</p>
                      <p className="pl-4">{'"foren": ["Memory", "Disk", "Network", "Stegano"]'}</p>
                      <p>{"}"}</p>
                    </div>
                    <p className="pt-2 text-primary">$ {terminalLoaded ? "cat latest-activity.log" : "loading session-data..."}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full bg-primary transition-all duration-1000", terminalLoaded ? "w-full" : "w-2/3 animate-pulse")} />
                    </div>
                    {terminalLoaded && (
                      <div className="animate-in fade-in slide-in-from-top-1 pt-2 duration-700">
                        {latestActivity ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-[10px] text-secondary md:text-xs">
                              <Activity className="h-3 w-3 shrink-0" />
                              <span className="font-bold uppercase">LATEST {latestActivity.type}:</span>
                              <span className="max-w-[200px] truncate text-foreground">{latestActivity.title}</span>
                            </div>
                            <p className="ml-5 text-[9px] text-muted-foreground md:text-[10px]">
                              Timestamp: {new Date(latestActivity.date).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-[10px] text-secondary md:text-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>SUCCESS: Node synchronization complete</span>
                          </div>
                        )}
                        <p className="ml-5 mt-1 text-[9px] text-muted-foreground md:text-[10px]">
                          Status: Operational | Identity: {displayName}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
