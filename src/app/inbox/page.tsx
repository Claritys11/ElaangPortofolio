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
  Image as ImageIcon,
  Link as LinkIcon,
  LogOut,
} from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { fetchJson } from "@/lib/api-client"
import { getStorageType } from "@/lib/storage-type"
import type {
  AccessLogRecord,
  AchievementRecord,
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

type EditMode = "writeup" | "project" | "achievement" | null
type ImageSourceMode = "url" | "upload"

const adminCollectionRoutes = {
  ctfWriteups: "/api/admin/writeups",
  projects: "/api/admin/projects",
  achievements: "/api/admin/achievements",
} as const

type DeleteCollection = keyof typeof adminCollectionRoutes

interface DeleteTarget {
  id: string
  collection: DeleteCollection
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
}

interface ProjectFormState {
  title: string
  description: string
  imageUrl: string
  projectUrl: string
  category: string
  tags: string
}

interface AchievementFormState {
  title: string
  issuer: string
  platform: string
  description: string
  imageUrl: string
  date: string
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
  }
}

export default function SecureInboxPage() {
  const { toast } = useToast()
  const isFirebaseStorage = getStorageType() === "firebase"
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
  const [imageSource, setImageSource] = React.useState<ImageSourceMode>("url")

  const [writeupForm, setWriteupForm] = React.useState<WriteupFormState>(createEmptyWriteupForm)
  const [projectForm, setProjectForm] = React.useState<ProjectFormState>(createEmptyProjectForm)
  const [achievementForm, setAchievementForm] = React.useState<AchievementFormState>(createEmptyAchievementForm)

  const resetDashboard = React.useCallback(() => {
    setMessages([])
    setLogs([])
    setWriteups([])
    setProjects([])
    setAchievements([])
    setEditMode(null)
    setEditingId(null)
    setItemToDelete(null)
    setDeleteDialogOpen(false)
    setWriteupForm(createEmptyWriteupForm())
    setProjectForm(createEmptyProjectForm())
    setAchievementForm(createEmptyAchievementForm())
    setImageSource("url")
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
        const [nextMessages, nextLogs, nextWriteups, nextProjects, nextAchievements] = await Promise.all([
          fetchJson<SecureMessageRecord[]>("/api/admin/messages"),
          fetchJson<AccessLogRecord[]>("/api/admin/logs"),
          fetchJson<WriteupRecord[]>("/api/admin/writeups"),
          fetchJson<ProjectRecord[]>("/api/admin/projects"),
          fetchJson<AchievementRecord[]>("/api/admin/achievements"),
        ])

        setMessages(nextMessages)
        setLogs(nextLogs)
        setWriteups(nextWriteups)
        setProjects(nextProjects)
        setAchievements(nextAchievements)
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
        setUsername(session.username)
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (isFirebaseStorage) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const result = reader.result
            if (typeof result === "string") {
              resolve(result)
            } else {
              reject(new Error("Unable to encode image."))
            }
          }
          reader.onerror = () => reject(new Error("Unable to encode image."))
          reader.readAsDataURL(file)
        })

        setter(dataUrl)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Could not process image.",
        })
      }

      return
    }

    const form = new FormData()
    form.append("file", file)

    try {
      const result = await fetchJson<{ url: string }>("/api/admin/upload", { method: "POST", body: form })
      setter(result.url)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload image.",
      })
    }
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
      setUsername(response.username)
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
      // Ignore logout transport failures and clear local state anyway.
    } finally {
      handleUnauthorized()
      toast({ title: "Session closed", description: "Admin cookie removed from the server session." })
    }
  }

  const beginCreateWriteup = () => {
    setEditMode("writeup")
    setEditingId(null)
    setWriteupForm(createEmptyWriteupForm())
  }

  const beginEditWriteup = (writeup: WriteupRecord) => {
    setEditMode("writeup")
    setEditingId(writeup.id)
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
    })
  }

  const beginCreateProject = () => {
    setEditMode("project")
    setEditingId(null)
    setImageSource("url")
    setProjectForm(createEmptyProjectForm())
  }

  const beginEditProject = (project: ProjectRecord) => {
    setEditMode("project")
    setEditingId(project.id)
    setImageSource("url")
    setProjectForm({
      title: project.title || "",
      description: project.description || "",
      imageUrl: project.imageUrl || "",
      projectUrl: project.projectUrl || "",
      category: project.category || "Security Tooling",
      tags: (project.tags || []).join(", "),
    })
  }

  const beginCreateAchievement = () => {
    setEditMode("achievement")
    setEditingId(null)
    setImageSource("url")
    setAchievementForm(createEmptyAchievementForm())
  }

  const beginEditAchievement = (achievement: AchievementRecord) => {
    setEditMode("achievement")
    setEditingId(achievement.id)
    setImageSource("url")
    setAchievementForm({
      title: achievement.title || "",
      issuer: achievement.issuer || "",
      platform: achievement.platform || "",
      description: achievement.description || "",
      imageUrl: achievement.imageUrl || "",
      date: achievement.date || format(new Date(), "yyyy-MM-dd"),
    })
  }

  const saveWriteup = async () => {
    const payload = {
      ...writeupForm,
      tags: writeupForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    }

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

      toast({ title: "Write-up saved" })
      setEditMode(null)
      setEditingId(null)
      setWriteupForm(createEmptyWriteupForm())
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
    }

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

      toast({ title: "Project saved" })
      setEditMode(null)
      setEditingId(null)
      setProjectForm(createEmptyProjectForm())
      setImageSource("url")
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
    const payload = { ...achievementForm }

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

      toast({ title: "Achievement saved" })
      setEditMode(null)
      setEditingId(null)
      setAchievementForm(createEmptyAchievementForm())
      setImageSource("url")
      await loadDashboardData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Achievement save failed",
        description: error instanceof Error ? error.message : "Unable to persist the achievement.",
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
        setEditMode(null)
        setEditingId(null)
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
                  <Input placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-code uppercase">Security Key</Label>
                  <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
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
        <h1 className="text-3xl font-headline font-bold">Command Center</h1>
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
          <TabsTrigger value="logs" className="px-6 py-2"><History className="h-4 w-4 mr-2" /> Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isDataLoading ? (
              <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
            ) : messages.length ? (
              messages.map((message) => (
                <Card key={message.id} className="bg-background/50 border-border">
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg text-primary">{message.title}</CardTitle>
                    <CardDescription className="text-[10px] font-code">
                      {message.username} • {message.createdAt ? format(new Date(message.createdAt), "yy-MM-dd HH:mm") : "Unknown timestamp"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-4 pt-0 text-sm text-muted-foreground whitespace-pre-wrap">{message.content}</CardContent>
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
              <ScrollArea className="h-[600px] border rounded-lg bg-card/30">
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
                          <p className="text-sm font-bold truncate">{writeup.title}</p>
                          <p className="text-[10px] text-muted-foreground">{writeup.competition}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); triggerDelete(writeup.id, "ctfWriteups") }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="lg:col-span-8">
              {editMode === "writeup" ? (
                <Card className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={writeupForm.title} onChange={(event) => setWriteupForm({ ...writeupForm, title: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Competition</Label><Input value={writeupForm.competition} onChange={(event) => setWriteupForm({ ...writeupForm, competition: event.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={writeupForm.category} onValueChange={(value) => setWriteupForm({ ...writeupForm, category: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["Web", "Pwn", "Crypto", "Reverse", "Forensics"].map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Difficulty</Label><Select value={writeupForm.difficulty} onValueChange={(value) => setWriteupForm({ ...writeupForm, difficulty: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Easy", "Medium", "Hard"].map((difficulty) => <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Date</Label><Input type="date" value={writeupForm.date} onChange={(event) => setWriteupForm({ ...writeupForm, date: event.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Flag</Label><Input value={writeupForm.flag} onChange={(event) => setWriteupForm({ ...writeupForm, flag: event.target.value })} className="font-code text-primary" /></div>
                  <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={writeupForm.tags} onChange={(event) => setWriteupForm({ ...writeupForm, tags: event.target.value })} /></div>
                  <div className="space-y-2"><Label>Summary</Label><Textarea value={writeupForm.summary} onChange={(event) => setWriteupForm({ ...writeupForm, summary: event.target.value })} /></div>
                  <div className="space-y-2"><Label>Content</Label><Textarea value={writeupForm.content} onChange={(event) => setWriteupForm({ ...writeupForm, content: event.target.value })} className="min-h-[200px]" /></div>
                  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditMode(null)}>Cancel</Button><Button type="button" onClick={saveWriteup}><Save className="h-4 w-4 mr-2" /> Save</Button></div>
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
              <ScrollArea className="h-[600px] border rounded-lg bg-card/30">
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
                          <p className="text-sm font-bold truncate">{project.title}</p>
                          <p className="text-[10px] text-muted-foreground">{project.category}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); triggerDelete(project.id, "projects") }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="lg:col-span-8">
              {editMode === "project" ? (
                <Card className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Project Title</Label><Input value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Category</Label><Input value={projectForm.category} onChange={(event) => setProjectForm({ ...projectForm, category: event.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Project URL (GitHub/Live Demo)</Label><Input placeholder="https://github.com/..." value={projectForm.projectUrl} onChange={(event) => setProjectForm({ ...projectForm, projectUrl: event.target.value })} /></div>
                  <div className="space-y-4 border-y py-4 my-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-bold text-primary">Media Asset</Label>
                      <div className="flex bg-muted p-1 rounded-md">
                        <Button type="button" size="sm" variant={imageSource === "url" ? "default" : "ghost"} onClick={() => setImageSource("url")} className="h-7 text-[10px]"><LinkIcon className="h-3 w-3 mr-1" /> URL</Button>
                        <Button type="button" size="sm" variant={imageSource === "upload" ? "default" : "ghost"} onClick={() => setImageSource("upload")} className="h-7 text-[10px]"><ImageIcon className="h-3 w-3 mr-1" /> UPLOAD</Button>
                      </div>
                    </div>
                    {imageSource === "url" ? (
                      <Input placeholder="https://..." value={projectForm.imageUrl} onChange={(event) => setProjectForm({ ...projectForm, imageUrl: event.target.value })} />
                    ) : (
                      <div className="space-y-2">
                        <Input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, (url) => setProjectForm({ ...projectForm, imageUrl: url }))} className="cursor-pointer" />
                        <p className="text-[10px] text-muted-foreground">
                          {isFirebaseStorage
                            ? "Firebase mode uses Base64 data URL for image fields."
                            : "SQLite mode uploads binary file and stores UUID URL."}
                        </p>
                      </div>
                    )}
                    {projectForm.imageUrl && (
                      <div className="mt-2 h-24 w-40 relative rounded border-2 border-primary/20 overflow-hidden bg-black/50">
                        <img src={projectForm.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2"><Label>Technical Description</Label><Textarea value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} className="min-h-[120px]" /></div>
                  <div className="space-y-2"><Label>Stack Tags (comma separated)</Label><Input value={projectForm.tags} onChange={(event) => setProjectForm({ ...projectForm, tags: event.target.value })} placeholder="React, Rust, Cryptography" /></div>
                  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditMode(null)}>Cancel</Button><Button type="button" onClick={saveProject}><Save className="h-4 w-4 mr-2" /> Save Project</Button></div>
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
              <ScrollArea className="h-[600px] border rounded-lg bg-card/30">
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
                          <p className="text-sm font-bold truncate">{achievement.title}</p>
                          <p className="text-[10px] text-muted-foreground">{achievement.issuer}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); triggerDelete(achievement.id, "achievements") }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="lg:col-span-8">
              {editMode === "achievement" ? (
                <Card className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={achievementForm.title} onChange={(event) => setAchievementForm({ ...achievementForm, title: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Issuer / Organization</Label><Input value={achievementForm.issuer} onChange={(event) => setAchievementForm({ ...achievementForm, issuer: event.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Platform / Category</Label><Input value={achievementForm.platform} onChange={(event) => setAchievementForm({ ...achievementForm, platform: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Date Achieved</Label><Input value={achievementForm.date} onChange={(event) => setAchievementForm({ ...achievementForm, date: event.target.value })} placeholder="e.g. Nov 2024" /></div>
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
                      <Input placeholder="https://..." value={achievementForm.imageUrl} onChange={(event) => setAchievementForm({ ...achievementForm, imageUrl: event.target.value })} />
                    ) : (
                      <Input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, (url) => setAchievementForm({ ...achievementForm, imageUrl: url }))} />
                    )}
                    {achievementForm.imageUrl && (
                      <div className="mt-2 h-24 w-32 relative rounded border-2 border-primary/20 overflow-hidden">
                        <img src={achievementForm.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2"><Label>Description / Context</Label><Textarea value={achievementForm.description} onChange={(event) => setAchievementForm({ ...achievementForm, description: event.target.value })} /></div>
                  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditMode(null)}>Cancel</Button><Button type="button" onClick={saveAchievement}><Save className="h-4 w-4 mr-2" /> Save Record</Button></div>
                </Card>
              ) : (
                <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-20 text-center"><Award className="h-10 w-10 mb-4 opacity-20" /><p>Select an achievement node or document a new milestone.</p></div>
              )}
            </div>
          </div>
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
                        <span className="font-medium text-foreground">{log.username}</span>
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
            <AlertDialogDescription className="text-muted-foreground">This protocol cannot be reversed. Remove this record from the server-managed Firebase backend permanently?</AlertDialogDescription>
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
