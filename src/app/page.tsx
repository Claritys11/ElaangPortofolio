
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TerminalText } from "@/components/TerminalText"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Shield, Zap, Lock, ChevronRight, CheckCircle2, User } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"

const roles = [
  { text: "CTF Player", color: "text-primary neon-glow" },
  { text: "A Programmer", color: "text-secondary neon-glow" },
  { text: "A Student", color: "text-accent neon-glow font-bold" },
]

export default function Home() {
  const [currentRoleIndex, setCurrentRoleIndex] = React.useState(0)
  const [terminalLoaded, setTerminalLoaded] = React.useState(false)

  const db = useFirestore()
  
  // Dynamic stats calculation from Firestore
  const writeupsRef = useMemoFirebase(() => collection(db, "ctfWriteups"), [db])
  const projectsRef = useMemoFirebase(() => collection(db, "projects"), [db])
  const achievementsRef = useMemoFirebase(() => collection(db, "achievements"), [db])

  const { data: writeups } = useCollection(writeupsRef)
  const { data: projects } = useCollection(projectsRef)
  const { data: achievements } = useCollection(achievementsRef)

  const writeupCount = writeups?.length || 0
  const projectCount = projects?.length || 0
  const achievementCount = achievements?.length || 0

  React.useEffect(() => {
    const roleInterval = setInterval(() => {
      setCurrentRoleIndex((prev) => (prev + 1) % roles.length)
    }, 5000)
    return () => clearInterval(roleInterval)
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(() => setTerminalLoaded(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative overflow-hidden bg-grid-pattern min-h-[calc(100vh-64px)] flex items-center">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px]" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-secondary/5 rounded-full blur-[80px] md:blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10 space-y-6 md:space-y-8 bg-background/40 backdrop-blur-sm p-6 md:p-8 rounded-lg border border-border/50">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-medium uppercase tracking-widest">
              <Zap className="h-3 w-3" />
              <span>Status: Active Session</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold leading-tight">
                Hi, I'm <span className="text-primary">Elang</span>
              </h1>
              <div className="min-h-[1.2em] text-3xl md:text-6xl lg:text-7xl font-headline font-bold">
                <TerminalText 
                  key={`role-${currentRoleIndex}`} 
                  text={roles[currentRoleIndex].text} 
                  speed={100}
                  delay={500}
                  className={roles[currentRoleIndex].color}
                />
              </div>
            </div>

            <div className="text-base md:text-xl text-muted-foreground max-w-lg min-h-[5rem]">
              <TerminalText 
                text="Student developer focused on Cybersecurity and Software Engineering. Passionate about CTF competitions, and building useful applications."
                speed={50}
                delay={700}
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <div className="relative p-0.5 group w-full sm:w-auto">
                <GlowingEffect
                  disabled={false}
                  proximity={64}
                  spread={40}
                  glow={true}
                />
                <Button size="lg" className="relative w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-none h-12 md:h-14 px-8 font-headline font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] text-sm md:text-base" asChild>
                  <Link href="/ctf">
                    EXPLORE WRITE-UPS <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="relative p-0.5 group w-full sm:w-auto">
                <GlowingEffect
                  disabled={false}
                  proximity={64}
                  spread={40}
                  glow={true}
                />
                <Button size="lg" variant="outline" className="relative w-full sm:w-auto border-secondary text-secondary hover:bg-secondary/10 rounded-none h-12 md:h-14 px-8 font-headline font-bold bg-background/50 text-sm md:text-base" asChild>
                  <Link href="/projects">VIEW PROJECTS</Link>
                </Button>
              </div>

              <div className="relative p-0.5 group w-full sm:w-auto">
                <GlowingEffect
                  disabled={false}
                  proximity={64}
                  spread={40}
                  glow={true}
                />
                <Button size="lg" variant="ghost" className="relative w-full sm:w-auto text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-none h-12 md:h-14 px-8 font-headline font-bold flex items-center gap-2 bg-background/50 text-sm md:text-base" asChild>
                  <Link href="/about">
                    <User className="h-4 w-4" /> ABOUT ME
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 md:gap-8 pt-8 md:pt-12 border-t border-border/50">
              <div>
                <p className="text-xl md:text-2xl font-bold font-headline text-foreground">{writeupCount}</p>
                <p className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-wider">CTF Write-ups</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold font-headline text-foreground">{projectCount}</p>
                <p className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-wider">Projects</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold font-headline text-foreground">{achievementCount}</p>
                <p className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-wider">Certificates</p>
              </div>
            </div>
          </div>

          <div className="relative group mt-8 lg:mt-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl opacity-50 transition duration-1000 group-hover:opacity-100" />
            
            <div className="relative rounded-lg overflow-hidden border border-border">
              <GlowingEffect
                disabled={false}
                proximity={80}
                spread={60}
                blur={0}
                variant="default"
                glow={true}
              />
              
              <Card className="relative bg-card/80 backdrop-blur-sm border-none shadow-2xl overflow-hidden rounded-lg">
                <div className="bg-muted px-4 py-2 flex items-center justify-between border-b border-border">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="text-[9px] md:text-[10px] text-muted-foreground font-code flex items-center">
                    <Lock className="h-3 w-3 mr-1" /> session --secure-mode
                  </div>
                </div>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="space-y-2 font-code text-xs md:text-sm">
                    <p className="text-primary">$ whoami</p>
                    <p className="text-foreground">Elang [Security Enthusiast]</p>
                    <p className="text-primary pt-2">$ cat skill-matrix.json</p>
                    <div className="pl-4 text-primary brightness-150 font-bold space-y-1">
                      <p>{"{"}</p>
                      <p className="pl-4">"web": ["XSS", "SQLi", "SSRF"],</p>
                      <p className="pl-4">"pwn": ["Buffer Overflow", "ROP"],</p>
                      <p className="pl-4">"rev": ["x86-64", "MIPS"],</p>
                      <p className="pl-4">"foren": ["Memory", "Disk", "Network"]</p>
                      <p>{"}"}</p>
                    </div>
                    <p className="text-primary pt-2">$ {terminalLoaded ? "cat latest-activity.log" : "loading session-data..."}</p>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn(
                        "h-full bg-primary transition-all duration-1000",
                        terminalLoaded ? "w-full" : "w-2/3 animate-pulse"
                      )} />
                    </div>
                    {terminalLoaded && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-700">
                        <div className="flex items-center space-x-2 text-[10px] md:text-xs text-secondary">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>SUCCESS: Node synchronization complete</span>
                        </div>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1 ml-5">Status: Operational | Identity: Elang</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
