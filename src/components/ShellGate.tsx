"use client"

import * as React from "react"
import { ShellIntro } from "./ShellIntro"
import { motion, AnimatePresence } from "motion/react"
import { SystemLoader } from "./SystemLoader"

export function ShellGate({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    try {
      window.sessionStorage.getItem("terminal_authorized")
      setShowIntro(false)
    } catch {
      setShowIntro(false)
    }
  }, [])

  const handleComplete = () => {
    try {
      window.sessionStorage.setItem("terminal_authorized", "true")
    } catch {
    }
    setShowIntro(false)
  }

  if (showIntro === null) {
    return (
      <div className="min-h-screen px-4 py-10 flex items-center justify-center">
        <SystemLoader
          size="panel"
          message="Checking terminal session"
          detail="Reading browser session authorization state."
        />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {showIntro ? (
        <ShellIntro key="intro" onComplete={handleComplete} />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
