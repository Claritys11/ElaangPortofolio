
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Terminal, Lock, MessageSquare, History, User, Plus, Trash2, 
  Save, Database, Key, Loader2, AlertCircle, Cpu, Award, Image as ImageIcon, Link as LinkIcon 
} from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
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

export default function SecureInboxPage() {
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("messages")
  const db = useFirestore()

  // General Deletion State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<{id: string, collection: string} | null>(null)

  // Form Editing State
  const [editMode, setEditMode] = React.useState<"writeup" | "project" | "achievement" | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [imageSource, setImageSource] = React.useState<"url" | "upload">("url")

  const [writeupForm, setWriteupForm] = React.useState({
    title: "", competition: "", category: "Web", difficulty: "Medium",
    date: format(new Date(), 'yyyy-MM-dd'), summary: "", content: "", flag: "", tags: ""
  })

  const [projectForm, setProjectForm] = React.useState({
    title: "", description: "", imageUrl: "", category: "Security Tooling", tags: ""
  })

  const [achievementForm, setAchievementForm] = React.useState({
    title: "", issuer: "", platform: "", description: "", imageUrl: "", date: format(new Date(), 'yyyy-MM-dd')
  })

  const SYSTEM_PASSWORD = "admin123"

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === SYSTEM_PASSWORD && username.trim() !== "") {
      setIsAuthenticated(true)
      const logsRef = collection(db, "securePageAccessLogs")
      addDocumentNonBlocking(logsRef, {
        username: username,
        accessedAt: new Date().toISOString(),
        accessSuccessful: true,
      })
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid credentials signal." })
    }
  }

  // Queries
  const messagesQuery = useMemoFirebase(() => query(collection(db, "users", "admin", "secureMessages"), orderBy("createdAt", "desc")), [db])
  const logsQuery = useMemoFirebase(() => query(collection(db, "securePageAccessLogs"), orderBy("accessedAt", "desc")), [db])
  const writeupsQuery = useMemoFirebase(() => query(collection(db, "ctfWriteups"), orderBy("createdAt", "desc")), [db])
  const projectsQuery = useMemoFirebase(() => query(collection(db, "projects"), orderBy("createdAt", "desc")), [db])
  const achievementsQuery = useMemoFirebase(() => query(collection(db, "achievements"), orderBy("createdAt", "desc")), [db])

  const { data: messages, isLoading: messagesLoading } = useCollection(isAuthenticated ? messagesQuery : null)
  const { data: logs, isLoading: logsLoading } = useCollection(isAuthenticated ? logsQuery : null)
  const { data: writeups, isLoading: writeupsLoading } = useCollection(isAuthenticated ? writeupsQuery : null)
  const { data: projects, isLoading: projectsLoading } = useCollection(isAuthenticated ? projectsQuery : null)
  const { data: achievements, isLoading: achievementsLoading } = useCollection(isAuthenticated ? achievementsQuery : null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setter(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const saveWriteup = () => {
    const data = { ...writeupForm, tags: writeupForm.tags.split(',').map(t => t.trim()).filter(Boolean), createdAt: new Date().toISOString() }
    if (editingId) updateDocumentNonBlocking(doc(db, "ctfWriteups", editingId), data)
    else addDocumentNonBlocking(collection(db, "ctfWriteups"), data)
    toast({ title: "Write-up Saved" }); setEditMode(null); setEditingId(null);
  }

  const saveProject = () => {
    const data = { ...projectForm, tags: projectForm.tags.split(',').map(t => t.trim()).filter(Boolean), createdAt: new Date().toISOString() }
    if (editingId) updateDocumentNonBlocking(doc(db, "projects", editingId), data)
    else addDocumentNonBlocking(collection(db, "projects"), data)
    toast({ title: "Project Saved" }); setEditMode(null); setEditingId(null);
  }

  const saveAchievement = () => {
    const data = { ...achievementForm, createdAt: new Date().toISOString() }
    if (editingId) updateDocumentNonBlocking(doc(db, "achievements", editingId), data)
    else addDocumentNonBlocking(collection(db, "achievements"), data)
    toast({ title: "Achievement Saved" }); setEditMode(null); setEditingId(null);
  }

  const triggerDelete = (id: string, coll: string) => {
    setItemToDelete({ id, collection: coll })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!itemToDelete) return
    deleteDocumentNonBlocking(doc(db, itemToDelete.collection, itemToDelete.id))
    toast({ title: "Record Purged" })
    setDeleteDialogOpen(false)
    setItemToDelete(null)
    if (editingId === itemToDelete.id) { setEditMode(null); setEditingId(null); }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md relative rounded-xl border border-border p-1">
          <GlowingEffect spread={40} glow={true} disabled={false} />
          <Card className="relative bg-card border-none">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Lock className="h-6 w-6 text-primary" /></div>
              <CardTitle className="font-headline font-bold text-2xl">Secure Entry</CardTitle>
              <p className="text-sm text-muted-foreground font-code">Authentication Required</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-code uppercase">Identifier</Label>
                  <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-code uppercase">Security Key</Label>
                  <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-primary font-bold">AUTHORIZE ACCESS</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline font-bold">Command Center</h1>
        <div className="px-3 py-1 bg-muted rounded border text-xs font-code uppercase">User: {username}</div>
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
            {messagesLoading ? <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div> : messages?.length ? messages.map(msg => (
              <Card key={msg.id} className="bg-background/50 border-border">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg text-primary">{msg.title}</CardTitle>
                  <CardDescription className="text-[10px] font-code">{msg.username} • {format(new Date(msg.createdAt), 'yy-MM-dd HH:mm')}</CardDescription>
                </CardHeader>
                <CardContent className="py-4 pt-0 text-sm text-muted-foreground whitespace-pre-wrap">{msg.content}</CardContent>
              </Card>
            )) : <p className="col-span-full text-center py-20 text-muted-foreground">No signals detected.</p>}
          </div>
        </TabsContent>

        <TabsContent value="writeups">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <Button onClick={() => { setEditMode("writeup"); setEditingId(null); setWriteupForm({title: "", competition: "", category: "Web", difficulty: "Medium", date: format(new Date(), 'yyyy-MM-dd'), summary: "", content: "", flag: "", tags: ""}) }} className="w-full bg-primary/20 text-primary border border-primary/30">
                <Plus className="h-4 w-4 mr-2" /> New Write-up
              </Button>
              <ScrollArea className="h-[600px] border rounded-lg bg-card/30">
                <div className="p-4 space-y-2">
                  {writeupsLoading ? <Loader2 className="animate-spin mx-auto mt-10" /> : writeups?.map(w => (
                    <div key={w.id} className={cn("p-3 rounded-lg border flex justify-between group items-center cursor-pointer", editingId === w.id ? "bg-primary/10 border-primary/50" : "bg-card border-border/50")} onClick={() => { setEditMode("writeup"); setEditingId(w.id); setWriteupForm({ ...w, tags: (w.tags || []).join(', ') }) }}>
                      <div className="truncate"><p className="text-sm font-bold truncate">{w.title}</p><p className="text-[10px] text-muted-foreground">{w.competition}</p></div>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); triggerDelete(w.id, "ctfWriteups") }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="lg:col-span-8">
              {editMode === "writeup" ? (
                <Card className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={writeupForm.title} onChange={e => setWriteupForm({...writeupForm, title: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Competition</Label><Input value={writeupForm.competition} onChange={e => setWriteupForm({...writeupForm, competition: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={writeupForm.category} onValueChange={v => setWriteupForm({...writeupForm, category: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["Web", "Pwn", "Crypto", "Reverse", "Forensics"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Difficulty</Label><Select value={writeupForm.difficulty} onValueChange={v => setWriteupForm({...writeupForm, difficulty: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Easy", "Medium", "Hard"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Date</Label><Input type="date" value={writeupForm.date} onChange={e => setWriteupForm({...writeupForm, date: e.target.value})} /></div>
                  </div>
                  <div className="space-y-2"><Label>Flag</Label><Input value={writeupForm.flag} onChange={e => setWriteupForm({...writeupForm, flag: e.target.value})} className="font-code text-primary" /></div>
                  <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={writeupForm.tags} onChange={e => setWriteupForm({...writeupForm, tags: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Summary</Label><Textarea value={writeupForm.summary} onChange={e => setWriteupForm({...writeupForm, summary: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Content</Label><Textarea value={writeupForm.content} onChange={e => setWriteupForm({...writeupForm, content: e.target.value})} className="min-h-[200px]" /></div>
                  <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditMode(null)}>Cancel</Button><Button onClick={saveWriteup}><Save className="h-4 w-4 mr-2" /> Save</Button></div>
                </Card>
              ) : <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-20 text-center"><Database className="h-10 w-10 mb-4 opacity-20" /><p>Select a write-up node to edit or create a new entry.</p></div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <Button onClick={() => { setEditMode("project"); setEditingId(null); setProjectForm({title: "", description: "", imageUrl: "", category: "Security Tooling", tags: ""}) }} className="w-full bg-primary/20 text-primary border border-primary/30">
                <Plus className="h-4 w-4 mr-2" /> New Project
              </Button>
              <ScrollArea className="h-[600px] border rounded-lg bg-card/30">
                <div className="p-4 space-y-2">
                  {projectsLoading ? <Loader2 className="animate-spin mx-auto mt-10" /> : projects?.map(p => (
                    <div key={p.id} className={cn("p-3 rounded-lg border flex justify-between group items-center cursor-pointer", editingId === p.id ? "bg-primary/10 border-primary/50" : "bg-card border-border/50")} onClick={() => { setEditMode("project"); setEditingId(p.id); setProjectForm({ ...p, tags: (p.tags || []).join(', ') }) }}>
                      <div className="truncate"><p className="text-sm font-bold truncate">{p.title}</p><p className="text-[10px] text-muted-foreground">{p.category}</p></div>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); triggerDelete(p.id, "projects") }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="lg:col-span-8">
              {editMode === "project" ? (
                <Card className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Project Title</Label><Input value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Category</Label><Input value={projectForm.category} onChange={e => setProjectForm({...projectForm, category: e.target.value})} /></div>
                  </div>
                  
                  <div className="space-y-4 border-y py-4 my-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-bold text-primary">Media Asset</Label>
                      <div className="flex bg-muted p-1 rounded-md">
                        <Button size="sm" variant={imageSource === "url" ? "default" : "ghost"} onClick={() => setImageSource("url")} className="h-7 text-[10px]"><LinkIcon className="h-3 w-3 mr-1" /> URL</Button>
                        <Button size="sm" variant={imageSource === "upload" ? "default" : "ghost"} onClick={() => setImageSource("upload")} className="h-7 text-[10px]"><ImageIcon className="h-3 w-3 mr-1" /> UPLOAD</Button>
                      </div>
                    </div>
                    {imageSource === "url" ? (
                      <Input placeholder="https://image-source.com/assets/..." value={projectForm.imageUrl} onChange={e => setProjectForm({...projectForm, imageUrl: e.target.value})} />
                    ) : (
                      <div className="space-y-2">
                        <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, (url) => setProjectForm({...projectForm, imageUrl: url}))} className="cursor-pointer" />
                        <p className="text-[10px] text-muted-foreground">Local upload will be encoded as Base64.</p>
                      </div>
                    )}
                    {projectForm.imageUrl && (
                      <div className="mt-2 h-24 w-40 relative rounded border-2 border-primary/20 overflow-hidden bg-black/50">
                        <img src={projectForm.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2"><Label>Technical Description</Label><Textarea value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} className="min-h-[120px]" /></div>
                  <div className="space-y-2"><Label>Stack Tags (comma separated)</Label><Input value={projectForm.tags} onChange={e => setProjectForm({...projectForm, tags: e.target.value})} placeholder="React, Rust, Cryptography" /></div>
                  
                  <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditMode(null)}>Cancel</Button><Button onClick={saveProject}><Save className="h-4 w-4 mr-2" /> Save Project</Button></div>
                </Card>
              ) : <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-20 text-center"><Cpu className="h-10 w-10 mb-4 opacity-20" /><p>Select a project node or create a new showcase asset.</p></div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <Button onClick={() => { setEditMode("achievement"); setEditingId(null); setAchievementForm({title: "", issuer: "", platform: "", description: "", imageUrl: "", date: format(new Date(), 'yyyy-MM-dd')}) }} className="w-full bg-primary/20 text-primary border border-primary/30">
                <Plus className="h-4 w-4 mr-2" /> New Achievement
              </Button>
              <ScrollArea className="h-[600px] border rounded-lg bg-card/30">
                <div className="p-4 space-y-2">
                  {achievementsLoading ? <Loader2 className="animate-spin mx-auto mt-10" /> : achievements?.map(a => (
                    <div key={a.id} className={cn("p-3 rounded-lg border flex justify-between group items-center cursor-pointer", editingId === a.id ? "bg-primary/10 border-primary/50" : "bg-card border-border/50")} onClick={() => { setEditMode("achievement"); setEditingId(a.id); setAchievementForm({ ...a }) }}>
                      <div className="truncate"><p className="text-sm font-bold truncate">{a.title}</p><p className="text-[10px] text-muted-foreground">{a.issuer}</p></div>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); triggerDelete(a.id, "achievements") }} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="lg:col-span-8">
              {editMode === "achievement" ? (
                <Card className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={achievementForm.title} onChange={e => setAchievementForm({...achievementForm, title: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Issuer / Organization</Label><Input value={achievementForm.issuer} onChange={e => setAchievementForm({...achievementForm, issuer: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Platform / Category</Label><Input value={achievementForm.platform} onChange={e => setAchievementForm({...achievementForm, platform: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Date Achieved</Label><Input value={achievementForm.date} onChange={e => setAchievementForm({...achievementForm, date: e.target.value})} placeholder="e.g. Nov 2024" /></div>
                  </div>
                  
                  <div className="space-y-4 border-y py-4 my-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-bold text-primary">Credential Image</Label>
                      <div className="flex bg-muted p-1 rounded-md">
                        <Button size="sm" variant={imageSource === "url" ? "default" : "ghost"} onClick={() => setImageSource("url")} className="h-7 text-[10px]"><LinkIcon className="h-3 w-3 mr-1" /> URL</Button>
                        <Button size="sm" variant={imageSource === "upload" ? "default" : "ghost"} onClick={() => setImageSource("upload")} className="h-7 text-[10px]"><ImageIcon className="h-3 w-3 mr-1" /> UPLOAD</Button>
                      </div>
                    </div>
                    {imageSource === "url" ? (
                      <Input placeholder="https://..." value={achievementForm.imageUrl} onChange={e => setAchievementForm({...achievementForm, imageUrl: e.target.value})} />
                    ) : (
                      <Input type="file" accept="image/*" onChange={e => handleImageUpload(e, (url) => setAchievementForm({...achievementForm, imageUrl: url}))} />
                    )}
                    {achievementForm.imageUrl && (
                      <div className="mt-2 h-24 w-32 relative rounded border-2 border-primary/20 overflow-hidden">
                        <img src={achievementForm.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2"><Label>Description / Context</Label><Textarea value={achievementForm.description} onChange={e => setAchievementForm({...achievementForm, description: e.target.value})} /></div>
                  
                  <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditMode(null)}>Cancel</Button><Button onClick={saveAchievement}><Save className="h-4 w-4 mr-2" /> Save Record</Button></div>
                </Card>
              ) : <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-20 text-center"><Award className="h-10 w-10 mb-4 opacity-20" /><p>Select an achievement node or document a new milestone.</p></div>}
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
                {logsLoading ? <Loader2 className="animate-spin mx-auto my-10" /> : logs?.length ? logs.map(log => (
                  <div key={log.id} className="p-3 px-6 flex justify-between items-center text-xs hover:bg-primary/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-1.5 h-1.5 rounded-full", log.accessSuccessful ? "bg-primary" : "bg-destructive")} />
                      <span className="font-medium text-foreground">{log.username}</span>
                    </div>
                    <span className="text-muted-foreground font-code opacity-70">{format(new Date(log.accessedAt), 'yyyy-MM-dd HH:mm:ss')}</span>
                  </div>
                )) : <p className="p-10 text-center text-muted-foreground">No access logs found.</p>}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" /> Confirm Permanent Purge</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">This protocol cannot be reversed. Remove this record from Firestore nodes permanently?</AlertDialogDescription>
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
