
"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Terminal, Copy, Check, Loader2, RotateCcw } from "lucide-react"
import { refineContent, ContentRefinementInput, ContentRefinementOutput } from "@/ai/flows/content-refinement-assistant-flow"
import { useToast } from "@/hooks/use-toast"

export default function AIAssistantPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [result, setResult] = React.useState<ContentRefinementOutput | null>(null)
  
  const [formData, setFormData] = React.useState<ContentRefinementInput>({
    originalContent: "",
    contentType: "about_me",
    keywords: [],
    desiredTone: "professional hacker"
  })

  const [keywordInput, setKeywordInput] = React.useState("")

  const handleSubmit = async () => {
    if (!formData.originalContent.trim()) {
      toast({
        title: "Input required",
        description: "Please provide some content to refine.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const output = await refineContent(formData)
      setResult(output)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate refined content. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result?.refinedContent) {
      navigator.clipboard.writeText(result.refinedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied!",
        description: "Content copied to clipboard."
      })
    }
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords?.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), keywordInput.trim()]
      })
      setKeywordInput("")
    }
  }

  const removeKeyword = (kw: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords?.filter(k => k !== kw) || []
    })
  }

  const reset = () => {
    setResult(null)
    setFormData({
      originalContent: "",
      contentType: "about_me",
      keywords: [],
      desiredTone: "professional hacker"
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-4 mb-12 text-center">
        <div className="inline-flex items-center space-x-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="font-code text-sm font-bold uppercase tracking-widest">AI Engine</span>
        </div>
        <h1 className="text-4xl font-headline font-bold">Bio & Content Assistant</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Optimize your professional summaries and project descriptions with our specialized 
          AI assistant designed for cybersecurity portfolios.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Parameters</CardTitle>
            <CardDescription>Configure the refinement output</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select 
                value={formData.contentType} 
                onValueChange={(value: "about_me" | "project_description" | "ctf_writeup_summary") =>
                  setFormData({ ...formData, contentType: value })
                }
              >
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="about_me">About Me Bio</SelectItem>
                  <SelectItem value="project_description">Project Description</SelectItem>
                  <SelectItem value="ctf_writeup_summary">CTF Write-up Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Original Content</Label>
              <Textarea 
                placeholder="Draft your content here..." 
                className="min-h-[150px] bg-muted/50 border-border resize-none"
                value={formData.originalContent}
                onChange={(e) => setFormData({...formData, originalContent: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Target Keywords (Optional)</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Penetration Testing" 
                  className="bg-muted/50 border-border"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button variant="secondary" size="sm" onClick={addKeyword}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.keywords?.map(kw => (
                  <span key={kw} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded flex items-center">
                    {kw}
                    <button className="ml-1 hover:text-white" onClick={() => removeKeyword(kw)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Input 
                placeholder="e.g. highly technical, academic, casual"
                className="bg-muted/50 border-border"
                value={formData.desiredTone}
                onChange={(e) => setFormData({...formData, desiredTone: e.target.value})}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> RUNNING COMPILATION...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> GENERATE REFINED CONTENT</>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-card border-border flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl font-headline">Refined Output</CardTitle>
              <CardDescription>Optimized version</CardDescription>
            </div>
            {result && (
              <Button variant="ghost" size="icon" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-full min-h-[300px] bg-muted/30 border border-border/50 rounded-lg p-6 font-body text-sm overflow-y-auto relative">
              {!result && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                  <Terminal className="h-10 w-10" />
                  <p className="font-code text-xs uppercase tracking-widest">Awaiting Input Signal</p>
                </div>
              )}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="font-code text-xs animate-pulse">OPTIMIZING CONTENT...</p>
                  </div>
                </div>
              )}
              {result && (
                <div className="space-y-6">
                  <p className="leading-relaxed whitespace-pre-wrap">{result.refinedContent}</p>
                  
                  {result.usedKeywords && result.usedKeywords.length > 0 && (
                    <div className="pt-6 border-t border-border">
                      <p className="text-[10px] font-code uppercase text-muted-foreground mb-2">Integrated Keywords:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.usedKeywords.map(kw => (
                          <span key={kw} className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          {result && (
            <CardFooter>
              <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10" onClick={handleCopy}>
                {copied ? <><Check className="mr-2 h-4 w-4" /> COPIED</> : <><Copy className="mr-2 h-4 w-4" /> COPY TO CLIPBOARD</>}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
