
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, Github, MessageSquare, Send, Globe, Shield, Instagram, Terminal } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { useToast } from "@/hooks/use-toast"
import { fetchJson } from "@/lib/api-client"
import { getDefaultProfileSettings, normalizeProfileSettings } from "@/lib/about-default"
import type { ProfileSettingsRecord } from "@/lib/portfolio-types"

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [profileSettings, setProfileSettings] = React.useState<ProfileSettingsRecord>(
    getDefaultProfileSettings
  )

  React.useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        const payload = await fetchJson<ProfileSettingsRecord>("/api/public/profile")
        if (!active) {
          return
        }

        setProfileSettings(normalizeProfileSettings(payload))
      } catch {
        if (!active) {
          return
        }

        setProfileSettings(getDefaultProfileSettings())
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setIsSubmitting(true)

    const formData = new FormData(form)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const subject = formData.get("subject") as string
    const message = formData.get("message") as string

    try {
      await fetchJson<{ ok: true }>("/api/contact", {
        method: "POST",
        body: JSON.stringify({ name, email, subject, message }),
      })

      setIsSubmitting(false)
      toast({
        title: "SIGNAL TRANSMITTED",
        description: "Your message has been encrypted and sent to the secure node.",
      })
      form.reset()
    } catch (error) {
      setIsSubmitting(false)
      toast({
        variant: "destructive",
        title: "TRANSMISSION FAILED",
        description: error instanceof Error ? error.message : "Unable to deliver your signal.",
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-4 mb-12">
        <div className="flex items-center space-x-2 text-primary">
          <MessageSquare className="h-5 w-5" />
          <span className="font-code text-sm font-bold uppercase tracking-widest">Connect</span>
        </div>
        <h1 className="text-4xl font-headline font-bold">Establish Connection</h1>
        <p className="text-muted-foreground max-w-2xl">
          Interested in a collaboration, have a security query, or just want to say hi? 
          Drop a message through the encrypted channel below.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative h-full rounded-xl border border-border p-1 group">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <div className="relative h-full bg-card p-8 rounded-lg border border-border flex flex-col justify-between">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-headline font-bold mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-primary" />
                    Security Intel
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm group/item">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mr-4 group-hover/item:bg-primary/20 transition-colors">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-code uppercase text-muted-foreground">Email (PGP Encrypted)</p>
                        <p className="font-medium">{profileSettings.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm group/item">
                      <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center mr-4 group-hover/item:bg-secondary/20 transition-colors">
                        <Globe className="h-4 w-4 text-secondary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-code uppercase text-muted-foreground">Location</p>
                        <p className="font-medium">Remote Node / Global</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-headline font-bold mb-4">Social Hubs</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <a href={profileSettings.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded bg-muted/50 border border-border hover:border-primary/50 transition-colors">
                      <Github className="h-4 w-4 mr-3" />
                      <span className="text-sm font-medium">GitHub</span>
                    </a>
                    <a href={profileSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded bg-muted/50 border border-border hover:border-secondary/50 transition-colors">
                      <Instagram className="h-4 w-4 mr-3" />
                      <span className="text-sm font-medium">Instagram</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-border">
                <div className="bg-black/40 p-4 rounded font-code text-[10px] text-primary/70">
                  <p>$ gpg --list-keys clarity-node</p>
                  <p className="text-muted-foreground mt-1">pub   rsa4096 2023-01-01 [SC]</p>
                  <p className="text-muted-foreground">      E429 771A F920 31B4 88C1 ...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="relative rounded-xl border border-border p-1">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <Card className="relative bg-card border-none rounded-lg overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-headline font-bold">Secure Messaging</CardTitle>
                    <CardDescription>Transmit your signal to the terminal</CardDescription>
                  </div>
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs uppercase font-code tracking-widest text-muted-foreground">Identifier</Label>
                      <Input 
                        id="name" 
                        name="name"
                        placeholder="Your Alias" 
                        required 
                        className="bg-muted/50 border-border focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase font-code tracking-widest text-muted-foreground">Return Node</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        placeholder="email@provider.com" 
                        required 
                        className="bg-muted/50 border-border focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-xs uppercase font-code tracking-widest text-muted-foreground">Subject Line</Label>
                    <Input 
                      id="subject" 
                      name="subject"
                      placeholder="Protocol: Collaboration / Inquiry" 
                      required 
                      className="bg-muted/50 border-border focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs uppercase font-code tracking-widest text-muted-foreground">Payload Content</Label>
                    <Textarea 
                      id="message" 
                      name="message"
                      placeholder="System.out.println('Your message here...');" 
                      required 
                      className="min-h-[150px] bg-muted/50 border-border focus:border-primary/50 transition-colors resize-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-primary text-primary-foreground font-headline font-bold hover:bg-primary/90 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <Terminal className="h-4 w-4 mr-2 animate-pulse" /> TRANSMITTING DATA...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Send className="h-4 w-4 mr-2" /> SEND ENCRYPTED SIGNAL
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
