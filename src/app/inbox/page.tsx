
"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Lock,
  MessageSquare,
  History,
  Plus,
  Trash2,
  Save,
  Database,
  Loader2,
  AlertCircle,
  Cpu,
  Award,
  User,
  Image as ImageIcon,
  Link as LinkIcon,
  LogOut,
  Download,
  Upload,
} from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { fetchJson } from "@/lib/api-client"
import { getDefaultProfileSettings, mergeProfileSettings } from "@/lib/about-default"
import type {
  AccessLogRecord,
  AchievementRecord,
  ProfileSettingsRecord,
  ProjectRecord,
  SecureMessageRecord,
  WriteupRecord,
} from "@/lib/portfolio-types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RichEditor } from "@/components/RichEditor"

type EditMode = "writeup" | "project" | "achievement" | null
type ImageSourceMode = "url" | "upload"

const adminCollectionRoutes = {
  messages: "/api/admin/messages",
  ctfWriteups: "/api/admin/writeups",
  projects: "/api/admin/projects",
  achievements: "/api/admin/achievements",
} as const

type DeleteCollection = keyof typeof adminCollectionRoutes

interface DeleteTarget {
  id: string
  collection: DeleteCollection
}

interface AttachmentFormState {
  name: string
  url: string
  contentType: string
}

interface WriteupFormState {
  title: string
  competition: string
  category: string
  difficulty: string
  date: string
  summary: string
  content: string
  flag: string
  tags: string
  attachments: AttachmentFormState[]
}

interface ProjectFormState {
  title: string
  description: string
  imageUrl: string
  projectUrl: string
  category: string
  tags: string
  attachments: AttachmentFormState[]
}

interface AchievementFormState {
  title: string
  issuer: string
  platform: string
  description: string
  imageUrl: string
  date: string
  attachments: AttachmentFormState[]
}

interface TechnicalArsenalFormState {
  name: string
  level: number
}

interface ProfessionalJourneyFormState {
  role: string
  company: string
  period: string
  desc: string
}

interface EducationHistoryFormState {
  level: string
  school: string
  period: string
}

interface SeoFormState {
  titleTemplate: string
  defaultTitle: string
  description: string
  canonicalUrl: string
  previewImageUrl: string
  siteName: string
  locale: string
  jobTitle: string
  keywordsText: string
  sameAsText: string
}

interface ProfileFormState {
  displayName: string
  alias: string
  navbarBrandMode: "default" | "custom"
  navbarBrandName: string
  email: string
  websiteUrl: string
  githubUrl: string
  instagramUrl: string
  profileImageUrl: string
  aboutText: string
  philosophyText: string
  technicalArsenal: TechnicalArsenalFormState[]
  professionalJourney: ProfessionalJourneyFormState[]
  educationHistory: EducationHistoryFormState[]
  seo: SeoFormState
}

interface UploadAssetResponse {
  url: string
  assetName: string
  contentType: string
}

function createEmptyWriteupForm(): WriteupFormState {
  return {
    title: "",
    competition: "",
    category: "Web",
    difficulty: "Medium",
    date: format(new Date(), "yyyy-MM-dd"),
    summary: "",
    content: "",
    flag: "",
    tags: "",
    attachments: [],
  }
}

function createEmptyProjectForm(): ProjectFormState {
  return {
    title: "",
    description: "",
    imageUrl: "",
    projectUrl: "",
    category: "Security Tooling",
    tags: "",
    attachments: [],
  }
}

function createEmptyAchievementForm(): AchievementFormState {
  return {
    title: "",
    issuer: "",
    platform: "",
    description: "",
    imageUrl: "",
    date: format(new Date(), "yyyy-MM-dd"),
    attachments: [],
  }
}

function toAttachmentFormState(
  attachments?: Array<{ name?: string; url?: string; contentType?: string }>
): AttachmentFormState[] {
  if (!Array.isArray(attachments)) {
    return []
  }

  return attachments
    .map((attachment) => {
      const url = typeof attachment?.url === "string" ? attachment.url.trim() : ""
      if (!url) {
        return null
      }

      return {
        name: typeof attachment?.name === "string" ? attachment.name.trim() : "",
        url,
        contentType: typeof attachment?.contentType === "string" ? attachment.contentType.trim() : "",
      }
    })
    .filter((attachment): attachment is AttachmentFormState => Boolean(attachment))
}

function normalizeAttachmentPayload(attachments: AttachmentFormState[]) {
  return attachments
    .map((attachment) => {
      const url = attachment.url.trim()
      if (!url) {
        return null
      }

      const name = attachment.name.trim()
      const contentType = attachment.contentType.trim()

      return {
        name: name || url,
        url,
        ...(contentType ? { contentType } : {}),
      }
    })
    .filter((attachment): attachment is { name: string; url: string; contentType?: string } =>
      Boolean(attachment)
    )
}

