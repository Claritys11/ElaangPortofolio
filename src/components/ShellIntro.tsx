
"use client"

import * as React from "react"
import { Terminal, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"

export function ShellIntro({ onComplete }: { onComplete: () => void }) {
  const [input, setInput] = React.useState("")
  const [history, setHistory] = React.useState<string[]>([])
  const [isAuthorized, setIsAuthorized] = React.useState(false)
  const [isAutoTyping, setIsAutoTyping] = React.useState(false)
  const [isExiting, setIsExiting] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const bootLines = [
    "INITIALIZING SECURE UPLINK...",
    "NODE ESTABLISHED AT 127.0.0.1",
    "ENCRYPTION: AES-256-GCM ACTIVE",
    "----------------------------------------",
    "WELCOME TO CLARITY_NODE V2.0.4",
    "SYSTEM STATUS: RESTRICTED ACCESS",
    "----------------------------------------",
    "COMMAND REQUIRED: './letmein'",
    "----------------------------------------"
  ]

  // Handle auto-scroll
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  // Initial Boot Sequence
  React.useEffect(() => {
    let currentLine = 0
    const interval = setInterval(() => {
      if (currentLine < bootLines.length) {
        setHistory(prev => [...prev, bootLines[currentLine]])
        currentLine++
      } else {
        clearInterval(interval)
        // Tunggu 6 detik sebelum auto-typing dimulai
        setTimeout(() => {
          if (!isAuthorized) {
            startAutoTyping()
          }
        }, 6000)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [isAuthorized])

  const startAutoTyping = () => {
    setIsAutoTyping(true)
    const command = "./letmein"
    let i = 0
    const typeInterval = setInterval(() => {
      if (i <= command.length) {
        setInput(command.slice(0, i))
        i++
      } else {
        clearInterval(typeInterval)
        setTimeout(() => {
          handleExecute("./letmein")
        }, 500)
      }
    }, 100)
  }

  const handleExecute = (cmd: string) => {
    if (!cmd) return;
    const cleanCmd = cmd.trim().toLowerCase()
    setHistory(prev => [...prev, `$ ${cmd}`])
    
    if (cleanCmd === "./letmein") {
      setHistory(prev => [
        ...prev, 
        "AUTHORIZING...", 
        "IDENTITY VERIFIED.", 
        "DECRYPTING PORTFOLIO SIGNAL..."
      ])
      setIsAuthorized(true)
      
      // Delay for transition effect
      setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => {
          onComplete()
        }, 800)
      }, 1000)
    } else {
      setHistory(prev => [...prev, `sh: command not found: ${cleanCmd}`])
    }
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAuthorized && !isAutoTyping) {
      handleExecute(input)
    }
  }

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] bg-black font-code p-6 flex flex-col items-center justify-center overflow-hidden selection:bg-primary/30 selection:text-primary"
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-2xl h-[450px] flex flex-col border border-primary/20 bg-black/50 p-6 rounded-lg shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden"
          >
            {/* Transition Glitch Overlay */}
            {isAuthorized && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.2, 0, 0.1, 0] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="absolute inset-0 bg-primary/10 z-10 pointer-events-none"
              />
            )}

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-1 mb-4 scrollbar-hide text-sm md:text-base"
            >
              {history.map((line, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "animate-in fade-in slide-in-from-left-2 duration-300",
                    line && (line.startsWith("IDENTITY") || line.startsWith("DECRYPTING")) ? "text-primary font-bold" : 
                    line && line.startsWith("$") ? "text-secondary" : "text-primary/80"
                  )}
                >
                  {line}
                </div>
              ))}
              {!isAuthorized && history.length >= bootLines.length && (
                <div className="flex items-center w-full text-primary mt-2">
                  <span className="mr-2 text-secondary">$</span>
                  <input
                    autoFocus
                    className="bg-transparent border-none outline-none flex-1 text-primary caret-primary focus:ring-0"
                    value={input}
                    onChange={(e) => !isAutoTyping && setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    autoComplete="off"
                    readOnly={isAuthorized || isAutoTyping}
                    placeholder={!input ? "type command..." : ""}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between border-t border-primary/10 pt-4 text-[10px] uppercase tracking-widest text-primary/40">
              <div className="flex items-center gap-2">
                <Terminal className="h-3 w-3" />
                <span>Secure Terminal Session</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" />
                <span>Encrypted</span>
              </div>
            </div>
          </motion.div>
          
          {/* Background Matrix-like Scanlines */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
