import * as React from "react"
import { getProfileSettings, getHomeSummary } from "@/lib/server-storage"
import { normalizeProfileSettings } from "@/lib/about-default"
import { HomeClient } from "./HomeClient"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [profileRaw, summaryRaw] = await Promise.allSettled([
    getProfileSettings(),
    getHomeSummary(),
  ])

  const profile = profileRaw.status === "fulfilled" ? profileRaw.value : null
  const summary = summaryRaw.status === "fulfilled" ? summaryRaw.value : null

  const profileSettings = normalizeProfileSettings(profile)

  return <HomeClient profileSettings={profileSettings} summary={summary} />
}
