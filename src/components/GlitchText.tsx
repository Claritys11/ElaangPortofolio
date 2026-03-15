
"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

const glyphs = "ABCDEFHIJKLMNOPQRSTUVXYZ0123456789@#$%^&*()_+"

interface GlitchTextProps {
  text: string
  className?: string
}

export function GlitchText({ text, className }: GlitchTextProps) {
  const [displayText, setDisplayText] = React.useState(text)
  const [isGlitching, setIsGlitching] = React.useState(false)

  React.useEffect(() => {
    // Trigger glitch effect on text change
    setIsGlitching(true)
    let iteration = 0
    const maxIterations = text.length
    
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, i) => {
            if (i < iteration) return text[i]
            if (char === " ") return " "
            return glyphs[Math.floor(Math.random() * glyphs.length)]
          })
          .join("")
      )

      if (iteration >= maxIterations) {
        clearInterval(interval)
        setIsGlitching(false)
        setDisplayText(text)
      }
      
      iteration += 1/2
    }, 30)

    return () => clearInterval(interval)
  }, [text])

  return (
    <span className={cn(
      "font-code transition-all duration-300 inline-block",
      isGlitching && "animate-glitch text-secondary",
      className
    )}>
      {displayText}
    </span>
  )
}
