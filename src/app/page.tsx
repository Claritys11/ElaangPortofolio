"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TerminalText } from "@/components/TerminalText"
import { GlitchText } from "@/components/GlitchText"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Shield, Terminal, Zap, Lock, ChevronRight, CheckCircle2, User } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const roles = [
  { text: "CTF Player", color: "text-primary neon-glow" },
  { text: "A Programmer", color: "text-secondary neon-glow" },
  { text: "A Student", color: "text-accent neon-glow font-bold" },
]

export default function Home() {
  const [currentRoleIndex, setCurrentRoleIndex] = React.useState(0)
  const [terminalLoaded, setTerminalLoaded] = React.useState(false)

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
    <div className="relative overflow-hidden bg-grid-pattern min-h-[calc(100vh-64px)]">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative group p-1 rounded-xl">
            <GlowingEffect
              disabled={false}
              proximity={64}
              spread={80}
              glow={true}
            />
            <div className="relative z-10 space-y-8 bg-background/40 backdrop-blur-sm p-8 rounded-lg border border-border/50">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium uppercase tracking-widest">
                <Zap className="h-3 w-3" />
                <span>Status: Active Session</span>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold leading-tight">
                  Hi, I'm <span className="text-primary">Elang</span>
                </h1>
                <div className="h-[1.2em] text-4xl md:text-6xl lg:text-7xl font-headline font-bold">
                  <TerminalText 
                    key={`role-${currentRoleIndex}`} 
                    text={roles[currentRoleIndex].text} 
                    speed={100}
                    delay={500}
                    className={roles[currentRoleIndex].color}
                  />
                </div>
              </div>

              <p className="text-xl text-muted-foreground max-w-lg h-20">
                <TerminalText 
                  text="Student developer focused on Cybersecurity and Software Engineering. Passionate about CTF competitions, digital forensics, and building useful applications."
                  speed={100}
                  delay={700}
                />
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none h-14 px-8 font-headline font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]" asChild>
                  <Link href="/ctf">
                    EXPLORE WRITE-UPS <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 rounded-none h-14 px-8 font-headline font-bold" asChild>
                  <Link href="/projects">VIEW PROJECTS</Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-none h-14 px-8 font-headline font-bold flex items-center gap-2" asChild>
                  <Link href="/about">
                    <User className="h-4 w-4" /> ABOUT ME
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-12 border-t border-border/50">
                <div>
                  <p className="text-2xl font-bold font-headline text-foreground">50+</p>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">CTF Flags</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-headline text-foreground">12</p>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">Open Source</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-headline text-foreground">5</p>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">Certificates</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl opacity-50 transition duration-1000 group-hover:opacity-100" />
            
            <div className="relative rounded-lg overflow-hidden border border-border">
              <GlowingEffect
                disabled={false}
                proximity={64}
                spread={80}
                blur={0}
                variant="default"
                glow={true}
              />
              
              <Card className="relative bg-card/80 backdrop-blur-sm border-none shadow-2xl overflow-hidden rounded-lg">
                <div className="bg-muted px-4 py-2 flex items-center justify-between border-b border-border">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-code flex items-center">
                    <Lock className="h-3 w-3 mr-1" /> session --secure-mode
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2 font-code text-sm">
                    <p className="text-primary">$ whoami</p>
                    <p className="text-foreground">Elang [Security Enthusiast]</p>
                    <p className="text-primary pt-2">$ cat skill-matrix.json</p>
                    <div className="pl-4 text-primary brightness-150 font-bold space-y-1">
                      <p>{"{"}</p>
                      <p className="pl-4">"web": ["XSS", "SQLi", "SSRF"],</p>
                      <p className="pl-4">"pwn": ["Buffer Overflow", "ROP"],</p>
                      <p className="pl-4">"rev": ["x86-64", "MIPS"]</p>
                      <p>{"}"}</p>
                    </div>
                    <p className="text-primary pt-2">$ {terminalLoaded ? "cat latest-activity.log" : "loading ctf-latest..."}</p>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn(
                        "h-full bg-primary transition-all duration-1000",
                        terminalLoaded ? "w-full" : "w-2/3 animate-pulse"
                      )} />
                    </div>
                    {terminalLoaded && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-700">
                        <div className="flex items-center space-x-2 text-xs text-secondary">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>SUCCESS: Retrieved "SQLi to RCE on Legacy CMS"</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 ml-5">Status: Published | Competition: PicoCTF</p>
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
