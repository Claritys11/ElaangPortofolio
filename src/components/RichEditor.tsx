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
  Eraser
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
        allowBase64: true,
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
        class: "prose prose-invert prose-sm focus:outline-none max-w-none min-h-[300px] p-4 bg-background rounded-b-lg border-x border-b border-border",
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

  if (!editor) return null

  return (
    <div className="w-full flex flex-col border border-border rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 bg-muted/50 border-b border-border items-center sticky top-0 z-10">
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
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} className="h-8 w-8 p-0">
            <Undo className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} className="h-8 w-8 p-0">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
