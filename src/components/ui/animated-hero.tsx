"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Activity, Award, Code2, MoveRight, PhoneCall, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HeroProps {
  displayName: string
  alias: string
  aboutText: string
  writeupCount: number
  projectCount: number
  achievementCount: number
  latestActivityTitle?: string
  animatedTitles?: string[]
  className?: string
}

const defaultAnimatedTitles = ["CTF player", "web security builder", "student", "problem solver", "write-up maker"]

const featureLinks = [
  {
    href: "/ctf",
    label: "Open Write-ups",
    detail: "Read CTF notes and challenge breakdowns.",
    icon: Terminal,
  },
  {
    href: "/projects",
    label: "View Projects",
    detail: "Explore experiments, tools, and builds.",
    icon: Code2,
  },
  {
    href: "/achievements",
    label: "See Achievements",
    detail: "Browse certificates and competition records.",
    icon: Award,
  },
]

function Hero({
  displayName,
  alias,
  aboutText,
  writeupCount,
  projectCount,
  achievementCount,
  latestActivityTitle,
  animatedTitles = defaultAnimatedTitles,
  className,
}: HeroProps) {
  const [titleNumber, setTitleNumber] = React.useState(0)
  const titles = React.useMemo(
    () => animatedTitles.map((title) => title.trim()).filter(Boolean),
    [animatedTitles]
  )
  const visibleTitles = titles.length ? titles : defaultAnimatedTitles
  const visibleTitleKey = visibleTitles.join("|")

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((current) => (current === visibleTitles.length - 1 ? 0 : current + 1))
    }, 2400)

    return () => clearTimeout(timeoutId)
  }, [titleNumber, visibleTitles.length])

  React.useEffect(() => {
    setTitleNumber(0)
  }, [visibleTitleKey])

  return (
    <section
      className={cn(
        "relative flex min-h-[calc(100vh-64px)] w-full items-center overflow-hidden bg-grid-pattern",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-16 h-[26rem] w-[min(42rem,92vw)] -translate-x-1/2 rounded-full border border-primary/15 bg-primary/5 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <Button variant="secondary" size="sm" className="gap-3 border border-primary/20 bg-primary/10 font-code text-xs uppercase tracking-widest text-primary hover:bg-primary/15" asChild>
              <Link href="/about">
                {alias} protocol online <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <div className="flex max-w-4xl flex-col gap-5">
            <h1 className="font-headline text-4xl font-bold leading-[0.98] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
              <span className="block">{displayName}</span>
              <span className="relative mt-2 flex min-h-[1.08em] w-full justify-center overflow-hidden text-center text-primary">
                {visibleTitles.map((title, index) => (
                  <motion.span
                    key={title}
                    className="absolute font-bold neon-glow"
                    initial={{ opacity: 0, y: -80 }}
                    transition={{ type: "spring", stiffness: 55, damping: 14 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : { y: titleNumber > index ? -120 : 120, opacity: 0 }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-lg sm:leading-8 md:text-xl">
              {aboutText}
            </p>
          </div>

          <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="h-12 gap-3 font-headline font-bold" asChild>
              <Link href="/ctf">
                Start Reading <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 gap-3 border-secondary/40 bg-background/60 font-headline font-bold text-secondary hover:bg-secondary/10" asChild>
              <Link href="/contact">
                Contact Me <PhoneCall className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid w-full max-w-3xl grid-cols-3 gap-3 border-y border-border/60 py-4 text-left sm:gap-6">
            <div>
              <p className="font-headline text-2xl font-bold text-foreground sm:text-3xl">{writeupCount}</p>
              <p className="font-code text-[10px] uppercase tracking-widest text-muted-foreground">Write-ups</p>
            </div>
            <div>
              <p className="font-headline text-2xl font-bold text-foreground sm:text-3xl">{projectCount}</p>
              <p className="font-code text-[10px] uppercase tracking-widest text-muted-foreground">Projects</p>
            </div>
            <div>
              <p className="font-headline text-2xl font-bold text-foreground sm:text-3xl">{achievementCount}</p>
              <p className="font-code text-[10px] uppercase tracking-widest text-muted-foreground">Records</p>
            </div>
          </div>

          <div className="grid w-full gap-3 md:grid-cols-3">
            {featureLinks.map((item) => {
              const Icon = item.icon

              return (
                <Button
                  key={item.href}
                  variant="outline"
                  className="h-auto justify-start border-border/70 bg-background/55 p-4 text-left hover:border-primary/50 hover:bg-primary/5"
                  asChild
                >
                  <Link href={item.href} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-headline text-sm font-bold text-foreground">{item.label}</span>
                      <span className="mt-1 block whitespace-normal text-xs leading-5 text-muted-foreground">{item.detail}</span>
                    </span>
                  </Link>
                </Button>
              )
            })}
          </div>

          <a
            href="#terminal-session"
            className="inline-flex items-center gap-2 font-code text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
          >
            Scroll to terminal <MoveRight className="h-3.5 w-3.5 rotate-90" />
          </a>

          {latestActivityTitle && (
            <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-secondary/25 bg-secondary/10 px-3 py-2 font-code text-xs text-secondary">
              <Activity className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Latest activity: {latestActivityTitle}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export { Hero }
