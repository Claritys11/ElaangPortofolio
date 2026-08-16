import type { Metadata } from "next"
import { listWriteupSummaries } from "@/lib/server-storage"
import { SITE_BASE_URL } from "@/lib/seo-utils"
import { CTFClient } from "./CTFClient"

const ctfUrl = `${SITE_BASE_URL}/ctf`

export const metadata: Metadata = {
  title: "CTF Write-Ups",
  description:
    "Technical write-ups from Capture The Flag competitions — Web, Pwn, Crypto, Reverse Engineering, and Forensics challenges solved by Claritys.",
  alternates: {
    canonical: ctfUrl,
  },
  openGraph: {
    title: "CTF Write-Ups | Claritys Portfolio",
    description:
      "Technical write-ups from Capture The Flag competitions — Web, Pwn, Crypto, Reverse Engineering, and Forensics.",
    url: ctfUrl,
    type: "website",
  },
}

// Server Component — fetches all writeups at request time.
// Passes them to CTFClient for client-side search/filter interactivity.
export default async function CTFPage() {
  const writeups = await listWriteupSummaries().catch(() => [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <CTFClient writeups={writeups} />
    </div>
  )
}
