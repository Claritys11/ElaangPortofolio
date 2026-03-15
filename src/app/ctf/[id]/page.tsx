
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Terminal, 
  Calendar, 
  Trophy, 
  Tag as TagIcon, 
  ChevronLeft, 
  Flag, 
  Lock, 
  FileText,
  Code
} from "lucide-react"
import { cn } from "@/lib/utils"
import { writeups } from "../page"

export default function WriteupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const data = writeups.find(w => w.id === id)

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Terminal className="h-12 w-12 text-muted" />
        <h1 className="text-2xl font-bold">Write-up not found</h1>
        <Button onClick={() => router.push('/ctf')}>Return to Repository</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 lg:py-20">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-8 text-muted-foreground hover:text-primary pl-0"
        onClick={() => router.back()}
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Database
      </Button>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30 uppercase text-[10px] tracking-widest">
              {data.category}
            </Badge>
            <span className={cn(
              "text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
              data.difficulty === "Hard" ? "border-red-500/50 text-red-400" : 
              data.difficulty === "Medium" ? "border-yellow-500/50 text-yellow-400" : 
              "border-green-500/50 text-green-400"
            )}>
              {data.difficulty}
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold leading-tight tracking-tight">
            {data.title}
          </h1>
        </div>

        {/* Properties Grid - Notion Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-muted/30 border border-border rounded-xl">
          <div className="flex items-center text-sm">
            <Trophy className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Competition</span>
            <span className="font-medium">{data.competition}</span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Date</span>
            <span className="font-medium">{data.date}</span>
          </div>
          <div className="flex items-center text-sm">
            <Flag className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Solved</span>
            <span className="font-medium text-green-400 flex items-center">
              <Lock className="h-3 w-3 mr-1" /> Decrypted
            </span>
          </div>
          <div className="flex items-center text-sm">
            <TagIcon className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Tags</span>
            <div className="flex gap-2">
              {data.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-code border border-primary/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-border/60" />

        {/* Content Body - Notion Style Layout */}
        <article className="prose prose-invert max-w-none space-y-12 pb-20">
          <section className="space-y-4">
            <h2 className="text-2xl font-headline font-bold flex items-center">
              <FileText className="h-5 w-5 mr-3 text-secondary" />
              Overview
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {data.summary}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The challenge focused on identifying and exploiting a hidden vulnerability in a legacy Content Management System. 
              The initial reconnaissance suggested that the system was running an outdated PHP version with custom-built security layers 
              that required creative bypasses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-headline font-bold flex items-center">
              <Terminal className="h-5 w-5 mr-3 text-secondary" />
              Reconnaissance
            </h2>
            <div className="bg-black/40 rounded-lg p-6 font-code text-sm border border-border/50">
              <p className="text-primary mb-2"># Scanning for open ports and services</p>
              <p>$ nmap -sC -sV -oA nmap_scan target.ctf</p>
              <div className="mt-4 text-muted-foreground space-y-1">
                <p>PORT   STATE SERVICE VERSION</p>
                <p>80/tcp open  http    Apache/2.4.41 (Ubuntu)</p>
                <p>|_http-title: CipherSource - Secure CMS</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              During the initial scan, I discovered that the `admin` endpoint was accessible but required authentication. 
              Further inspection of the source code revealed a potential vulnerability in the password reset logic.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-headline font-bold flex items-center">
              <Code className="h-5 w-5 mr-3 text-secondary" />
              Exploitation
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The core vulnerability was a <strong>blind boolean-based SQL injection</strong> in the `id` parameter. 
              Because the WAF filtered common SQL keywords like `SELECT`, `FROM`, and `WHERE`, I used double-encoding and alternative syntax.
            </p>
            <div className="bg-black/40 rounded-lg p-6 font-code text-sm border border-border/50">
              <p className="text-primary mb-2"># PoC Python script fragment</p>
              <p className="text-white">import requests</p>
              <p className="text-white">{"payload = \"1' || (IF(SUBSTR((SELECT@@version),1,1)='5',SLEEP(5),1))-- -\""}</p>
              <p className="text-white">{"r = requests.get(f\"http://target/api/v1?id={payload}\")"}</p>
            </div>
          </section>

          <section className="p-8 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
            <h3 className="text-xl font-headline font-bold text-primary flex items-center">
              <Flag className="h-5 w-5 mr-3" />
              Flag Captured
            </h3>
            <div className="p-4 bg-primary/10 border border-primary/30 rounded font-code text-center text-primary font-bold">
              {"CTF{5ql_1nj3ct10n_m4st3r_9981}"}
            </div>
          </section>
        </article>
      </div>
    </div>
  )
}
