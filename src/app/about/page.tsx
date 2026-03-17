
"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { User, Terminal, Briefcase, GraduationCap, Code2, Globe, Instagram, Heart } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { fetchJson } from "@/lib/api-client"
import { getDefaultProfileSettings, normalizeProfileSettings } from "@/lib/about-default"
import type { ProfileSettingsRecord } from "@/lib/portfolio-types"

function formatUrlLabel(source: string, fallback: string): string {
  try {
    const parsed = new URL(source)
    const compactPath = `${parsed.host}${parsed.pathname}`.replace(/\/$/, "")
    return compactPath || fallback
  } catch {
    return fallback
  }
}

export default function AboutPage() {
  const [profileSettings, setProfileSettings] = React.useState<ProfileSettingsRecord>(
    getDefaultProfileSettings
  )

  React.useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        const payload = await fetchJson<ProfileSettingsRecord>("/api/public/profile")
        if (!active) return

        setProfileSettings(normalizeProfileSettings(payload))
      } catch {
        if (!active) return
        setProfileSettings(getDefaultProfileSettings())
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [])

  const websiteLabel = React.useMemo(
    () => formatUrlLabel(profileSettings.websiteUrl ?? "https://domain.tld", "domain.tld"),
    [profileSettings.websiteUrl]
  )

  const githubLabel = React.useMemo(
    () => formatUrlLabel(profileSettings.githubUrl ?? "http://github.com/github", "github.com/github"),
    [profileSettings.githubUrl]
  )

  const instagramLabel = React.useMemo(
    () =>
      formatUrlLabel(
        profileSettings.instagramUrl ?? "https://www.instagram.com",
        "www.instagram.com"
      ),
    [profileSettings.instagramUrl]
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-3 gap-8 md:gap-12">
        <div className="md:col-span-1 space-y-8">
          <div className="relative group p-1 rounded-xl border border-border max-w-[300px] mx-auto md:max-w-none">
            <GlowingEffect disabled={false} proximity={64} spread={40} glow={true} />
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/50 bg-muted">
              <img
                src={profileSettings.profileImageUrl ?? "/profile.jpg"}
                alt="Profile"
                className="h-full w-full object-cover grayscale"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-headline font-bold border-b border-border pb-2 text-center md:text-left">Connect</h2>
            <div className="space-y-3 flex flex-col items-center md:items-start">
              <a href={profileSettings.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-4 w-4 mr-3" /> {websiteLabel}
              </a>
              <a href={profileSettings.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <Terminal className="h-4 w-4 mr-3" /> {githubLabel}
              </a>
              <a href={profileSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-4 w-4 mr-3" /> {instagramLabel}
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-headline font-bold border-b border-border pb-2 text-center md:text-left">Education</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold">Junior High School</p>
                  <p className="text-xs text-muted-foreground">SMPN 11 Malang, 2022 - 2025</p>
                </div>
              </div>
              <div className="flex gap-4">
                <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold">Vocational High School</p>
                  <p className="text-xs text-muted-foreground">SMK Telkom Malang, 2025 - Now</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-12 mt-12 md:mt-0">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 text-primary">
              <User className="h-5 w-5" />
              <span className="font-code text-sm font-bold uppercase tracking-widest">Profile</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold">Hi, I'm <span className="text-primary neon-glow">{profileSettings.displayName}</span></h1>
            <p className="text-base md:text-xl text-muted-foreground leading-relaxed">
              {profileSettings.aboutText}
            </p>
          </div>

          <div className="relative group p-1 rounded-xl border border-border">
            <GlowingEffect disabled={false} proximity={64} spread={40} glow={true} />
            <div className="relative bg-background/60 backdrop-blur-sm p-4 md:p-6 rounded-lg">
              <h2 className="text-xl md:text-2xl font-headline font-bold flex items-center mb-6">
                <Code2 className="h-6 w-6 mr-3 text-secondary" />Technical Arsenal
              </h2>
              <div className="grid gap-6">
                {(profileSettings.technicalArsenal ?? []).map((skill, index) => (
                  <div key={`${skill.name ?? "skill"}-${index}`} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-primary font-code">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level ?? 0} className="h-1 bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-headline font-bold flex items-center justify-center md:justify-start">
              <Briefcase className="h-6 w-6 mr-3 text-secondary" />Professional Journey
            </h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {(profileSettings.professionalJourney ?? []).map((job, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card group-hover:border-primary transition-colors shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="relative w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-0.5 rounded-xl border border-border">
                    <GlowingEffect disabled={false} proximity={64} spread={40} glow={true} />
                    <Card className="relative bg-card/60 backdrop-blur-sm border-none hover:bg-card/80 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-1">
                          <h4 className="font-bold text-sm md:text-base">{job.role}</h4>
                          <time className="text-[10px] font-code text-muted-foreground shrink-0">{job.period}</time>
                        </div>
                        <p className="text-xs text-primary mb-2">{job.company}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{job.desc}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative group p-1 rounded-xl border border-border">
            <GlowingEffect disabled={false} proximity={64} spread={40} glow={true} />
            <div className="relative p-4 md:p-6 rounded-lg bg-primary/5 border-none space-y-4">
              <h3 className="text-lg font-headline font-bold flex items-center">
                <Heart className="h-5 w-5 mr-2 text-primary" />Philosophy
              </h3>
              <p className="text-sm text-muted-foreground italic">{profileSettings.philosophyText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
