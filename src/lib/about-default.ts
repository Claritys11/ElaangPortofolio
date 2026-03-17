import type {
  ProfessionalJourneyItem,
  ProfileSettingsRecord,
  TechnicalArsenalItem,
} from "@/lib/portfolio-types"

export const DEFAULT_ABOUT_TEXT =
  "I'm a student passionate about cybersecurity, software, and web development. I enjoy solving complex problems, building projects, and exploring new technologies. Through Capture The Flag (CTF) challenges and coding projects, I continuously sharpen my skills in analysis, problem-solving, and developing practical solutions, while also improving my communication, collaboration, and adaptability."

export const DEFAULT_PHILOSOPHY_TEXT =
  "\"Sorry, Wish We Could Go To The Moon Together.\" -D. M."

export const DEFAULT_TECHNICAL_ARSENAL: TechnicalArsenalItem[] = [
  { name: "Web Application Security", level: 65 },
  { name: "Network Penetration Testing", level: 60 },
  { name: "Binary Exploitation", level: 70 },
  { name: "Incident Response", level: 65 },
  { name: "Reverse Engineering", level: 70 },
  { name: "Digital Forensic", level: 80 },
  { name: "Programming", level: 67 },
  { name: "Public Speaking", level: 70 },
]

export const DEFAULT_PROFESSIONAL_JOURNEY: ProfessionalJourneyItem[] = [
  {
    role: "Early Interest in Technology",
    company: "Junior High School",
    period: "2024",
    desc: "I started my journey with a strong curiosity about computers and how digital systems work. This curiosity led me to explore programming and technology more deeply.",
  },
  {
    role: "Discovering Cybersecurity & CTF",
    company: "Vocational High School",
    period: "2025",
    desc: "I later discovered cybersecurity through Capture The Flag (CTF) challenges, where I developed skills in problem solving, digital forensics, and security analysis.",
  },
  {
    role: "Building Technical Skills",
    company: "Vocational High School",
    period: "2025 - Now",
    desc: "Alongside cybersecurity, I continue improving my programming and software development skills by working on projects and experimenting with new technologies.",
  },
  {
    role: "Future Goals",
    company: "Vocational High School",
    period: "Now - Future",
    desc: "My goal is to grow as a professional in cybersecurity and software development while continuing to learn, build, and participate in technical challenges.",
  },
]

function pickString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed || fallback
}

function pickLevel(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return fallback
  }

  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function cloneTechnicalArsenal(entries: TechnicalArsenalItem[]): TechnicalArsenalItem[] {
  return entries.map((entry) => ({
    name: entry.name,
    level: entry.level,
  }))
}

function cloneProfessionalJourney(entries: ProfessionalJourneyItem[]): ProfessionalJourneyItem[] {
  return entries.map((entry) => ({
    role: entry.role,
    company: entry.company,
    period: entry.period,
    desc: entry.desc,
  }))
}

function normalizeTechnicalArsenal(entries: unknown): TechnicalArsenalItem[] {
  if (!Array.isArray(entries)) {
    return cloneTechnicalArsenal(DEFAULT_TECHNICAL_ARSENAL)
  }

  const normalized = entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }

      const source = entry as TechnicalArsenalItem
      const name = typeof source.name === "string" ? source.name.trim() : ""
      if (!name) {
        return null
      }

      return {
        name,
        level: pickLevel(source.level, 0),
      }
    })
    .filter((entry): entry is { name: string; level: number } => Boolean(entry))

  return normalized.length ? normalized : cloneTechnicalArsenal(DEFAULT_TECHNICAL_ARSENAL)
}

function normalizeProfessionalJourney(entries: unknown): ProfessionalJourneyItem[] {
  if (!Array.isArray(entries)) {
    return cloneProfessionalJourney(DEFAULT_PROFESSIONAL_JOURNEY)
  }

  const normalized = entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }

      const source = entry as ProfessionalJourneyItem
      const role = typeof source.role === "string" ? source.role.trim() : ""
      const company = typeof source.company === "string" ? source.company.trim() : ""
      const period = typeof source.period === "string" ? source.period.trim() : ""
      const desc = typeof source.desc === "string" ? source.desc.trim() : ""

      if (!role || !company || !period || !desc) {
        return null
      }

      return {
        role,
        company,
        period,
        desc,
      }
    })
    .filter(
      (entry): entry is { role: string; company: string; period: string; desc: string } =>
        Boolean(entry)
    )

  return normalized.length ? normalized : cloneProfessionalJourney(DEFAULT_PROFESSIONAL_JOURNEY)
}

export function getDefaultProfileSettings(): ProfileSettingsRecord {
  return {
    displayName: "My Name",
    email: "email@domain.tld",
    websiteUrl: "https://domain.tld",
    githubUrl: "http://github.com/github",
    instagramUrl: "https://www.instagram.com",
    profileImageUrl: "/profile.jpg",
    aboutText: DEFAULT_ABOUT_TEXT,
    philosophyText: DEFAULT_PHILOSOPHY_TEXT,
    technicalArsenal: cloneTechnicalArsenal(DEFAULT_TECHNICAL_ARSENAL),
    professionalJourney: cloneProfessionalJourney(DEFAULT_PROFESSIONAL_JOURNEY),
  }
}

export function normalizeProfileSettings(
  value?: Partial<ProfileSettingsRecord> | null
): ProfileSettingsRecord {
  const defaults = getDefaultProfileSettings()

  return {
    displayName: pickString(value?.displayName, defaults.displayName ?? "My Name"),
    email: pickString(value?.email, defaults.email ?? "email@domain.tld"),
    websiteUrl: pickString(value?.websiteUrl, defaults.websiteUrl ?? "https://domain.tld"),
    githubUrl: pickString(value?.githubUrl, defaults.githubUrl ?? "http://github.com/github"),
    instagramUrl: pickString(
      value?.instagramUrl,
      defaults.instagramUrl ?? "https://www.instagram.com"
    ),
    profileImageUrl: pickString(value?.profileImageUrl, defaults.profileImageUrl ?? "/profile.jpg"),
    aboutText: pickString(value?.aboutText, defaults.aboutText ?? DEFAULT_ABOUT_TEXT),
    philosophyText: pickString(
      value?.philosophyText,
      defaults.philosophyText ?? DEFAULT_PHILOSOPHY_TEXT
    ),
    technicalArsenal: normalizeTechnicalArsenal(value?.technicalArsenal),
    professionalJourney: normalizeProfessionalJourney(value?.professionalJourney),
    ...(typeof value?.updatedAt === "string" ? { updatedAt: value.updatedAt } : {}),
  }
}

export function mergeProfileSettings(
  existing: ProfileSettingsRecord | null | undefined,
  patch: Partial<ProfileSettingsRecord>
): ProfileSettingsRecord {
  const current = normalizeProfileSettings(existing)
  return normalizeProfileSettings({
    ...current,
    ...patch,
  })
}
