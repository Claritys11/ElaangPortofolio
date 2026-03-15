"use client"
import * as React from "react"

const glyphs = "ABCDEFHIJKLMNOPQRSTUVXYZ0123456789@#$%^&*()_+"

interface HackerEffectProps {
  words: string[]
  interval?: number
}

export function HackerEffect({ words, interval = 3000 }: HackerEffectProps) {
  const [index, setIndex] = React.useState(0)
  const [displayText, setDisplayText] = React.useState(words[0])

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, interval)
    return () => clearInterval(timer)
  }, [words.length, interval])

  React.useEffect(() => {
    let iteration = 0
    let frame = 0
    const targetWord = words[index]
    const maxIterations = targetWord.length
    
    const scrambleInterval = setInterval(() => {
      setDisplayText(
        targetWord
          .split("")
          .map((char, i) => {
            if (i < iteration) return targetWord[i]
            if (char === " ") return " "
            return glyphs[Math.floor(Math.random() * glyphs.length)]
          })
          .join("")
      )

      if (iteration >= maxIterations) {
        clearInterval(scrambleInterval)
      }
      
      if (frame % 2 === 0) {
        iteration += 1
      }
      frame++
    }, 40)

    return () => clearInterval(scrambleInterval)
  }, [index, words])

  return <span className="font-code">{displayText}</span>
}