"use client"

import * as React from "react"
import { ShellIntro } from "./ShellIntro"
import { motion, AnimatePresence } from "motion/react"

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
