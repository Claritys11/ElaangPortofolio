"use client"

import { Activity, Server, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface SystemLoaderProps {
  message?: string
  detail?: string
  className?: string
  size?: "page" | "panel" | "compact"
  announce?: boolean
}

export function SystemLoader({
  message = "Loading system resources",
  detail = "Negotiating secure node state",
  className,
  size = "panel",
  announce = true,
}: SystemLoaderProps) {
  const isCompact = size === "compact"

  return (
    <div
      role={announce ? "status" : undefined}
      aria-live={announce ? "polite" : undefined}
      aria-atomic={announce ? "true" : undefined}
      className={cn(
        "system-loader relative overflow-hidden border border-primary/30 bg-background/85 text-foreground shadow-[0_0_24px_hsl(var(--primary)/0.12)]",
        size === "page" && "min-h-[60vh] w-full rounded-lg px-4 py-12 flex items-center justify-center",
        size === "panel" && "rounded-lg p-6 sm:p-8",
        isCompact && "rounded-md px-4 py-5",
        className
      )}
    >
      <div className={cn("relative z-10 w-full", size === "page" && "max-w-xl", isCompact && "max-w-sm mx-auto")}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
              <Server className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-code text-[10px] uppercase tracking-widest text-secondary">Secure node boot</p>
              <p className="truncate text-sm font-semibold sm:text-base">{message}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-code text-[10px] uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary system-loader-pulse" />
            Active
          </span>
        </div>

        {!isCompact && (
          <div className="mb-4 grid grid-cols-3 gap-2 font-code text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Auth
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
              Sync
            </span>
            <span className="text-right text-primary">0x7E1A</span>
          </div>
        )}

        <div className="relative h-2 overflow-hidden rounded-full border border-primary/25 bg-muted">
          <div className="system-loader-progress absolute inset-y-0 left-0 w-1/2 rounded-full bg-primary" />
        </div>

        <p className={cn("mt-3 font-code text-xs text-muted-foreground", isCompact && "text-center")}>{detail}</p>
      </div>
      <span className="system-loader-scan pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-primary/10" />
      <span className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" />
    </div>
  )
}
