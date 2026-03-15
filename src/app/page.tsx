"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TerminalText } from "@/components/TerminalText"
import { HackerEffect } from "@/components/HackerEffect"
import { Shield, Terminal, Zap, Lock, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-grid-pattern min-h-[calc(100vh-64px)]">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium uppercase tracking-widest">
              <Zap className="h-3 w-3" />
              <span>Status: Active Session</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold leading-tight min-h-[1.2em]">
              <HackerEffect words={["Hi, I'm Elang", "Hi, I'm Claritys"]} />
              <br />
              <span className="text-primary neon-glow">
                <HackerEffect words={["CTF Player", "Programmer", "Student"]} />
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-lg h-20">
              <TerminalText 
                text="Professional CTF enthusiast and cybersecurity researcher specializing in web penetration testing and cryptanalysis."
              />
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none h-14 px-8 font-headline font-bold" asChild>
                <Link href="/ctf">
                  EXPLORE WRITE-UPS <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 rounded-none h-14 px-8 font-headline font-bold" asChild>
                <Link href="/projects">VIEW PROJECTS</Link>
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

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <Card className="relative bg-card border-border shadow-2xl overflow-hidden rounded-lg">
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
                  <div className="pl-4 text-secondary/80 space-y-1">
                    <p>{"{"}</p>
                    <p className="pl-4">"web": ["XSS", "SQLi", "SSRF"],</p>
                    <p className="pl-4">"pwn": ["Buffer Overflow", "ROP"],</p>
                    <p className="pl-4">"rev": ["x86-64", "MIPS"]</p>
                    <p>{"}"}</p>
                  </div>
                  <p className="text-primary pt-2">$ loading ctf-latest...</p>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}