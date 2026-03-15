"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Terminal, Search, ExternalLink, Calendar, Tag, Layers, Trophy } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GlowingEffect } from "@/components/ui/glowing-effect"

const categories = ["All", "Web", "Pwn", "Crypto", "Reverse", "Forensics"]

export const writeups = [
  {
    id: "sqli-rce-pico",
    title: "SQLi to RCE on Legacy CMS",
    competition: "PicoCTF 2023",
    category: "Web",
    difficulty: "Hard",
    date: "2023-11-15",
    summary: "Bypassing a strict WAF to achieve remote code execution via a multi-stage blind SQL injection.",
    tags: ["SQLi", "WAF Bypass", "PHP"]
  },
  {
    id: "rop-chain-htb",
    title: "ROP Chain Magic",
    competition: "HackTheBox Business",
    category: "Pwn",
    difficulty: "Medium",
    date: "2023-10-02",
    summary: "Constructing a Return Oriented Programming chain to bypass NX and ASLR on a binary.",
    tags: ["ROP", "Exploit", "Pwn"]
  },
  {
    id: "aes-ecb-cyber",
    title: "Broken AES-ECB Implementation",
    competition: "CyberApocalypse",
    category: "Crypto",
    difficulty: "Easy",
    date: "2023-08-12",
    summary: "Exploiting the lack of diffusion in ECB mode to recover sensitive session tokens.",
    tags: ["AES", "ECB", "Oracle"]
  },
  {
    id: "malware-flare",
    title: "Deep Dive into packed Malware",
    competition: "Flare-On 9",
    category: "Reverse",
    difficulty: "Hard",
    date: "2023-09-20",
    summary: "Unpacking a custom obfuscator and reversing the core C2 communication logic.",
    tags: ["Malware", "RE", "Ghidra"]
  }
]

export default function CTFPage() {
  const [viewMode, setViewMode] = React.useState<"category" | "platform">("category")
  const [activeFilter, setActiveFilter] = React.useState("All")
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredWriteups = writeups.filter(w => {
    const matchesSearch = w.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.summary.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (viewMode === "category") {
      const matchesCategory = activeFilter === "All" || w.category === activeFilter
      return matchesCategory && matchesSearch
    } else {
      const matchesPlatform = activeFilter === "All" || w.competition === activeFilter
      return matchesPlatform && matchesSearch
    }
  })

  const platforms = ["All", ...Array.from(new Set(writeups.map(w => w.competition)))]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-primary">
            <Terminal className="h-5 w-5" />
            <span className="font-code text-sm font-bold uppercase tracking-widest">Repository</span>
          </div>
          <h1 className="text-4xl font-headline font-bold">CTF Write-Ups</h1>
          <p className="text-muted-foreground max-w-2xl">
            A collection of technical write-ups from various Capture The Flag competitions. 
            Select your preferred viewing mode to explore the database.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search database..." 
              className="pl-10 bg-card border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex space-x-4">
            <button 
              onClick={() => { setViewMode("category"); setActiveFilter("All"); }}
              className={cn(
                "flex items-center space-x-2 text-sm font-medium transition-colors",
                viewMode === "category" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="h-4 w-4" />
              <span>By Category</span>
            </button>
            <button 
              onClick={() => { setViewMode("platform"); setActiveFilter("All"); }}
              className={cn(
                "flex items-center space-x-2 text-sm font-medium transition-colors",
                viewMode === "platform" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trophy className="h-4 w-4" />
              <span>By Platform</span>
            </button>
          </div>
        </div>

        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="bg-muted p-1 mb-8 overflow-x-auto flex whitespace-nowrap justify-start">
            {(viewMode === "category" ? categories : platforms).map(filter => (
              <TabsTrigger 
                key={filter} 
                value={filter}
                className="px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-headline"
              >
                {filter}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWriteups.length > 0 ? (
              filteredWriteups.map((w) => (
                <Link key={w.id} href={`/ctf/${w.id}`} className="block group">
                  <div className="relative h-full rounded-xl border-[0.75px] border-border p-1">
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      borderWidth={2}
                    />
                    <div className="relative h-full flex flex-col bg-background p-6 rounded-lg border border-border group-hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="secondary" className="bg-secondary/10 text-secondary border-none">
                          {viewMode === "category" ? w.competition : w.category}
                        </Badge>
                        <span className={cn(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
                          w.difficulty === "Hard" ? "border-red-500/50 text-red-400" : 
                          w.difficulty === "Medium" ? "border-yellow-500/50 text-yellow-400" : 
                          "border-green-500/50 text-green-400"
                        )}>
                          {w.difficulty}
                        </span>
                      </div>
                      <h3 className="text-xl font-headline font-bold mb-2 group-hover:text-primary transition-colors">
                        {w.title}
                      </h3>
                      <p className="flex items-center text-xs text-muted-foreground mb-4">
                        <Calendar className="h-3 w-3 mr-1" /> {w.date}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                        {w.summary}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border/50">
                        {w.tags.map(tag => (
                          <span key={tag} className="flex items-center text-[10px] text-muted-foreground font-code bg-muted px-2 py-0.5 rounded">
                            <Tag className="h-2 w-2 mr-1" /> {tag}
                          </span>
                        ))}
                        <div className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-border rounded-lg">
                <Terminal className="h-12 w-12 text-muted mx-auto" />
                <p className="text-muted-foreground font-code uppercase">No records found for this signal.</p>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
