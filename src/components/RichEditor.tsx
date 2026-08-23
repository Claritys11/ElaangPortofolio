"use client"

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3, 
  Image as ImageIcon,
  Link as LinkIcon,
  Quote,
  Undo,
  Redo,
  Eraser,
  Code2,
  Minus,
  Pilcrow,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  onImageUpload?: (file: File) => Promise<string>
}

export function RichEditor({
  content,
  onChange,
  placeholder = "Start typing your documentation...",
  onImageUpload,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "notion-editor prose prose-invert prose-sm focus:outline-none max-w-none min-h-[520px] bg-background px-5 py-6 sm:px-8",
      },
    },
  })

  // Sync content if it changes externally
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        if (onImageUpload) {
          try {
            const imageUrl = await onImageUpload(file)
            if (imageUrl) {
              editor?.chain().focus().setImage({ src: imageUrl }).run()
            }
          } catch {
          }
          return
        }

        const reader = new FileReader()
        reader.onload = (readerEvent) => {
          const result = readerEvent.target?.result as string
          if (result) {
            editor?.chain().focus().setImage({ src: result }).run()
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const setLink = () => {
    const url = window.prompt('URL')
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  const insertWriteupTemplate = () => {
    editor
      ?.chain()
      .focus()
      .insertContent(`
        <h2>Recon</h2>
        <p>Challenge overview, files, protections, and first observations.</p>
        <pre><code>$ file chall
$ checksec --file=chall</code></pre>
        <h2>Vulnerability</h2>
        <p>Explain the bug, root cause, and the important constraints.</p>
        <h2>Exploit Strategy</h2>
        <p>Walk through the plan step by step.</p>
        <h2>Solver</h2>
        <pre><code># paste exploit or important snippet here</code></pre>
        <h2>Flag</h2>
        <p>Final result and short lesson learned.</p>
      `)
      .run()
  }

  if (!editor) return null

  return (
    <div className="w-full flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/50 p-2 items-center sticky top-0 z-10">
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-primary/20 text-primary")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-primary/20 text-primary")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("underline") && "bg-primary/20 text-primary")}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-border mx-1" />

        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 1 }) && "bg-primary/20 text-primary")}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-primary/20 text-primary")}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 3 }) && "bg-primary/20 text-primary")}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-primary/20 text-primary")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-primary/20 text-primary")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("blockquote") && "bg-primary/20 text-primary")}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("codeBlock") && "bg-primary/20 text-primary")}
        >
          <Code2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button type="button" variant="ghost" size="sm" onClick={addImage} className="h-8 w-8 p-0">
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={setLink} className={cn("h-8 w-8 p-0", editor.isActive("link") && "bg-primary/20 text-primary")}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className="h-8 w-8 p-0">
          <Eraser className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={insertWriteupTemplate} className="h-8 gap-2 px-2 font-code text-[10px] uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            Template
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} className="h-8 w-8 p-0">
            <Undo className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} className="h-8 w-8 p-0">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-card/40 px-3 py-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2.5 py-1 font-code text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Pilcrow className="h-3.5 w-3.5" />
          Text
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="rounded-md border border-border/70 bg-background/60 px-2.5 py-1 font-code text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          Section
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="rounded-md border border-border/70 bg-background/60 px-2.5 py-1 font-code text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          Code Block
        </button>
        <span className="ml-auto hidden text-[10px] text-muted-foreground sm:inline">
          Use headings to generate the public table of contents.
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
