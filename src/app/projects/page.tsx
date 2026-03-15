
"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cpu, Github, ExternalLink, ShieldCheck, Lock, Box, Settings, Sparkles, Search, Code } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { cn } from "@/lib/utils"

const projects = [
  {
    area: "md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]",
    icon: <Box className="h-4 w-4" />,
    title: "CipherVault",
    description: "A decentralized, zero-knowledge password manager built using Rust. Features multi-layered AES-256-GCM encryption.",
    tags: ["Rust", "Wasm", "Cryptography"],
    category: "Security Tooling"
  },
  {
    area: "md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]",
    icon: <Settings className="h-4 w-4" />,
    title: "Vanguard Scanner",
    description: "Automated vulnerability scanner for microservices. Detects XSS, CSRF, and misconfigured CORS policies.",
    tags: ["Go", "Docker", "Security"],
    category: "Web Security"
  },
  {
    area: "md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]",
    icon: <Lock className="h-4 w-4" />,
    title: "Sentinel Proxy",
    description: "A high-performance reverse proxy with integrated Layer 7 DDoS mitigation and real-time threat intelligence filtering.",
    tags: ["C++", "Networking", "DDoS"],
    category: "Networking"
  },
  {
    area: "md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]",
    icon: <Sparkles className="h-4 w-4" />,
    title: "Neural IDS",
    description: "Intrusion Detection System powered by machine learning to identify anomalous network patterns in real-time.",
    tags: ["Python", "TensorFlow", "NSL-KDD"],
    category: "AI Security"
  },
  {
    area: "md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]",
    icon: <Search className="h-4 w-4" />,
    title: "Ghost Protocol",
    description: "Anonymized communication protocol designed for resilient data transfer in high-surveillance environments.",
    tags: ["Go", "P2P", "Onion Routing"],
    category: "Privacy"
  }
]

export default function ProjectsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-4 mb-12">
        <div className="flex items-center space-x-2 text-secondary">
          <Cpu className="h-5 w-5" />
          <span className="font-code text-sm font-bold uppercase tracking-widest">Showcase</span>
        </div>
        <h1 className="text-4xl font-headline font-bold">Technical Projects</h1>
        <p className="text-muted-foreground max-w-2xl">
          A deep dive into the technical solutions I've architected, focusing on security, performance, and scalability.
        </p>
      </div>

      <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
        {projects.map((project, idx) => (
          <GridItem
            key={idx}
            area={project.area}
            icon={project.icon}
            title={project.title}
            description={project.description}
            tags={project.tags}
            category={project.category}
          />
        ))}
      </ul>

      <div className="mt-20 p-8 border border-border bg-muted/30 rounded-lg text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-4 relative z-10" />
        <h3 className="text-xl font-headline font-bold mb-2 relative z-10">Commitment to Secure Coding</h3>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm relative z-10">
          All projects follow OWASP Top 10 guidelines and undergo rigorous manual code review. 
          View more experiments on my <a href="#" className="text-primary hover:underline">GitHub Laboratory</a>.
        </p>
      </div>
    </div>
  )
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  category: string;
}

const GridItem = ({ area, icon, title, description, tags, category }: GridItemProps) => {
  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="flex justify-between items-start">
              <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
                {icon}
              </div>
              <Badge variant="outline" className="text-[9px] uppercase tracking-tighter border-primary/20 text-primary/70">
                {category}
              </Badge>
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-bold font-headline tracking-tight text-foreground">
                {title}
              </h3>
              <p className="font-body text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-auto">
            {tags.map(tag => (
              <span key={tag} className="text-[10px] font-code px-2 py-0.5 rounded bg-muted border border-border/50">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
};
