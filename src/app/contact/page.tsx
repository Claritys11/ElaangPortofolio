import type { Metadata } from "next"
import * as React from "react"
import { getProfileSettings } from "@/lib/server-storage"
import { normalizeProfileSettings } from "@/lib/about-default"
import { SITE_BASE_URL } from "@/lib/seo-utils"
import { ContactClient } from "./ContactClient"

const contactUrl = `${SITE_BASE_URL}/contact`

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Contact & Connect",
  description:
    "Establish a secure connection with Elang Dimas Syadewa (Claritys). Drop a message, get in touch for collaborations, or inquire about cybersecurity consulting.",
  alternates: {
    canonical: contactUrl,
  },
  openGraph: {
    title: "Contact & Connect | Elang Dimas Syadewa",
    description:
      "Establish a secure connection with Elang Dimas Syadewa (Claritys). Drop a message or get in touch for collaborations.",
    url: contactUrl,
    type: "website",
  },
}

export default async function ContactPage() {
  const profile = await getProfileSettings().catch(() => null)
  const profileSettings = normalizeProfileSettings(profile)

  return <ContactClient profileSettings={profileSettings} />
}
