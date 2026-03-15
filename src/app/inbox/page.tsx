"use client"

import * as React from "react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Terminal, Lock, MessageSquare, History, User } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

export default function SecureInboxPage() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const db = useFirestore()

  // Password for demonstration - in production, this should be handled via Auth/Functions
  const SYSTEM_PASSWORD = "admin123"

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === SYSTEM_PASSWORD && username.trim() !== "") {
      setIsAuthenticated(true)
      
      // Log the access attempt
      const logsRef = collection(db, "securePageAccessLogs")
      addDocumentNonBlocking(logsRef, {
        username: username,
        accessedAt: new Date().toISOString(),
        accessSuccessful: true,
      })
    } else {
      alert("Invalid Signal: Check Username/Password")
    }
  }

  // Memoized queries for real-time updates
  const messagesQuery = useMemoFirebase(() => {
    return query(collection(db, "users", "admin", "secureMessages"), orderBy("createdAt", "desc"))
  }, [db])

  const logsQuery = useMemoFirebase(() => {
    return query(collection(db, "securePageAccessLogs"), orderBy("accessedAt", "desc"))
  }, [db])

  const { data: messages, isLoading: messagesLoading } = useCollection(isAuthenticated ? messagesQuery : null)
  const { data: logs, isLoading: logsLoading } = useCollection(isAuthenticated ? logsQuery : null)

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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-primary">
            <Terminal className="h-5 w-5" />
            <span className="font-code text-sm font-bold uppercase tracking-widest">Secure Inbox</span>
          </div>
          <h1 className="text-3xl font-headline font-bold">Command Center</h1>
        </div>
        <div className="px-4 py-2 bg-muted rounded border border-border flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-code uppercase text-muted-foreground">User: {username}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Messages List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5 text-secondary" />
            <h2 className="text-xl font-headline font-bold">Transmissions</h2>
          </div>
          
          <ScrollArea className="h-[600px] rounded-xl border border-border bg-card/50 p-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Terminal className="h-8 w-8 animate-spin text-primary opacity-50" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 italic">
                <p>No transmissions found in database.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages?.map((msg) => (
                  <Card key={msg.id} className="bg-background/50 border-border hover:border-primary/50 transition-colors">
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-primary">{msg.title}</CardTitle>
                        <time className="text-[10px] font-code text-muted-foreground">
                          {format(new Date(msg.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                        </time>
                      </div>
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

        {/* Access Logs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-headline font-bold">Access Logs</h2>
          </div>
          
          <div className="rounded-xl border border-border bg-card/50 overflow-hidden h-[600px] flex flex-col">
            <div className="bg-muted p-3 border-b border-border flex justify-between text-[10px] font-code uppercase text-muted-foreground">
              <span>Identifier</span>
              <span>Timestamp</span>
            </div>
            <ScrollArea className="flex-1 p-0">
              {logsLoading ? (
                 <div className="flex items-center justify-center h-full">
                  <Terminal className="h-4 w-4 animate-spin text-accent" />
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
                        {format(new Date(log.accessedAt), 'HH:mm:ss')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}