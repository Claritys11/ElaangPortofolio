"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TerminalTextProps {
  text: string
  className?: string
  delay?: number
  speed?: number
  onComplete?: () => void
}

export function TerminalText({ text, className, delay = 0, speed = 80, onComplete }: TerminalTextProps) {
  const [displayText, setDisplayText] = React.useState("")
  const [isComplete, setIsComplete] = React.useState(false)

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let intervalId: ReturnType<typeof setInterval> | null = null

    setDisplayText("")
    setIsComplete(false)

    if (!text) {
      setIsComplete(true)
      return
    }
    
    timeoutId = setTimeout(() => {
      let i = 0
      intervalId = setInterval(() => {
        i++
        setDisplayText(text.slice(0, i))

        if (i >= text.length) {
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          setIsComplete(true)
          onComplete?.()
        }
      }, speed)
    }, delay)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [text, delay, speed, onComplete])

  return (
    <span className={cn("font-code", className)}>
      {displayText}
      {!isComplete && <span className="terminal-cursor" />}
    </span>
  )
}
