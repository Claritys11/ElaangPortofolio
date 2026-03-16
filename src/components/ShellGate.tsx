
"use client"

import * as React from "react"
import { ShellIntro } from "./ShellIntro"

export function ShellGate({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const hasEntered = sessionStorage.getItem("terminal_authorized")
    if (hasEntered) {
      setShowIntro(false)
    } else {
      setShowIntro(true)
    }
  }, [])

  const handleComplete = () => {
    sessionStorage.setItem("terminal_authorized", "true")
    setShowIntro(false)
  }

  // Prevent flash of content while checking session
  if (showIntro === null) return null

  if (showIntro) {
    return <ShellIntro onComplete={handleComplete} />
  }

  return <>{children}</>
}
