
"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Terminal, Lock, MessageSquare, History, User, Plus, Trash2, Save, X, Database, Key, Loader2 } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function SecureInboxPage() {
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("messages")
  const db = useFirestore()

  // Write-up Form State
  const [isEditing, setIsEditing] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [writeupForm, setWriteupForm] = React.useState({
    title: "",
    competition: "",
    category: "Web",
    difficulty: "Medium",
    date: format(new Date(), 'yyyy-MM-dd'),
    summary: "",
    content: "",
    flag: "",
    tags: ""
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
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid credentials signal."
      })
    }
  }

  const messagesQuery = useMemoFirebase(() => {
    return query(collection(db, "users", "admin", "secureMessages"), orderBy("createdAt", "desc"))
  }, [db])

  const logsQuery = useMemoFirebase(() => {
    return query(collection(db, "securePageAccessLogs"), orderBy("accessedAt", "desc"))
  }, [db])

  const writeupsQuery = useMemoFirebase(() => {
    return query(collection(db, "ctfWriteups"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: messages, isLoading: messagesLoading } = useCollection(isAuthenticated ? messagesQuery : null)
  const { data: logs, isLoading: logsLoading } = useCollection(isAuthenticated ? logsQuery : null)
  const { data: writeups, isLoading: writeupsLoading } = useCollection(isAuthenticated ? writeupsQuery : null)

  const handleSaveWriteup = () => {
    if (!writeupForm.title || !writeupForm.content) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and Content are required."
      })
      return
    }

    const data = {
      ...writeupForm,
      tags: writeupForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    }

    if (editingId) {
      const docRef = doc(db, "ctfWriteups", editingId)
      updateDocumentNonBlocking(docRef, data)
      toast({ title: "Write-up Updated", description: "Signal updated successfully." })
    } else {
      const colRef = collection(db, "ctfWriteups")
      addDocumentNonBlocking(colRef, data)
      toast({ title: "Write-up Created", description: "New signal broadcasted." })
    }

    setIsEditing(false)
    setEditingId(null)
  }

  const handleEdit = (w: any) => {
    setWriteupForm({
      title: w.title || "",
      competition: w.competition || "",
      category: w.category || "Web",
      difficulty: w.difficulty || "Medium",
      date: w.date || format(new Date(), 'yyyy-MM-dd'),
      summary: w.summary || "",
      content: w.content || "",
      flag: w.flag || "",
      tags: (w.tags || []).join(', ')
    })
    setEditingId(w.id)
    setIsEditing(true)
  }

  const handleDelete = (id: string | null | undefined) => {
    if (!id) return;
    
    const confirmMsg = "Are you sure you want to delete this record? This action cannot be undone."
    if (typeof window !== "undefined" && window.confirm(confirmMsg)) {
      const docRef = doc(db, "ctfWriteups", id)
      deleteDocumentNonBlocking(docRef)
      
      toast({ 
        title: "Record Deleted", 
        description: "Signal purged from database." 
      })

      if (editingId === id) {
        setIsEditing(false)
        setEditingId(null)
      }
    }
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
              <p className="text-sm text-muted-foreground font-code">Authentication Required to Access Nodes</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-code uppercase text-muted-foreground">Identifier</Label>
                  <Input 
                    placeholder="Enter Username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-code uppercase text-muted-foreground">Security Key</Label>
                  <Input 
                    type="password" 
                    placeholder="Enter Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary font-bold">
                  AUTHORIZE ACCESS
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-primary">
            <Terminal className="h-5 w-5" />
            <span className="font-code text-sm font-bold uppercase tracking-widest">Command Center</span>
          </div>
          <h1 className="text-3xl font-headline font-bold">Administrator Interface</h1>
        </div>
        <div className="px-4 py-2 bg-muted rounded border border-border flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-code uppercase text-muted-foreground">User: {username}</span>
        </div>
      </div>

      <Tabs defaultValue="messages" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted border border-border p-1 h-auto mb-8 flex flex-wrap justify-start">
          <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-headline px-6 py-2">
            <MessageSquare className="h-4 w-4 mr-2" /> Transmissions
          </TabsTrigger>
          <TabsTrigger value="writeups" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-headline px-6 py-2">
            <Database className="h-4 w-4 mr-2" /> Write-up Manager
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-headline px-6 py-2">
            <History className="h-4 w-4 mr-2" /> Access Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="grid gap-8">
            <ScrollArea className="h-[600px] rounded-xl border border-border bg-card/50 p-4 md:p-6">
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs font-code animate-pulse">DECRYPTING SIGNALS...</p>
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 italic">
                  <p>No transmissions found in database.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {messages?.map((msg) => (
                    <Card key={msg.id} className="bg-background/50 border-border hover:border-primary/50 transition-colors">
                      <CardHeader className="py-4">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg text-primary truncate">{msg.title}</CardTitle>
                          <time className="text-[10px] font-code text-muted-foreground shrink-0 ml-2">
                            {format(new Date(msg.createdAt), 'yy-MM-dd HH:mm')}
                          </time>
                        </div>
                        <CardDescription className="font-code text-[10px]">{msg.username || 'Anonymous'}</CardDescription>
                      </CardHeader>
                      <CardContent className="py-4 pt-0">
                        <pre className="text-xs font-body whitespace-pre-wrap leading-relaxed text-muted-foreground">
                          {msg.content}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="writeups">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-headline font-bold flex items-center">
                  <Database className="h-5 w-5 mr-2 text-primary" /> Records
                </h2>
                <Button size="sm" onClick={() => { setIsEditing(true); setEditingId(null); setWriteupForm({ title: "", competition: "", category: "Web", difficulty: "Medium", date: format(new Date(), 'yyyy-MM-dd'), summary: "", content: "", flag: "", tags: "" }); }} className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
                  <Plus className="h-4 w-4 mr-1" /> New Entry
                </Button>
              </div>
              <ScrollArea className="h-[600px] rounded-xl border border-border bg-card/30">
                <div className="p-4 space-y-2">
                  {writeupsLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                  ) : !writeups || writeups.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-xs italic">No records available.</p>
                  ) : (
                    writeups.map(w => (
                      <div key={w.id} className={cn(
                        "p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between group",
                        editingId === w.id ? "bg-primary/10 border-primary/50" : "bg-card hover:bg-muted border-border"
                      )} onClick={() => handleEdit(w)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{w.title}</p>
                          <p className="text-[10px] text-muted-foreground font-code">{w.category} • {w.competition}</p>
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDelete(w.id); 
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="lg:col-span-8">
              {isEditing ? (
                <Card className="bg-card border-border h-full flex flex-col">
                  <CardHeader className="border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-headline">{editingId ? 'Edit Signal' : 'New Signal'}</CardTitle>
                      <CardDescription>Protocol: CTF Documentation</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {editingId && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(editingId)} className="flex-1 sm:flex-none">
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none">
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" className="bg-primary text-primary-foreground flex-1 sm:flex-none" onClick={handleSaveWriteup}>
                        <Save className="h-4 w-4 mr-1" /> Save Signal
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-code uppercase">Title</Label>
                          <Input 
                            placeholder="e.g. SQLi to RCE on Legacy CMS"
                            value={writeupForm.title}
                            onChange={(e) => setWriteupForm({...writeupForm, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-code uppercase">Competition</Label>
                          <Input 
                            placeholder="e.g. PicoCTF 2023"
                            value={writeupForm.competition}
                            onChange={(e) => setWriteupForm({...writeupForm, competition: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-code uppercase">Category</Label>
                          <Select value={writeupForm.category} onValueChange={(v) => setWriteupForm({...writeupForm, category: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["Web", "Pwn", "Crypto", "Reverse", "Forensics"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-code uppercase">Difficulty</Label>
                          <Select value={writeupForm.difficulty} onValueChange={(v) => setWriteupForm({...writeupForm, difficulty: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["Easy", "Medium", "Hard"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-code uppercase">Date</Label>
                          <Input 
                            type="date"
                            value={writeupForm.date}
                            onChange={(e) => setWriteupForm({...writeupForm, date: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-code uppercase flex items-center gap-2">
                          <Key className="h-3 w-3 text-primary" /> Captured Flag
                        </Label>
                        <Input 
                          placeholder="e.g. picoCTF{flag_goes_here}"
                          value={writeupForm.flag}
                          onChange={(e) => setWriteupForm({...writeupForm, flag: e.target.value})}
                          className="font-code text-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-code uppercase">Tags (comma separated)</Label>
                        <Input 
                          placeholder="SQLi, WAF, Exploit"
                          value={writeupForm.tags}
                          onChange={(e) => setWriteupForm({...writeupForm, tags: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-code uppercase">Summary</Label>
                        <Textarea 
                          placeholder="Brief description of the challenge and solution..."
                          className="min-h-[100px] resize-none"
                          value={writeupForm.summary}
                          onChange={(e) => setWriteupForm({...writeupForm, summary: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-code uppercase">Documentation / Content</Label>
                        <Textarea 
                          placeholder="Detailed exploitation steps, code snippets, etc..."
                          className="min-h-[400px] font-body text-sm leading-relaxed"
                          value={writeupForm.content}
                          onChange={(e) => setWriteupForm({...writeupForm, content: e.target.value})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/10 p-8 md:p-12 text-center space-y-4">
                  <Database className="h-12 w-12 text-muted" />
                  <div>
                    <h3 className="text-xl font-headline font-bold">Write-up Repository Manager</h3>
                    <p className="text-sm text-muted-foreground">Select a record to edit or create a new one to broadcast.</p>
                  </div>
                  <Button onClick={() => setIsEditing(true)} className="bg-primary text-primary-foreground font-bold">
                    <Plus className="h-4 w-4 mr-2" /> CREATE NEW SIGNAL
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
           <div className="rounded-xl border border-border bg-card/50 overflow-hidden h-[600px] flex flex-col">
            <div className="bg-muted p-3 border-b border-border flex justify-between text-[10px] font-code uppercase text-muted-foreground">
              <span>Identifier</span>
              <span>Timestamp</span>
            </div>
            <ScrollArea className="flex-1 p-0">
              {logsLoading ? (
                 <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {logs?.map((log) => (
                    <div key={log.id} className="p-3 flex justify-between items-center group hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">{log.username}</span>
                      </div>
                      <span className="text-[9px] font-code text-muted-foreground">
                        {format(new Date(log.accessedAt), 'yyyy-MM-dd HH:mm:ss')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
