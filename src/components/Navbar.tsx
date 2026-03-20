"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Terminal, Shield, Award, Cpu, User, Menu, X, Mail } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { fetchJson } from "@/lib/api-client"
import { getDefaultProfileSettings, normalizeProfileSettings } from "@/lib/about-default"
import type { ProfileSettingsRecord } from "@/lib/portfolio-types"

const navItems = [
  { name: "About", href: "/about", icon: User },
  { name: "Write-Ups", href: "/ctf", icon: Terminal },
  { name: "Projects", href: "/projects", icon: Cpu },
  { name: "Achievements", href: "/achievements", icon: Award },
  { name: "Contact", href: "/contact", icon: Mail },
]

export function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const [profileSettings, setProfileSettings] = React.useState<ProfileSettingsRecord>(getDefaultProfileSettings)

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

  const baseDefaultBrandName = (profileSettings.displayName ?? "My Name").split(" ")[0] || "My"
  const defaultBrandName = `${baseDefaultBrandName}'s Portfolio`
  const customBrandName = profileSettings.navbarBrandName?.trim()
  const brandName = profileSettings.navbarBrandMode === "custom" && customBrandName
    ? customBrandName
    : defaultBrandName

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-1.5 rounded bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <span className="font-headline font-bold text-xl tracking-tighter text-foreground">
              {brandName}<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary neon-glow" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