function parseCommaSeparatedValues(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

type DraftKind = "writeup" | "project" | "achievement"

interface LocalDraft<T> {
  id: string
  updatedAt: string
  data: T
}

interface DraftExportPayload<T> {
  version: 1
  kind: DraftKind
  exportedAt: string
  drafts: LocalDraft<T>[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toStringField(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  return typeof value === "string" ? value : ""
}

function parseAttachmentArray(value: unknown): AttachmentFormState[] | null {
  if (value == null) {
    return []
  }

  if (!Array.isArray(value)) {
    return null
  }

  const result: AttachmentFormState[] = []

  for (const item of value) {
    if (!isRecord(item)) {
      return null
    }

    const url = toStringField(item, "url").trim()
    if (!url) {
      return null
    }

    result.push({
      name: toStringField(item, "name").trim(),
      url,
      contentType: toStringField(item, "contentType").trim(),
    })
  }

  return result
}

function parseWriteupDraftData(value: unknown): WriteupFormState | null {
  if (!isRecord(value)) {
    return null
  }

  const attachments = parseAttachmentArray(value.attachments)
  if (!attachments) {
    return null
  }

  return {
    title: toStringField(value, "title"),
    competition: toStringField(value, "competition"),
    category: toStringField(value, "category") || "Web",
    difficulty: toStringField(value, "difficulty") || "Medium",
    date: toStringField(value, "date") || format(new Date(), "yyyy-MM-dd"),
    summary: toStringField(value, "summary"),
    content: toStringField(value, "content"),
    flag: toStringField(value, "flag"),
    tags: toStringField(value, "tags"),
    attachments,
  }
}

function parseProjectDraftData(value: unknown): ProjectFormState | null {
  if (!isRecord(value)) {
    return null
  }

  const attachments = parseAttachmentArray(value.attachments)
  if (!attachments) {
    return null
  }

  return {
    title: toStringField(value, "title"),
    description: toStringField(value, "description"),
    imageUrl: toStringField(value, "imageUrl"),
    projectUrl: toStringField(value, "projectUrl"),
    category: toStringField(value, "category") || "Security Tooling",
    tags: toStringField(value, "tags"),
    attachments,
  }
}

function parseAchievementDraftData(value: unknown): AchievementFormState | null {
  if (!isRecord(value)) {
    return null
  }

  const attachments = parseAttachmentArray(value.attachments)
  if (!attachments) {
    return null
  }

  return {
    title: toStringField(value, "title"),
    issuer: toStringField(value, "issuer"),
    platform: toStringField(value, "platform"),
    description: toStringField(value, "description"),
    imageUrl: toStringField(value, "imageUrl"),
    date: toStringField(value, "date") || format(new Date(), "yyyy-MM-dd"),
    attachments,
  }
}

function parseDraftCollectionImport<T>(
  kind: DraftKind,
  value: unknown,
  parseData: (input: unknown) => T | null
): { ok: true; drafts: LocalDraft<T>[] } | { ok: false; message: string } {
  let rawDrafts: unknown

  if (Array.isArray(value)) {
    rawDrafts = value
  } else if (isRecord(value)) {
    const sourceKind = value.kind
    if (typeof sourceKind === "string" && sourceKind !== kind) {
      return {
        ok: false,
        message: `Draft file kind is '${sourceKind}', expected '${kind}'.`,
      }
    }

    rawDrafts = value.drafts
  } else {
    return {
      ok: false,
      message: "Draft JSON must be an array or an object containing a drafts array.",
    }
  }

  if (!Array.isArray(rawDrafts)) {
    return {
      ok: false,
      message: "Draft JSON does not contain a valid drafts array.",
    }
  }

  const normalizedDrafts: LocalDraft<T>[] = []

  for (let index = 0; index < rawDrafts.length; index += 1) {
    const entry = rawDrafts[index]
    if (!isRecord(entry)) {
      return { ok: false, message: `Draft item #${index + 1} is not an object.` }
    }

    const id = toStringField(entry, "id").trim()
    if (!id) {
      return { ok: false, message: `Draft item #${index + 1} has an invalid id.` }
    }

    const updatedAt = toStringField(entry, "updatedAt").trim()
    if (!updatedAt || Number.isNaN(new Date(updatedAt).getTime())) {
      return { ok: false, message: `Draft item #${index + 1} has an invalid updatedAt timestamp.` }
    }

    const data = parseData(entry.data)
    if (!data) {
      return { ok: false, message: `Draft item #${index + 1} has an invalid data payload.` }
    }

    normalizedDrafts.push({ id, updatedAt, data })
  }

  return { ok: true, drafts: normalizedDrafts }
}

function draftCollectionStorageKey(kind: DraftKind): string {
  return `admin:drafts:${kind}`
}

function readDraftCollectionFromStorage<T>(kind: DraftKind): LocalDraft<T>[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const rawCollection = window.localStorage.getItem(draftCollectionStorageKey(kind))
    if (!rawCollection) {
      return []
    }

    const parsedCollection = JSON.parse(rawCollection) as Array<LocalDraft<T>>
    if (!Array.isArray(parsedCollection)) {
      return []
    }

    return parsedCollection.filter((entry) => typeof entry?.id === "string" && Boolean(entry.id))
  } catch {
    return []
  }
}

function writeDraftCollectionToStorage<T>(kind: DraftKind, collection: LocalDraft<T>[]): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(draftCollectionStorageKey(kind), JSON.stringify(collection))
}

function upsertDraftInStorage<T>(kind: DraftKind, draft: LocalDraft<T>): LocalDraft<T>[] {
  const currentCollection = readDraftCollectionFromStorage<T>(kind)
  const filteredCollection = currentCollection.filter((entry) => entry.id !== draft.id)
  const nextCollection = [draft, ...filteredCollection].sort((left, right) => {
    const leftTime = new Date(left.updatedAt).getTime()
    const rightTime = new Date(right.updatedAt).getTime()
    return rightTime - leftTime
  })

  writeDraftCollectionToStorage(kind, nextCollection)
  return nextCollection
}

function removeDraftFromStorage(kind: DraftKind, id: string): void {
  if (typeof window === "undefined") {
    return
  }

  const currentCollection = readDraftCollectionFromStorage(kind)
  const nextCollection = currentCollection.filter((entry) => entry.id !== id)
  writeDraftCollectionToStorage(kind, nextCollection)
}

function toProfileFormState(profile?: ProfileSettingsRecord | null): ProfileFormState {
  const normalized = mergeProfileSettings(getDefaultProfileSettings(), profile ?? {})
  const seo = normalized.seo ?? {}

  return {
    displayName: normalized.displayName || "",
    alias: normalized.alias || "",
    navbarBrandMode: normalized.navbarBrandMode === "custom" ? "custom" : "default",
    navbarBrandName: normalized.navbarBrandName || "",
    email: normalized.email || "",
    websiteUrl: normalized.websiteUrl || "",
    githubUrl: normalized.githubUrl || "",
    instagramUrl: normalized.instagramUrl || "",
    profileImageUrl: normalized.profileImageUrl || "",
    aboutText: normalized.aboutText || "",
    philosophyText: normalized.philosophyText || "",
    technicalArsenal: (normalized.technicalArsenal ?? []).map((item) => ({
      name: item.name || "",
      level: typeof item.level === "number" ? item.level : 0,
    })),
    professionalJourney: (normalized.professionalJourney ?? []).map((item) => ({
      role: item.role || "",
      company: item.company || "",
      period: item.period || "",
      desc: item.desc || "",
    })),
    educationHistory: (normalized.educationHistory ?? []).map((item) => ({
      level: item.level || "",
      school: item.school || "",
      period: item.period || "",
    })),
    seo: {
      titleTemplate: seo.titleTemplate || "",
      defaultTitle: seo.defaultTitle || "",
      description: seo.description || "",
      canonicalUrl: seo.canonicalUrl || "",
      previewImageUrl: seo.previewImageUrl || "",
      siteName: seo.siteName || "",
      locale: seo.locale || "",
      jobTitle: seo.jobTitle || "",
      keywordsText: (seo.keywords ?? []).join(", "),
      sameAsText: (seo.sameAs ?? []).join(", "),
    },
  }
}

function createEmptyProfileForm(): ProfileFormState {
  return toProfileFormState()
}

export default function AdminPage() {
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isAuthLoading, setIsAuthLoading] = React.useState(true)
  const [isLoginLoading, setIsLoginLoading] = React.useState(false)
  const [isDataLoading, setIsDataLoading] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("messages")

  const [messages, setMessages] = React.useState<SecureMessageRecord[]>([])
  const [logs, setLogs] = React.useState<AccessLogRecord[]>([])
  const [writeups, setWriteups] = React.useState<WriteupRecord[]>([])
  const [projects, setProjects] = React.useState<ProjectRecord[]>([])
  const [achievements, setAchievements] = React.useState<AchievementRecord[]>([])

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<DeleteTarget | null>(null)

  const [editMode, setEditMode] = React.useState<EditMode>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [activeDraftId, setActiveDraftId] = React.useState<string | null>(null)
  const [saveIndicator, setSaveIndicator] = React.useState<"saved" | "unsaved" | "saving">("saved")
  const [imageSource, setImageSource] = React.useState<ImageSourceMode>("url")
  const [profileImageSource, setProfileImageSource] = React.useState<ImageSourceMode>("url")
  const [writeupListTab, setWriteupListTab] = React.useState<"published" | "drafts">("published")
  const [projectListTab, setProjectListTab] = React.useState<"published" | "drafts">("published")
  const [achievementListTab, setAchievementListTab] = React.useState<"published" | "drafts">("published")

  const [writeupForm, setWriteupForm] = React.useState<WriteupFormState>(createEmptyWriteupForm)
  const [projectForm, setProjectForm] = React.useState<ProjectFormState>(createEmptyProjectForm)
  const [achievementForm, setAchievementForm] = React.useState<AchievementFormState>(createEmptyAchievementForm)
  const [profileForm, setProfileForm] = React.useState<ProfileFormState>(createEmptyProfileForm)
  const [writeupDrafts, setWriteupDrafts] = React.useState<Array<LocalDraft<WriteupFormState>>>([])
  const [projectDrafts, setProjectDrafts] = React.useState<Array<LocalDraft<ProjectFormState>>>([])
  const [achievementDrafts, setAchievementDrafts] = React.useState<Array<LocalDraft<AchievementFormState>>>([])

  const writeupImportInputRef = React.useRef<HTMLInputElement | null>(null)
  const projectImportInputRef = React.useRef<HTMLInputElement | null>(null)
  const achievementImportInputRef = React.useRef<HTMLInputElement | null>(null)

  const draftAutosaveTimerRef = React.useRef<number | null>(null)
  const draftSnapshotRef = React.useRef("")

  const resetDashboard = React.useCallback(() => {
    setMessages([])
    setLogs([])
    setWriteups([])
    setProjects([])
    setAchievements([])
    setEditMode(null)
    setEditingId(null)
    setActiveDraftId(null)
    setSaveIndicator("saved")
    setItemToDelete(null)
    setDeleteDialogOpen(false)
    setWriteupForm(createEmptyWriteupForm())
    setProjectForm(createEmptyProjectForm())
    setAchievementForm(createEmptyAchievementForm())
    setProfileForm(createEmptyProfileForm())
    setImageSource("url")
    setProfileImageSource("url")
    setWriteupListTab("published")
    setProjectListTab("published")
    setAchievementListTab("published")
  }, [])

  const handleUnauthorized = React.useCallback(() => {
    resetDashboard()
    setIsAuthenticated(false)
    setUsername("")
    setPassword("")
  }, [resetDashboard])

  const loadDashboardData = React.useCallback(
    async (options?: { silentUnauthorized?: boolean }) => {
      setIsDataLoading(true)

      try {
        const [nextMessages, nextLogs, nextWriteups, nextProjects, nextAchievements, nextProfile] = await Promise.all([
          fetchJson<SecureMessageRecord[]>("/api/admin/messages"),
          fetchJson<AccessLogRecord[]>("/api/admin/logs"),
          fetchJson<WriteupRecord[]>("/api/admin/writeups"),
          fetchJson<ProjectRecord[]>("/api/admin/projects"),
          fetchJson<AchievementRecord[]>("/api/admin/achievements"),
          fetchJson<ProfileSettingsRecord>("/api/admin/profile"),
        ])

        setMessages(nextMessages || [])
        setLogs(nextLogs || [])
        setWriteups(nextWriteups || [])
        setProjects(nextProjects || [])
        setAchievements(nextAchievements || [])
        setProfileForm(toProfileFormState(nextProfile))
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load admin data."

        if (message === "Unauthorized.") {
          handleUnauthorized()

          if (!options?.silentUnauthorized) {
            toast({
              variant: "destructive",
              title: "Session expired",
              description: "Authenticate again to continue.",
            })
          }

          return false
        }

        toast({
          variant: "destructive",
          title: "Load failed",
          description: message,
        })
        return false
      } finally {
        setIsDataLoading(false)
      }
    },
    [handleUnauthorized, toast]
  )

  React.useEffect(() => {
    let isActive = true

    const bootstrap = async () => {
      try {
        const session = await fetchJson<{ authenticated: true; username: string }>("/api/auth/me")

        if (!isActive) {
          return
        }

        setIsAuthenticated(true)
        setUsername(session.username || "")
        await loadDashboardData({ silentUnauthorized: true })
      } catch {
        if (isActive) {
          handleUnauthorized()
        }
      } finally {
        if (isActive) {
          setIsAuthLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      isActive = false
    }
  }, [handleUnauthorized, loadDashboardData])

  React.useEffect(() => {
    setWriteupDrafts(readDraftCollectionFromStorage<WriteupFormState>("writeup"))
    setProjectDrafts(readDraftCollectionFromStorage<ProjectFormState>("project"))
    setAchievementDrafts(readDraftCollectionFromStorage<AchievementFormState>("achievement"))
  }, [])

  const getDraftDisplayName = React.useCallback(
    (
      kind: DraftKind,
      draft:
        | LocalDraft<WriteupFormState>
        | LocalDraft<ProjectFormState>
        | LocalDraft<AchievementFormState>
    ) => {
      const rawName =
        kind === "writeup"
          ? (draft as LocalDraft<WriteupFormState>).data.title
          : kind === "project"
            ? (draft as LocalDraft<ProjectFormState>).data.title
            : (draft as LocalDraft<AchievementFormState>).data.title

      const safeName = (rawName || "").trim() || "unknown"
      const safeDate = format(new Date(draft.updatedAt), "yyyyMMdd-HHmm")
      return `Draft-${safeName}-${safeDate}`
    },
    []
  )

  React.useEffect(() => {
    if (!editMode || !activeDraftId) {
      return
    }

    const draftData =
      editMode === "writeup"
        ? writeupForm
        : editMode === "project"
          ? projectForm
          : achievementForm

    const snapshot = JSON.stringify(draftData)
    if (draftSnapshotRef.current === snapshot) {
      return
    }

    setSaveIndicator("unsaved")

    if (draftAutosaveTimerRef.current) {
      window.clearTimeout(draftAutosaveTimerRef.current)
    }

    draftAutosaveTimerRef.current = window.setTimeout(() => {
      setSaveIndicator("saving")

      const draftEntry = {
        id: activeDraftId,
        updatedAt: new Date().toISOString(),
        data: draftData,
      }

      if (editMode === "writeup") {
        setWriteupDrafts(upsertDraftInStorage("writeup", draftEntry as LocalDraft<WriteupFormState>))
      } else if (editMode === "project") {
        setProjectDrafts(upsertDraftInStorage("project", draftEntry as LocalDraft<ProjectFormState>))
      } else {
        setAchievementDrafts(
          upsertDraftInStorage("achievement", draftEntry as LocalDraft<AchievementFormState>)
        )
      }

      draftSnapshotRef.current = snapshot
      setSaveIndicator("saved")
    }, 1000)

    return () => {
      if (draftAutosaveTimerRef.current) {
        window.clearTimeout(draftAutosaveTimerRef.current)
      }
    }
  }, [activeDraftId, editMode, writeupForm, projectForm, achievementForm])

  const uploadAsset = React.useCallback(
    async (
      file: File,
      options?: { showSuccessToast?: boolean; requireImage?: boolean; successTitle?: string }
    ) => {
      if (options?.requireImage && !file.type.startsWith("image/")) {
        const message = "Only image files are allowed."
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: message,
        })
        throw new Error(message)
      }

      const formData = new FormData()
      formData.append("file", file)

      try {
        const payload = await fetchJson<UploadAssetResponse>("/api/admin/upload", {
          method: "POST",
          body: formData,
        })

        if (options?.showSuccessToast ?? true) {
          toast({
            title: options?.successTitle ?? "File uploaded",
            description: `Stored as ${payload.assetName}.`,
          })
        }

        return payload
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not upload file."

        if (message === "Unauthorized.") {
          handleUnauthorized()
          toast({
            variant: "destructive",
            title: "Session expired",
            description: "Authenticate again to continue.",
          })
          throw new Error(message)
        }

        toast({
          variant: "destructive",
          title: "Upload failed",
          description: message,
        })
        throw error instanceof Error ? error : new Error(message)
      }
    },
    [handleUnauthorized, toast]
  )

  const uploadImageAsset = React.useCallback(
    async (file: File, options?: { showSuccessToast?: boolean }) => {
      const payload = await uploadAsset(file, {
        showSuccessToast: options?.showSuccessToast,
        requireImage: true,
        successTitle: "Image uploaded",
      })
      return payload.url
    },
    [uploadAsset]
  )

  const uploadAttachmentAsset = React.useCallback(
    async (file: File, options?: { showSuccessToast?: boolean }) => {
      const payload = await uploadAsset(file, {
        showSuccessToast: options?.showSuccessToast,
        successTitle: "Attachment uploaded",
      })

      return {
        name: payload.assetName || file.name,
        url: payload.url,
        contentType: payload.contentType || file.type || "",
      } as AttachmentFormState
    },
    [uploadAsset]
  )

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const imageUrl = await uploadImageAsset(file, { showSuccessToast: true })
      setter(imageUrl)
    } catch {
    }
  }

  const handleAttachmentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "writeup" | "project" | "achievement"
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const attachment = await uploadAttachmentAsset(file, { showSuccessToast: true })

      if (target === "writeup") {
        setWriteupForm((prev) => ({ ...prev, attachments: [...prev.attachments, attachment] }))
        return
      }

      if (target === "project") {
        setProjectForm((prev) => ({ ...prev, attachments: [...prev.attachments, attachment] }))
        return
      }

      setAchievementForm((prev) => ({ ...prev, attachments: [...prev.attachments, attachment] }))
    } catch {
    }
  }

  const removeAttachment = (
    target: "writeup" | "project" | "achievement",
    attachmentIndex: number
  ) => {
    if (target === "writeup") {
      setWriteupForm((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((_, index) => index !== attachmentIndex),
      }))
      return
    }

    if (target === "project") {
      setProjectForm((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((_, index) => index !== attachmentIndex),
      }))
      return
    }

    setAchievementForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, index) => index !== attachmentIndex),
    }))
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoginLoading(true)

    try {
      const response = await fetchJson<{ ok: true; username: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })

      setIsAuthenticated(true)
      setUsername(response.username || "")
      setPassword("")

      const didLoad = await loadDashboardData()
      if (didLoad) {
        toast({ title: "Access granted", description: "Server-side session established successfully." })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: error instanceof Error ? error.message : "Invalid credentials signal.",
      })
    } finally {
      setIsAuthLoading(false)
      setIsLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetchJson<{ ok: true }>("/api/auth/logout", { method: "POST" })
    } catch {
    } finally {
      handleUnauthorized()
      toast({ title: "Session closed", description: "Admin cookie removed from the server session." })
    }
  }

  const beginCreateWriteup = () => {
    setEditMode("writeup")
    setEditingId(null)
    setActiveDraftId(crypto.randomUUID())
    const emptyForm = createEmptyWriteupForm()
    setWriteupForm(emptyForm)
    setWriteupListTab("drafts")
    setSaveIndicator("saved")
    draftSnapshotRef.current = JSON.stringify(emptyForm)
  }

  const beginEditWriteup = (writeup: WriteupRecord) => {
    setEditMode("writeup")
    setEditingId(writeup.id)
    setActiveDraftId(null)
    setSaveIndicator("saved")
    setWriteupListTab("published")

    setWriteupForm({
      title: writeup.title || "",
      competition: writeup.competition || "",
      category: writeup.category || "Web",
      difficulty: writeup.difficulty || "Medium",
      date: writeup.date || format(new Date(), "yyyy-MM-dd"),
      summary: writeup.summary || "",
      content: writeup.content || "",
      flag: writeup.flag || "",
      tags: (writeup.tags || []).join(", "),
      attachments: toAttachmentFormState(writeup.attachments),
    })

    draftSnapshotRef.current = ""
  }

  const beginEditWriteupDraft = (draft: LocalDraft<WriteupFormState>) => {
    setEditMode("writeup")
    setEditingId(null)
    setActiveDraftId(draft.id)
    setWriteupListTab("drafts")
    setWriteupForm(draft.data)
    setSaveIndicator("saved")
    draftSnapshotRef.current = JSON.stringify(draft.data)
  }

  const beginCreateProject = () => {
    setEditMode("project")
    setEditingId(null)
    setActiveDraftId(crypto.randomUUID())
    setImageSource("url")
    const emptyForm = createEmptyProjectForm()
    setProjectForm(emptyForm)
    setProjectListTab("drafts")
    setSaveIndicator("saved")
    draftSnapshotRef.current = JSON.stringify(emptyForm)
  }

  const beginEditProject = (project: ProjectRecord) => {
    setEditMode("project")
    setEditingId(project.id)
    setActiveDraftId(null)
    setSaveIndicator("saved")
    setProjectListTab("published")
    setImageSource("url")
    setProjectForm({
      title: project.title || "",
      description: project.description || "",
      imageUrl: project.imageUrl || "",
      projectUrl: project.projectUrl || "",
      category: project.category || "Security Tooling",
      tags: (project.tags || []).join(", "),
      attachments: toAttachmentFormState(project.attachments),
    })
    draftSnapshotRef.current = ""
  }

  const beginEditProjectDraft = (draft: LocalDraft<ProjectFormState>) => {
    setEditMode("project")
    setEditingId(null)
    setActiveDraftId(draft.id)
    setProjectListTab("drafts")
    setImageSource("url")
    setProjectForm(draft.data)
    setSaveIndicator("saved")
    draftSnapshotRef.current = JSON.stringify(draft.data)
  }

  const beginCreateAchievement = () => {
    setEditMode("achievement")
    setEditingId(null)
    setActiveDraftId(crypto.randomUUID())
    setImageSource("url")
    const emptyForm = createEmptyAchievementForm()
    setAchievementForm(emptyForm)
    setAchievementListTab("drafts")
    setSaveIndicator("saved")
    draftSnapshotRef.current = JSON.stringify(emptyForm)
  }

  const beginEditAchievement = (achievement: AchievementRecord) => {
    setEditMode("achievement")
    setEditingId(achievement.id)
    setActiveDraftId(null)
    setSaveIndicator("saved")
    setAchievementListTab("published")
    setImageSource("url")

    setAchievementForm({
      title: achievement.title || "",
      issuer: achievement.issuer || "",
      platform: achievement.platform || "",
      description: achievement.description || "",
      imageUrl: achievement.imageUrl || "",
      date: achievement.date || format(new Date(), "yyyy-MM-dd"),
      attachments: toAttachmentFormState(achievement.attachments),
    })

    draftSnapshotRef.current = ""
  }

  const beginEditAchievementDraft = (draft: LocalDraft<AchievementFormState>) => {
    setEditMode("achievement")
    setEditingId(null)
    setActiveDraftId(draft.id)
    setAchievementListTab("drafts")
    setImageSource("url")
    setAchievementForm(draft.data)
    setSaveIndicator("saved")
    draftSnapshotRef.current = JSON.stringify(draft.data)
  }

  const saveWriteup = async () => {
    const payload = {
      ...writeupForm,
      tags: writeupForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      attachments: normalizeAttachmentPayload(writeupForm.attachments),
    }
    const currentDraftId = activeDraftId

    try {
      if (editingId) {
        await fetchJson<{ ok: true }>(`/api/admin/writeups/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      } else {
        await fetchJson<{ id: string }>("/api/admin/writeups", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      if (currentDraftId) {
        removeDraftFromStorage("writeup", currentDraftId)
        setWriteupDrafts(readDraftCollectionFromStorage<WriteupFormState>("writeup"))
      }

      toast({ title: editingId ? "Write-up saved" : "Write-up published" })
      closeEditor()
      setWriteupForm(createEmptyWriteupForm())
      setWriteupListTab("published")
      await loadDashboardData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Write-up save failed",
        description: error instanceof Error ? error.message : "Unable to persist the write-up.",
      })
    }
  }

  const saveProject = async () => {
    const payload = {
      ...projectForm,
      tags: projectForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      attachments: normalizeAttachmentPayload(projectForm.attachments),
    }

    const currentDraftId = activeDraftId

    try {
      if (editingId) {
        await fetchJson<{ ok: true }>(`/api/admin/projects/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      } else {
        await fetchJson<{ id: string }>("/api/admin/projects", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      if (currentDraftId) {
        removeDraftFromStorage("project", currentDraftId)
        setProjectDrafts(readDraftCollectionFromStorage<ProjectFormState>("project"))
      }

      toast({ title: editingId ? "Project saved" : "Project published" })
      closeEditor()
      setProjectForm(createEmptyProjectForm())
      setImageSource("url")
      setProjectListTab("published")
      await loadDashboardData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Project save failed",
        description: error instanceof Error ? error.message : "Unable to persist the project.",
      })
    }
  }

  const saveAchievement = async () => {
    const payload = {
      ...achievementForm,
      attachments: normalizeAttachmentPayload(achievementForm.attachments),
    }
    const currentDraftId = activeDraftId

    try {
      if (editingId) {
        await fetchJson<{ ok: true }>(`/api/admin/achievements/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      } else {
        await fetchJson<{ id: string }>("/api/admin/achievements", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      if (currentDraftId) {
        removeDraftFromStorage("achievement", currentDraftId)
        setAchievementDrafts(readDraftCollectionFromStorage<AchievementFormState>("achievement"))
      }

      toast({ title: editingId ? "Achievement saved" : "Achievement published" })
      closeEditor()
      setAchievementForm(createEmptyAchievementForm())
      setImageSource("url")
      setAchievementListTab("published")
      await loadDashboardData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Achievement save failed",
        description: error instanceof Error ? error.message : "Unable to persist the achievement.",
      })
    }
  }

  const closeEditor = () => {
    setEditMode(null)
    setEditingId(null)
    setActiveDraftId(null)
    setSaveIndicator("saved")
    draftSnapshotRef.current = ""
  }

  const deleteLocalDraft = (kind: DraftKind, draftId: string) => {
    removeDraftFromStorage(kind, draftId)

    if (kind === "writeup") {
      setWriteupDrafts(readDraftCollectionFromStorage<WriteupFormState>("writeup"))
    } else if (kind === "project") {
      setProjectDrafts(readDraftCollectionFromStorage<ProjectFormState>("project"))
    } else {
      setAchievementDrafts(readDraftCollectionFromStorage<AchievementFormState>("achievement"))
    }

    if (activeDraftId === draftId) {
      closeEditor()
    }
  }

  const exportDrafts = (kind: DraftKind) => {
    const drafts =
      kind === "writeup"
        ? writeupDrafts
        : kind === "project"
          ? projectDrafts
          : achievementDrafts

    const payload: DraftExportPayload<WriteupFormState | ProjectFormState | AchievementFormState> = {
      version: 1,
      kind,
      exportedAt: new Date().toISOString(),
      drafts,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const objectUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = `${kind}-drafts-${format(new Date(), "yyyyMMdd-HHmmss")}.json`
    anchor.click()
    window.URL.revokeObjectURL(objectUrl)

    toast({
      title: "Draft export complete",
      description: `${drafts.length} ${kind} draft(s) exported as JSON.`,
    })
  }

  const mergeImportedDrafts = <T,>(kind: DraftKind, importedDrafts: LocalDraft<T>[]) => {
    const currentDrafts = readDraftCollectionFromStorage<T>(kind)
    const draftById = new Map<string, LocalDraft<T>>()

    for (const draft of currentDrafts) {
      draftById.set(draft.id, draft)
    }

    for (const importedDraft of importedDrafts) {
      const existing = draftById.get(importedDraft.id)
      if (!existing) {
        draftById.set(importedDraft.id, importedDraft)
        continue
      }

      const existingTime = new Date(existing.updatedAt).getTime()
      const importedTime = new Date(importedDraft.updatedAt).getTime()
      if (importedTime >= existingTime) {
        draftById.set(importedDraft.id, importedDraft)
      }
    }

    const mergedDrafts = Array.from(draftById.values()).sort((left, right) => {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    })

    writeDraftCollectionToStorage(kind, mergedDrafts)
    return mergedDrafts
  }

  const handleImportDrafts = async (
    kind: DraftKind,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) {
      return
    }

    let parsedPayload: unknown

    try {
      parsedPayload = JSON.parse(await file.text())
    } catch {
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "The selected file is not valid JSON.",
      })
      return
    }

    const parsedResult =
      kind === "writeup"
        ? parseDraftCollectionImport(kind, parsedPayload, parseWriteupDraftData)
        : kind === "project"
          ? parseDraftCollectionImport(kind, parsedPayload, parseProjectDraftData)
          : parseDraftCollectionImport(kind, parsedPayload, parseAchievementDraftData)

    if (!parsedResult.ok) {
      toast({
        variant: "destructive",
        title: "Draft JSON verification failed",
        description: parsedResult.message,
      })
      return
    }

    if (kind === "writeup") {
      const mergedDrafts = mergeImportedDrafts("writeup", parsedResult.drafts as LocalDraft<WriteupFormState>[])
      setWriteupDrafts(mergedDrafts)
    } else if (kind === "project") {
      const mergedDrafts = mergeImportedDrafts("project", parsedResult.drafts as LocalDraft<ProjectFormState>[])
      setProjectDrafts(mergedDrafts)
    } else {
      const mergedDrafts = mergeImportedDrafts(
        "achievement",
        parsedResult.drafts as LocalDraft<AchievementFormState>[]
      )
      setAchievementDrafts(mergedDrafts)
    }

    toast({
      title: "Draft JSON verified",
      description: `${parsedResult.drafts.length} ${kind} draft(s) imported safely.`,
    })
  }

  const openImportPicker = (kind: DraftKind) => {
    if (kind === "writeup") {
      writeupImportInputRef.current?.click()
      return
    }

    if (kind === "project") {
      projectImportInputRef.current?.click()
      return
    }

    achievementImportInputRef.current?.click()
  }

  const saveIndicatorText = activeDraftId ? `Save: ${saveIndicator}` : "Save: manual"

  const addTechnicalArsenalItem = () => {
    setProfileForm((prev) => ({
      ...prev,
      technicalArsenal: [...prev.technicalArsenal, { name: "", level: 50 }],
    }))
  }

  const updateTechnicalArsenalItem = (
    index: number,
    patch: Partial<TechnicalArsenalFormState>
  ) => {
    setProfileForm((prev) => ({
      ...prev,
      technicalArsenal: prev.technicalArsenal.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }))
  }

  const removeTechnicalArsenalItem = (index: number) => {
    setProfileForm((prev) => ({
      ...prev,
      technicalArsenal: prev.technicalArsenal.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const addProfessionalJourneyItem = () => {
    setProfileForm((prev) => ({
      ...prev,
      professionalJourney: [
        ...prev.professionalJourney,
        { role: "", company: "", period: "", desc: "" },
      ],
    }))
  }

  const updateProfessionalJourneyItem = (
    index: number,
    patch: Partial<ProfessionalJourneyFormState>
  ) => {
    setProfileForm((prev) => ({
      ...prev,
      professionalJourney: prev.professionalJourney.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }))
  }

  const removeProfessionalJourneyItem = (index: number) => {
    setProfileForm((prev) => ({
      ...prev,
      professionalJourney: prev.professionalJourney.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const addEducationHistoryItem = () => {
    setProfileForm((prev) => ({
      ...prev,
      educationHistory: [...prev.educationHistory, { level: "", school: "", period: "" }],
    }))
  }

  const updateEducationHistoryItem = (
    index: number,
    patch: Partial<EducationHistoryFormState>
  ) => {
    setProfileForm((prev) => ({
      ...prev,
      educationHistory: prev.educationHistory.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }))
  }

  const removeEducationHistoryItem = (index: number) => {
    setProfileForm((prev) => ({
      ...prev,
      educationHistory: prev.educationHistory.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const saveProfile = async () => {
    const payloadToPersist = mergeProfileSettings(getDefaultProfileSettings(), {
      ...profileForm,
      technicalArsenal: profileForm.technicalArsenal.map((item) => ({
        name: item.name,
        level: Number.isFinite(item.level) ? item.level : 0,
      })),
      professionalJourney: profileForm.professionalJourney.map((item) => ({
        role: item.role,
        company: item.company,
        period: item.period,
        desc: item.desc,
      })),
      educationHistory: profileForm.educationHistory.map((item) => ({
        level: item.level,
        school: item.school,
        period: item.period,
      })),
      seo: {
        titleTemplate: profileForm.seo.titleTemplate,
        defaultTitle: profileForm.seo.defaultTitle,
        description: profileForm.seo.description,
        canonicalUrl: profileForm.seo.canonicalUrl,
        previewImageUrl: profileForm.seo.previewImageUrl,
        siteName: profileForm.seo.siteName,
        locale: profileForm.seo.locale,
        jobTitle: profileForm.seo.jobTitle,
        keywords: parseCommaSeparatedValues(profileForm.seo.keywordsText),
        sameAs: parseCommaSeparatedValues(profileForm.seo.sameAsText),
      },
    })

    try {
      const payload = await fetchJson<ProfileSettingsRecord>("/api/admin/profile", {
        method: "PUT",
        body: JSON.stringify(payloadToPersist),
      })

      setProfileForm(toProfileFormState(payload))
      toast({ title: "Profile updated" })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Profile save failed",
        description: error instanceof Error ? error.message : "Unable to persist profile settings.",
      })
    }
  }

  const triggerDelete = (id: string, collection: DeleteCollection) => {
    setItemToDelete({ id, collection })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) {
      return
    }

    try {
      await fetchJson<{ ok: true }>(`${adminCollectionRoutes[itemToDelete.collection]}/${itemToDelete.id}`, {
        method: "DELETE",
      })

      toast({ title: "Record purged" })
      setDeleteDialogOpen(false)
      setItemToDelete(null)

      if (editingId === itemToDelete.id) {
        closeEditor()
      }

      await loadDashboardData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unable to remove the record.",
      })
    }
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-code text-sm uppercase tracking-widest">Validating server session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md relative rounded-xl border border-border p-1">
          <GlowingEffect spread={40} glow={true} disabled={false} />
          <Card className="relative bg-card border-none">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-headline font-bold text-2xl">Secure Entry</CardTitle>
              <p className="text-sm text-muted-foreground font-code">Authentication Required</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-code uppercase">Identifier</Label>
                  <Input placeholder="Username" value={username || ""} onChange={(event) => setUsername(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-code uppercase">Security Key</Label>
                  <Input type="password" placeholder="Password" value={password || ""} onChange={(event) => setPassword(event.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-primary font-bold" disabled={isLoginLoading}>
                  {isLoginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "AUTHORIZE ACCESS"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-headline font-bold">Admin Panel</h1>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-muted rounded border text-xs font-code uppercase">User: {username}</div>
          <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="messages" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted border border-border p-1 h-auto mb-8 flex flex-wrap justify-start">
          <TabsTrigger value="messages" className="px-6 py-2"><MessageSquare className="h-4 w-4 mr-2" /> Messages</TabsTrigger>
          <TabsTrigger value="writeups" className="px-6 py-2"><Database className="h-4 w-4 mr-2" /> Write-ups</TabsTrigger>
          <TabsTrigger value="projects" className="px-6 py-2"><Cpu className="h-4 w-4 mr-2" /> Projects</TabsTrigger>
          <TabsTrigger value="achievements" className="px-6 py-2"><Award className="h-4 w-4 mr-2" /> Achievements</TabsTrigger>
          <TabsTrigger value="profile" className="px-6 py-2"><User className="h-4 w-4 mr-2" /> Profile</TabsTrigger>
          <TabsTrigger value="logs" className="px-6 py-2"><History className="h-4 w-4 mr-2" /> Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isDataLoading ? (
              <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
            ) : messages.length ? (
              messages.map((message) => (
                <Card key={message.id} className="bg-background/50 border-border">
                  <CardHeader className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <CardTitle className="text-lg text-primary break-words">{message.title || "No Title"}</CardTitle>
                        <CardDescription className="text-[10px] font-code">
                          {message.username || "Anonymous"} • {message.createdAt ? format(new Date(message.createdAt), "yy-MM-dd HH:mm") : "Unknown timestamp"}
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => triggerDelete(message.id, "messages")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="py-4 pt-0 text-sm text-muted-foreground whitespace-pre-wrap">{message.content || "No Content"}</CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-center py-20 text-muted-foreground">No signals detected.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="writeups">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <Button type="button" onClick={beginCreateWriteup} className="w-full bg-primary/20 text-primary border border-primary/30">
                <Plus className="h-4 w-4 mr-2" /> New Write-up
              </Button>
              <Tabs value={writeupListTab} onValueChange={(value) => setWriteupListTab(value as "published" | "drafts")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                </TabsList>
                <TabsContent value="published">
                  <ScrollArea className="h-[560px] border rounded-lg bg-card/30">
                    <div className="p-4 space-y-2">
                      {isDataLoading ? (
                        <Loader2 className="animate-spin mx-auto mt-10" />
                      ) : (
                        writeups.map((writeup) => (
                          <div
                            key={writeup.id}
                            className={cn("p-3 rounded-lg border flex justify-between group items-center cursor-pointer", editingId === writeup.id ? "bg-primary/10 border-primary/50" : "bg-card border-border/50")}
                            onClick={() => beginEditWriteup(writeup)}
                          >
                            <div className="truncate">
                              <p className="text-sm font-bold truncate">{writeup.title || "Untitled"}</p>
                              <p className="text-[10px] text-muted-foreground">{writeup.competition || "No Competition"}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); triggerDelete(writeup.id, "ctfWriteups") }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="drafts">
                  <div className="flex items-center gap-2 pb-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => exportDrafts("writeup")}>
                      <Download className="h-4 w-4 mr-2" /> Export JSON
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => openImportPicker("writeup")}>
                      <Upload className="h-4 w-4 mr-2" /> Import JSON
                    </Button>
                    <Input
                      ref={writeupImportInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(event) => void handleImportDrafts("writeup", event)}
                    />
                  </div>
                  <ScrollArea className="h-[560px] border rounded-lg bg-card/30">
                    <div className="p-4 space-y-2">
                      {writeupDrafts.length ? (
                        writeupDrafts.map((draft) => (
                          <div
                            key={draft.id}
                            className={cn("p-3 rounded-lg border flex justify-between group items-center cursor-pointer", activeDraftId === draft.id && editMode === "writeup" ? "bg-primary/10 border-primary/50" : "bg-card border-border/50")}
                            onClick={() => beginEditWriteupDraft(draft)}
                          >
                            <div className="truncate">
                              <p className="text-sm font-bold truncate">{getDraftDisplayName("writeup", draft)}</p>
                              <p className="text-[10px] text-muted-foreground">Local draft</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); deleteLocalDraft("writeup", draft.id) }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No drafts yet.</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
            <div className="lg:col-span-8">
              {editMode === "writeup" ? (
                <Card className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={writeupForm.title || ""} onChange={(event) => setWriteupForm({ ...writeupForm, title: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Competition</Label><Input value={writeupForm.competition || ""} onChange={(event) => setWriteupForm({ ...writeupForm, competition: event.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={writeupForm.category || "Web"} onValueChange={(value) => setWriteupForm({ ...writeupForm, category: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["Web", "Pwn", "Crypto", "Reverse", "Forensics"].map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Difficulty</Label><Select value={writeupForm.difficulty || "Medium"} onValueChange={(value) => setWriteupForm({ ...writeupForm, difficulty: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Easy", "Medium", "Hard"].map((difficulty) => <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Date</Label><Input type="date" value={writeupForm.date || ""} onChange={(event) => setWriteupForm({ ...writeupForm, date: event.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Flag</Label><Input value={writeupForm.flag || ""} onChange={(event) => setWriteupForm({ ...writeupForm, flag: event.target.value })} className="font-code text-primary" /></div>
                  <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={writeupForm.tags || ""} onChange={(event) => setWriteupForm({ ...writeupForm, tags: event.target.value })} /></div>
                  <div className="space-y-2"><Label>Summary</Label><Textarea value={writeupForm.summary || ""} onChange={(event) => setWriteupForm({ ...writeupForm, summary: event.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Documentation Content</Label>
                    <RichEditor 
                      content={writeupForm.content} 
                      onChange={(html) => setWriteupForm({ ...writeupForm, content: html })} 
                      onImageUpload={(file) => uploadImageAsset(file, { showSuccessToast: true })}
                    />
                  </div>
                  <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Challenge Attachments</Label>
                      <Input
                        type="file"
                        onChange={(event) => handleAttachmentUpload(event, "writeup")}
                        className="max-w-xs"
                      />
                    </div>
                    {writeupForm.attachments.length ? (
                      <div className="space-y-2">
                        {writeupForm.attachments.map((attachment, index) => (
                          <div
                            key={`${attachment.url}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/70 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline break-all"
                              >
                                {attachment.name || `Attachment ${index + 1}`}
                              </a>
                              {attachment.contentType ? (
                                <p className="text-[10px] text-muted-foreground">{attachment.contentType}</p>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAttachment("writeup", index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No challenge attachments uploaded.</p>
                    )}
                  </div>
                  <div className="flex justify-between gap-2">
                    {editingId && (
                      <Button type="button" variant="destructive" onClick={() => triggerDelete(editingId, "ctfWriteups")}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <div className="flex items-center px-3 text-xs text-muted-foreground">{saveIndicatorText}</div>
                      <Button type="button" variant="outline" onClick={closeEditor}>Cancel</Button>
                      <Button type="button" onClick={saveWriteup}><Save className="h-4 w-4 mr-2" /> {editingId ? "Save" : "Publish"}</Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-20 text-center"><Database className="h-10 w-10 mb-4 opacity-20" /><p>Select a write-up node to edit or create a new entry.</p></div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <Button type="button" onClick={beginCreateProject} className="w-full bg-primary/20 text-primary border border-primary/30">
                <Plus className="h-4 w-4 mr-2" /> New Project
              </Button>
              <Tabs value={projectListTab} onValueChange={(value) => setProjectListTab(value as "published" | "drafts")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                </TabsList>
                <TabsContent value="published">
                  <ScrollArea className="h-[560px] border rounded-lg bg-card/30">
                    <div className="p-4 space-y-2">
                      {isDataLoading ? (
                        <Loader2 className="animate-spin mx-auto mt-10" />
                      ) : (
                        projects.map((project) => (
                          <div
                            key={project.id}
                            className={cn("p-3 rounded-lg border flex justify-between group items-center cursor-pointer", editingId === project.id ? "bg-primary/10 border-primary/50" : "bg-card border-border/50")}
                            onClick={() => beginEditProject(project)}
                          >
                            <div className="truncate">
                              <p className="text-sm font-bold truncate">{project.title || "Untitled"}</p>
                              <p className="text-[10px] text-muted-foreground">{project.category || "General"}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); triggerDelete(project.id, "projects") }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="drafts">
                  <div className="flex items-center gap-2 pb-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => exportDrafts("project")}>
                      <Download className="h-4 w-4 mr-2" /> Export JSON
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => openImportPicker("project")}>
                      <Upload className="h-4 w-4 mr-2" /> Import JSON
                    </Button>
                    <Input
                      ref={projectImportInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(event) => void handleImportDrafts("project", event)}
                    />
                  </div>
                  <ScrollArea className="h-[560px] border rounded-lg bg-card/30">
                    <div className="p-4 space-y-2">
                      {projectDrafts.length ? (
                        projectDrafts.map((draft) => (
                          <div
                            key={draft.id}
                            className={cn("p-3 rounded-lg border flex justify-between group items-center cursor-pointer", activeDraftId === draft.id && editMode === "project" ? "bg-primary/10 border-primary/50" : "bg-card border-border/50")}
                            onClick={() => beginEditProjectDraft(draft)}
                          >
                            <div className="truncate">
                              <p className="text-sm font-bold truncate">{getDraftDisplayName("project", draft)}</p>
                              <p className="text-[10px] text-muted-foreground">Local draft</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); deleteLocalDraft("project", draft.id) }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No drafts yet.</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
            <div className="lg:col-span-8">
              {editMode === "project" ? (
                <Card className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Project Title</Label><Input value={projectForm.title || ""} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Category</Label><Input value={projectForm.category || ""} onChange={(event) => setProjectForm({ ...projectForm, category: event.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Project URL (GitHub/Live Demo)</Label><Input placeholder="https://github.com/..." value={projectForm.projectUrl || ""} onChange={(event) => setProjectForm({ ...projectForm, projectUrl: event.target.value })} /></div>
                  <div className="space-y-4 border-y py-4 my-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-bold text-primary">Media Asset</Label>
                      <div className="flex bg-muted p-1 rounded-md">
                        <Button type="button" size="sm" variant={imageSource === "url" ? "default" : "ghost"} onClick={() => setImageSource("url")} className="h-7 text-[10px]"><LinkIcon className="h-3 w-3 mr-1" /> URL</Button>
                        <Button type="button" size="sm" variant={imageSource === "upload" ? "default" : "ghost"} onClick={() => setImageSource("upload")} className="h-7 text-[10px]"><ImageIcon className="h-3 w-3 mr-1" /> UPLOAD</Button>
                      </div>
                    </div>
                    {imageSource === "url" ? (
                      <Input placeholder="https://..." value={projectForm.imageUrl || ""} onChange={(event) => setProjectForm({ ...projectForm, imageUrl: event.target.value })} />
                    ) : (
                      <div className="space-y-2">
                        <Input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, (url) => setProjectForm({ ...projectForm, imageUrl: url }))} className="cursor-pointer" />
                        <p className="text-[10px] text-muted-foreground">
                          Note: Images are uploaded to the local uploads folder and served from /api/public/uploads/*.
                        </p>
                      </div>
                    )}
                    {projectForm.imageUrl && (
                      <div className="mt-2 h-24 w-40 relative rounded border-2 border-primary/20 overflow-hidden bg-black/50">
                        <img src={projectForm.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2"><Label>Technical Description</Label><Textarea value={projectForm.description || ""} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} className="min-h-[120px]" /></div>
                  <div className="space-y-2"><Label>Stack Tags (comma separated)</Label><Input value={projectForm.tags || ""} onChange={(event) => setProjectForm({ ...projectForm, tags: event.target.value })} placeholder="React, Rust, Cryptography" /></div>
                  <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Project Attachments</Label>
                      <Input
                        type="file"
                        onChange={(event) => handleAttachmentUpload(event, "project")}
                        className="max-w-xs"
                      />
                    </div>
                    {projectForm.attachments.length ? (
                      <div className="space-y-2">
                        {projectForm.attachments.map((attachment, index) => (
                          <div
                            key={`${attachment.url}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/70 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline break-all"
                              >
                                {attachment.name || `Attachment ${index + 1}`}
                              </a>
                              {attachment.contentType ? (
                                <p className="text-[10px] text-muted-foreground">{attachment.contentType}</p>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAttachment("project", index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No project attachments uploaded.</p>
                    )}
                  </div>
                  <div className="flex justify-between gap-2">
                    {editingId && (
                      <Button type="button" variant="destructive" onClick={() => triggerDelete(editingId, "projects")}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <div className="flex items-center px-3 text-xs text-muted-foreground">{saveIndicatorText}</div>
                      <Button type="button" variant="outline" onClick={closeEditor}>Cancel</Button>
                      <Button type="button" onClick={saveProject}><Save className="h-4 w-4 mr-2" /> {editingId ? "Save Project" : "Publish Project"}</Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-20 text-center"><Cpu className="h-10 w-10 mb-4 opacity-20" /><p>Select a project node or create a new showcase asset.</p></div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <Button type="button" onClick={beginCreateAchievement} className="w-full bg-primary/20 text-primary border border-primary/30">
                <Plus className="h-4 w-4 mr-2" /> New Achievement
              </Button>
              <Tabs value={achievementListTab} onValueChange={(value) => setAchievementListTab(value as "published" | "drafts")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                </TabsList>
                <TabsContent value="published">
                  <ScrollArea className="h-[560px] border rounded-lg bg-card/30">
                    <div className="p-4 space-y-2">
                      {isDataLoading ? (
                        <Loader2 className="animate-spin mx-auto mt-10" />
                      ) : (
                        achievements.map((achievement) => (
                          <div
                            key={achievement.id}
                            className={cn("p-3 rounded-lg border flex justify-between group items-center cursor-pointer", editingId === achievement.id ? "bg-primary/10 border-primary/50" : "bg-card border-border/50")}
                            onClick={() => beginEditAchievement(achievement)}
                          >
                            <div className="truncate">
                              <p className="text-sm font-bold truncate">{achievement.title || "Untitled"}</p>
                              <p className="text-[10px] text-muted-foreground">{achievement.issuer || "No Issuer"}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); triggerDelete(achievement.id, "achievements") }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="drafts">
                  <div className="flex items-center gap-2 pb-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => exportDrafts("achievement")}>
                      <Download className="h-4 w-4 mr-2" /> Export JSON
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => openImportPicker("achievement")}>
                      <Upload className="h-4 w-4 mr-2" /> Import JSON
                    </Button>
                    <Input
                      ref={achievementImportInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(event) => void handleImportDrafts("achievement", event)}
                    />
                  </div>
                  <ScrollArea className="h-[560px] border rounded-lg bg-card/30">
                    <div className="p-4 space-y-2">
                      {achievementDrafts.length ? (
                        achievementDrafts.map((draft) => (
                          <div
                            key={draft.id}
                            className={cn("p-3 rounded-lg border flex justify-between group items-center cursor-pointer", activeDraftId === draft.id && editMode === "achievement" ? "bg-primary/10 border-primary/50" : "bg-card border-border/50")}
                            onClick={() => beginEditAchievementDraft(draft)}
                          >
                            <div className="truncate">
                              <p className="text-sm font-bold truncate">{getDraftDisplayName("achievement", draft)}</p>
                              <p className="text-[10px] text-muted-foreground">Local draft</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); deleteLocalDraft("achievement", draft.id) }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No drafts yet.</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
            <div className="lg:col-span-8">
              {editMode === "achievement" ? (
                <Card className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={achievementForm.title || ""} onChange={(event) => setAchievementForm({ ...achievementForm, title: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Issuer / Organization</Label><Input value={achievementForm.issuer || ""} onChange={(event) => setAchievementForm({ ...achievementForm, issuer: event.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Platform / Category</Label><Input value={achievementForm.platform || ""} onChange={(event) => setAchievementForm({ ...achievementForm, platform: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Date Achieved</Label><Input value={achievementForm.date || ""} onChange={(event) => setAchievementForm({ ...achievementForm, date: event.target.value })} placeholder="e.g. Nov 2024" /></div>
                  </div>
                  <div className="space-y-4 border-y py-4 my-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-bold text-primary">Credential Image</Label>
                      <div className="flex bg-muted p-1 rounded-md">
                        <Button type="button" size="sm" variant={imageSource === "url" ? "default" : "ghost"} onClick={() => setImageSource("url")} className="h-7 text-[10px]"><LinkIcon className="h-3 w-3 mr-1" /> URL</Button>
                        <Button type="button" size="sm" variant={imageSource === "upload" ? "default" : "ghost"} onClick={() => setImageSource("upload")} className="h-7 text-[10px]"><ImageIcon className="h-3 w-3 mr-1" /> UPLOAD</Button>
                      </div>
                    </div>
                    {imageSource === "url" ? (
                      <Input placeholder="https://..." value={achievementForm.imageUrl || ""} onChange={(event) => setAchievementForm({ ...achievementForm, imageUrl: event.target.value })} />
                    ) : (
                      <Input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, (url) => setAchievementForm({ ...achievementForm, imageUrl: url }))} />
                    )}
                    {achievementForm.imageUrl && (
                      <div className="mt-2 h-24 w-32 relative rounded border-2 border-primary/20 overflow-hidden">
                        <img src={achievementForm.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2"><Label>Description / Context</Label><Textarea value={achievementForm.description || ""} onChange={(event) => setAchievementForm({ ...achievementForm, description: event.target.value })} /></div>
                  <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Certificate Attachments</Label>
                      <Input
                        type="file"
                        onChange={(event) => handleAttachmentUpload(event, "achievement")}
                        className="max-w-xs"
                      />
                    </div>
                    {achievementForm.attachments.length ? (
                      <div className="space-y-2">
                        {achievementForm.attachments.map((attachment, index) => (
                          <div
                            key={`${attachment.url}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/70 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline break-all"
                              >
                                {attachment.name || `Attachment ${index + 1}`}
                              </a>
                              {attachment.contentType ? (
                                <p className="text-[10px] text-muted-foreground">{attachment.contentType}</p>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAttachment("achievement", index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No certificate attachments uploaded.</p>
                    )}
                  </div>
                  <div className="flex justify-between gap-2">
                    {editingId && (
                      <Button type="button" variant="destructive" onClick={() => triggerDelete(editingId, "achievements")}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <div className="flex items-center px-3 text-xs text-muted-foreground">{saveIndicatorText}</div>
                      <Button type="button" variant="outline" onClick={closeEditor}>Cancel</Button>
                      <Button type="button" onClick={saveAchievement}><Save className="h-4 w-4 mr-2" /> {editingId ? "Save Record" : "Publish"}</Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-20 text-center"><Award className="h-10 w-10 mb-4 opacity-20" /><p>Select an achievement node or document a new milestone.</p></div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="bg-card/50">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-sm font-code flex items-center"><User className="h-4 w-4 mr-2" /> About Profile Settings</CardTitle>
              <CardDescription>Edit public identity, About details, philosophy, technical arsenal, professional journey, education history, and SEO metadata.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                  <section className="rounded-lg border border-border bg-muted/10 p-4 md:p-5">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Display Name</Label>
                          <Input
                            value={profileForm.displayName || ""}
                            onChange={(event) =>
                              setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Alias</Label>
                          <Input
                            value={profileForm.alias || ""}
                            onChange={(event) =>
                              setProfileForm((prev) => ({ ...prev, alias: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Navbar Brand Mode</Label>
                          <Select
                            value={profileForm.navbarBrandMode}
                            onValueChange={(value) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                navbarBrandMode: value === "custom" ? "custom" : "default",
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default (First Name + &apos;s)</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Navbar Brand Name (Custom)</Label>
                          <Input
                            placeholder="e.g. Claritys"
                            disabled={profileForm.navbarBrandMode !== "custom"}
                            value={profileForm.navbarBrandName || ""}
                            onChange={(event) =>
                              setProfileForm((prev) => ({ ...prev, navbarBrandName: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={profileForm.email || ""}
                            onChange={(event) =>
                              setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Website URL</Label>
                          <Input
                            value={profileForm.websiteUrl || ""}
                            onChange={(event) =>
                              setProfileForm((prev) => ({ ...prev, websiteUrl: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>GitHub URL</Label>
                          <Input
                            value={profileForm.githubUrl || ""}
                            onChange={(event) =>
                              setProfileForm((prev) => ({ ...prev, githubUrl: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Instagram URL</Label>
                          <Input
                            value={profileForm.instagramUrl || ""}
                            onChange={(event) =>
                              setProfileForm((prev) => ({ ...prev, instagramUrl: event.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Label className="font-bold text-primary">Profile Picture</Label>
                          <div className="flex bg-muted p-1 rounded-md">
                            <Button
                              type="button"
                              size="sm"
                              variant={profileImageSource === "url" ? "default" : "ghost"}
                              onClick={() => setProfileImageSource("url")}
                              className="h-7 text-[10px]"
                            >
                              <LinkIcon className="h-3 w-3 mr-1" /> URL
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={profileImageSource === "upload" ? "default" : "ghost"}
                              onClick={() => setProfileImageSource("upload")}
                              className="h-7 text-[10px]"
                            >
                              <ImageIcon className="h-3 w-3 mr-1" /> UPLOAD
                            </Button>
                          </div>
                        </div>

                        {profileImageSource === "url" ? (
                          <Input
                            placeholder="https://..."
                            value={profileForm.profileImageUrl || ""}
                            onChange={(event) =>
                              setProfileForm((prev) => ({ ...prev, profileImageUrl: event.target.value }))
                            }
                          />
                        ) : (
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                handleImageUpload(event, (url) =>
                                  setProfileForm((prev) => ({ ...prev, profileImageUrl: url }))
                                )
                              }
                            />
                            <p className="text-[10px] leading-relaxed text-muted-foreground">
                              Images are uploaded to the local uploads folder and served from /api/public/uploads/*.
                            </p>
                          </div>
                        )}

                        {profileForm.profileImageUrl ? (
                          <div className="mx-auto h-44 w-full max-w-[220px] overflow-hidden rounded-lg border border-primary/20 bg-black/40">
                            <img
                              src={profileForm.profileImageUrl}
                              alt="Profile preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3 rounded-lg border border-border bg-muted/10 p-4 md:p-5">
                    <Label>About Text</Label>
                    <Textarea
                      value={profileForm.aboutText || ""}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, aboutText: event.target.value }))
                      }
                      className="min-h-[180px]"
                    />
                  </section>

                  <section className="space-y-3 rounded-lg border border-border bg-muted/10 p-4 md:p-5">
                    <Label>Philosophy</Label>
                    <Textarea
                      value={profileForm.philosophyText || ""}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, philosophyText: event.target.value }))
                      }
                      className="min-h-[120px]"
                    />
                  </section>

                  <section className="space-y-3 rounded-lg border border-border bg-muted/10 p-4 md:p-5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Technical Arsenal</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addTechnicalArsenalItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Skill
                      </Button>
                    </div>

                    {profileForm.technicalArsenal.length ? (
                      profileForm.technicalArsenal.map((item, index) => (
                        <div key={`skill-${index}`} className="flex flex-col md:flex-row gap-3 rounded-lg border border-border bg-background/50 p-3 md:items-end">
                          <div className="space-y-2 flex-[7]">
                            <Label className="text-xs">Skill Name</Label>
                            <Input
                              value={item.name || ""}
                              onChange={(event) =>
                                updateTechnicalArsenalItem(index, { name: event.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2 flex-[3]">
                            <Label className="text-xs">Level (%)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={item.level ?? 0}
                              onChange={(event) =>
                                updateTechnicalArsenalItem(index, {
                                  level: Number(event.target.value || 0),
                                })
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeTechnicalArsenalItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No technical arsenal entries yet.</p>
                    )}
                  </section>

                  <section className="space-y-3 rounded-lg border border-border bg-muted/10 p-4 md:p-5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Professional Journey</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addProfessionalJourneyItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Journey
                      </Button>
                    </div>

                    {profileForm.professionalJourney.length ? (
                      profileForm.professionalJourney.map((item, index) => (
                        <div key={`journey-${index}`} className="space-y-3 rounded-lg border border-border bg-background/50 p-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Role</Label>
                              <Input
                                value={item.role || ""}
                                onChange={(event) =>
                                  updateProfessionalJourneyItem(index, {
                                    role: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Organization</Label>
                              <Input
                                value={item.company || ""}
                                onChange={(event) =>
                                  updateProfessionalJourneyItem(index, {
                                    company: event.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">Period</Label>
                              <Input
                                value={item.period || ""}
                                onChange={(event) =>
                                  updateProfessionalJourneyItem(index, {
                                    period: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeProfessionalJourneyItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Description</Label>
                            <Textarea
                              value={item.desc || ""}
                              onChange={(event) =>
                                updateProfessionalJourneyItem(index, {
                                  desc: event.target.value,
                                })
                              }
                              className="min-h-[110px]"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No journey entries yet.</p>
                    )}
                  </section>

                  <section className="space-y-3 rounded-lg border border-border bg-muted/10 p-4 md:p-5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Education History</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addEducationHistoryItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Education
                      </Button>
                    </div>

                    {profileForm.educationHistory.length ? (
                      profileForm.educationHistory.map((item, index) => (
                        <div key={`education-${index}`} className="space-y-3 rounded-lg border border-border bg-background/50 p-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Level</Label>
                              <Input
                                value={item.level || ""}
                                onChange={(event) =>
                                  updateEducationHistoryItem(index, {
                                    level: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">School</Label>
                              <Input
                                value={item.school || ""}
                                onChange={(event) =>
                                  updateEducationHistoryItem(index, {
                                    school: event.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">Period</Label>
                              <Input
                                value={item.period || ""}
                                onChange={(event) =>
                                  updateEducationHistoryItem(index, {
                                    period: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeEducationHistoryItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No education entries yet.</p>
                    )}
                  </section>

                  <section className="space-y-3 rounded-lg border border-border bg-muted/10 p-4 md:p-5">
                    <Label className="text-sm">SEO Settings (used by Root Layout)</Label>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Default Title</Label>
                        <Input
                          value={profileForm.seo.defaultTitle}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              seo: { ...prev.seo, defaultTitle: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Title Template (use %s)</Label>
                        <Input
                          placeholder="%s | My Portfolio"
                          value={profileForm.seo.titleTemplate}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              seo: { ...prev.seo, titleTemplate: event.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        className="min-h-[90px]"
                        value={profileForm.seo.description}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            seo: { ...prev.seo, description: event.target.value },
                          }))
                        }
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Canonical URL</Label>
                        <Input
                          placeholder="https://domain.tld"
                          value={profileForm.seo.canonicalUrl}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              seo: { ...prev.seo, canonicalUrl: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Preview Image URL</Label>
                        <Input
                          placeholder="https://domain.tld/preview.png"
                          value={profileForm.seo.previewImageUrl}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              seo: { ...prev.seo, previewImageUrl: event.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Site Name</Label>
                        <Input
                          value={profileForm.seo.siteName}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              seo: { ...prev.seo, siteName: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Locale</Label>
                        <Input
                          placeholder="id_ID"
                          value={profileForm.seo.locale}
                          onChange={(event) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              seo: { ...prev.seo, locale: event.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Job Title</Label>
                      <Input
                        value={profileForm.seo.jobTitle}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            seo: { ...prev.seo, jobTitle: event.target.value },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Keywords (comma separated)</Label>
                      <Textarea
                        className="min-h-[80px]"
                        value={profileForm.seo.keywordsText}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            seo: { ...prev.seo, keywordsText: event.target.value },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">SameAs URLs (comma separated)</Label>
                      <Textarea
                        className="min-h-[80px]"
                        value={profileForm.seo.sameAsText}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            seo: { ...prev.seo, sameAsText: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </section>

                  <div className="flex justify-end pt-1">
                    <Button type="button" onClick={saveProfile}>
                      <Save className="h-4 w-4 mr-2" /> Save Profile
                    </Button>
                  </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="bg-card/50 overflow-hidden h-[600px] flex flex-col">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-sm font-code flex items-center"><History className="h-4 w-4 mr-2" /> Access Audit Logs</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-0">
              <div className="divide-y divide-border">
                {isDataLoading ? (
                  <Loader2 className="animate-spin mx-auto my-10" />
                ) : logs.length ? (
                  logs.map((log) => (
                    <div key={log.id} className="p-3 px-6 flex justify-between items-center text-xs hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-1.5 rounded-full", log.accessSuccessful ? "bg-primary" : "bg-destructive")} />
                        <span className="font-medium text-foreground">{log.username || "Unknown"}</span>
                      </div>
                      <span className="text-muted-foreground font-code opacity-70">{log.accessedAt ? format(new Date(log.accessedAt), "yyyy-MM-dd HH:mm:ss") : "Unknown timestamp"}</span>
                    </div>
                  ))
                ) : (
                  <p className="p-10 text-center text-muted-foreground">No access logs found.</p>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" /> Confirm Permanent Purge</AlertDialogTitle>
            <AlertDialogHeader>
              <AlertDialogDescription className="text-muted-foreground">This protocol cannot be reversed. Remove this record from the server-managed database permanently?</AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted hover:bg-muted/80">ABORT</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">EXECUTE PURGE</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
