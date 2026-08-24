"use client"

import { BackgroundPaths } from "@/components/ui/background-paths"
import { cn } from "@/lib/utils"

interface PageBackgroundProps {
  className?: string
}

export function PageBackground({ className }: PageBackgroundProps) {
  return (
    <div
      data-page-background
      className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <BackgroundPaths className="opacity-45" />
      <BackgroundPaths className="translate-y-1/3 scale-125 opacity-24 blur-[0.3px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,hsl(var(--primary)/0.16),transparent_34%),radial-gradient(circle_at_82%_18%,hsl(var(--secondary)/0.12),transparent_32%),radial-gradient(circle_at_48%_84%,hsl(var(--primary)/0.10),transparent_36%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)/0.12),hsl(var(--background)/0.72)_78%,hsl(var(--background)/0.92))]" />
    </div>
  )
}
