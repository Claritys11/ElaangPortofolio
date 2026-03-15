
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { User, Terminal, Briefcase, GraduationCap, Code2, Globe, Heart } from "lucide-react"

const skills = [
  { name: "Web Application Security", level: 90 },
  { name: "Network Penetration Testing", level: 85 },
  { name: "Binary Exploitation", level: 70 },
  { name: "Incident Response", level: 65 },
  { name: "Cloud Security (AWS/Azure)", level: 75 }
]

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-1 space-y-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-25" />
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/50">
              <img 
                src="https://picsum.photos/seed/about/600/600" 
                alt="Profile" 
                className="object-cover grayscale"
                data-ai-hint="professional profile"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-headline font-bold border-b border-border pb-2">Connect</h2>
            <div className="space-y-3">
              <a href="#" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-4 w-4 mr-3" /> cipher-synth.io
              </a>
              <a href="#" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <Terminal className="h-4 w-4 mr-3" /> github.com/ciphersynth
              </a>
              <a href="#" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <Briefcase className="h-4 w-4 mr-3" /> linkedin.com/in/cipher
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-headline font-bold border-b border-border pb-2">Education</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold">B.Sc Computer Science</p>
                  <p className="text-xs text-muted-foreground">Tech University, 2022</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-primary">
              <User className="h-5 w-5" />
              <span className="font-code text-sm font-bold uppercase tracking-widest">Profile</span>
            </div>
            <h1 className="text-5xl font-headline font-bold">Hi, I'm <span className="text-primary neon-glow">Elang</span> Dimas Syadewa</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              I am a dedicated cybersecurity professional with a passion for offensive security and CTF competitions. 
              My journey began in the terminal, exploring vulnerabilities and building secure systems.
              Today, I focus on helping organizations fortify their digital infrastructure through 
              adversarial testing and secure development practices.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold flex items-center">
              <Code2 className="h-6 w-6 mr-3 text-secondary" />
              Technical Arsenal
            </h2>
            <div className="grid gap-6">
              {skills.map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-primary font-code">{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="h-1 bg-muted" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold flex items-center">
              <Briefcase className="h-6 w-6 mr-3 text-secondary" />
              Professional Journey
            </h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {[
                {
                  role: "Security Researcher",
                  company: "CyberNodes Inc",
                  period: "2023 - Present",
                  desc: "Conducting deep-dive penetration tests on financial infrastructure."
                },
                {
                  role: "Junior Security Consultant",
                  company: "DefendIT",
                  period: "2022 - 2023",
                  desc: "Assisted in vulnerability management and remediation tracking."
                }
              ].map((job, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card group-hover:border-primary transition-colors shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold">{job.role}</h4>
                        <time className="text-[10px] font-code text-muted-foreground">{job.period}</time>
                      </div>
                      <p className="text-xs text-primary mb-2">{job.company}</p>
                      <p className="text-sm text-muted-foreground">{job.desc}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
            <h3 className="text-lg font-headline font-bold flex items-center">
              <Heart className="h-5 w-5 mr-2 text-primary" />
              Philosophy
            </h3>
            <p className="text-sm text-muted-foreground italic">
              "To protect the light, we must master the darkness. Cybersecurity isn't just a career; 
              it's a constant pursuit of understanding how systems fail, so we can make them succeed."
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
