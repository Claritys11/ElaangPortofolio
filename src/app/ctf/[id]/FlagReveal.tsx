"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Flag, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface FlagRevealProps {
  flag?: string
}

export function FlagReveal({ flag }: FlagRevealProps) {
  const [isFlagRevealed, setIsFlagRevealed] = React.useState(false)

  return (
    <section className="p-8 bg-primary/5 border border-primary/20 rounded-xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-headline font-bold text-primary flex items-center">
          <Flag className="h-5 w-5 mr-3" />
          Flag Captured
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/50 text-primary hover:bg-primary/10"
          onClick={() => setIsFlagRevealed(!isFlagRevealed)}
        >
          {isFlagRevealed ? (
            <><EyeOff className="h-3 w-3 mr-2" /> HIDE SIGNAL</>
          ) : (
            <><Eye className="h-3 w-3 mr-2" /> REVEAL FLAG SIGNAL</>
          )}
        </Button>
      </div>

      <div
        className={cn(
          "p-6 rounded-lg font-code text-center text-lg font-bold border transition-all duration-500",
          isFlagRevealed
            ? "bg-primary/20 border-primary/50 text-primary blur-none"
            : "bg-black/40 border-dashed border-primary/20 text-primary/10 blur-[6px] select-none"
        )}
      >
        {isFlagRevealed ? (flag || "FLAG_RECOVERED_SUCCESSFULLY") : "XXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
      </div>

      {!isFlagRevealed && (
        <p className="text-[10px] text-center font-code text-muted-foreground uppercase tracking-widest animate-pulse">
          Click reveal button to authorize data visualization
        </p>
      )}
    </section>
  )
}
