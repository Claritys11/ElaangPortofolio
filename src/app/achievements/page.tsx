
"use client"

import * as React from "react"
import { Award, Shield, Trophy, CheckCircle2, Star, ExternalLink, Loader2 } from "lucide-react"
import Image from "next/image"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function AchievementsPage() {
  const db = useFirestore()
  const achievementsQuery = useMemoFirebase(() => query(collection(db, "achievements"), orderBy("createdAt", "desc")), [db])
  const { data: dbAchievements, isLoading } = useCollection(achievementsQuery)

  const certifications = (dbAchievements || []).filter(a => a.imageUrl && a.issuer)
  const quickStats = (dbAchievements || []).filter(a => !a.imageUrl || a.platform)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-primary">
            <Award className="h-5 w-5" />
            <span className="font-code text-sm font-bold uppercase tracking-widest">Hall of Fame</span>
          </div>
          <h1 className="text-4xl font-headline font-bold">Achievements & Certifications</h1>
          <p className="text-muted-foreground max-w-2xl">
            A visual documentation of my professional journey, validation of skills, and competitive milestones.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="font-code text-muted-foreground">Authenticating credentials...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {certifications.length > 0 ? certifications.map((cert, idx) => (
              <a 
                key={cert.id || idx} 
                href={cert.imageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative group rounded-xl border border-border p-1 block transition-transform hover:scale-[1.02]"
              >
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
                <div className="relative bg-background rounded-lg overflow-hidden h-full flex flex-col">
                  <div className="relative h-56 bg-muted/20">
                    {cert.imageUrl ? (
                      <img 
                        src={cert.imageUrl} 
                        alt={cert.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Award className="h-12 w-12 text-primary opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between border-t border-border/50">
                    <div>
                      <p className="text-[10px] font-code text-primary uppercase mb-1">{cert.issuer}</p>
                      <h3 className="text-lg font-headline font-bold">{cert.title}</h3>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">{cert.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-xs text-muted-foreground font-code">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-primary" />
                        VERIFIED
                      </div>
                      <p className="text-xs text-muted-foreground">{cert.date}</p>
                    </div>
                  </div>
                </div>
              </a>
            )) : (
              <div className="col-span-full text-center py-10 opacity-50 font-code text-sm">No visual credentials recorded.</div>
            )}
          </div>

          <h2 className="text-2xl font-headline font-bold mb-8 flex items-center">
            <Trophy className="h-6 w-6 mr-3 text-secondary" />
            Competitive Milestones
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {quickStats.length > 0 ? quickStats.map((item, idx) => (
              <div key={item.id || idx} className="relative group rounded-xl border border-border p-1">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
                <div className="relative p-6 h-full flex flex-col bg-background rounded-lg border border-border group-hover:bg-muted/10 transition-colors">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-xs font-code text-secondary mb-1">{item.platform || item.issuer}</p>
                  <h3 className="text-lg font-headline font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                  <div className="mt-auto pt-4 text-[10px] font-code text-muted-foreground">{item.date}</div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-10 opacity-50 font-code text-sm">No milestones logged.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
