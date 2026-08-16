import type { Metadata } from "next"
import * as React from "react"
import { getProfileSettings } from "@/lib/server-storage"
import { normalizeProfileSettings } from "@/lib/about-default"
import { SITE_BASE_URL } from "@/lib/seo-utils"
import { AboutClient } from "./AboutClient"

const aboutUrl = `${SITE_BASE_URL}/about`

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "About Me",
  description:
    "Get to know Elang Dimas Syadewa (Claritys) — cybersecurity specialist, CTF player, and web developer. Explore my technical arsenal, education, and professional journey.",
  alternates: {
    canonical: aboutUrl,
  },
  openGraph: {
    title: "About Elang Dimas Syadewa | Claritys",
    description:
      "Get to know Elang Dimas Syadewa (Claritys) — cybersecurity specialist, CTF player, and web developer.",
    url: aboutUrl,
    type: "profile",
  },
}

export default async function AboutPage() {
  const profile = await getProfileSettings().catch(() => null)
  const profileSettings = normalizeProfileSettings(profile)

  return <AboutClient profileSettings={profileSettings} />
}
