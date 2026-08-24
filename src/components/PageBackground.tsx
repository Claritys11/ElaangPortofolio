"use client"

import { BackgroundPaths } from "@/components/ui/background-paths"
import { cn } from "@/lib/utils"

interface PageBackgroundProps {
  className?: string
}

export function PageBackground({ className }: PageBackgroundProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)} aria-hidden="true">
      <BackgroundPaths className="opacity-45 [mask-image:linear-gradient(to_bottom,black,black_42%,transparent_86%)]" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_18%_12%,hsl(var(--primary)/0.16),transparent_34%),radial-gradient(circle_at_82%_8%,hsl(var(--secondary)/0.12),transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)/0.18),hsl(var(--background))_74%)]" />
    </div>
  )
}
