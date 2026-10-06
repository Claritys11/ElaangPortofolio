"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/components/admin/image-field";
import { cn } from "@/lib/utils";

type Props = { name: string; defaultValue?: string; externalValue?: { html: string; nonce: number } };

export function RichEditor({ name, defaultValue = "", externalValue }: Props) {
  const [html, setHtml] = useState(defaultValue);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true }, heading: { levels: [2, 3, 4] } }),
      Image,
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: "Explain the bug, the primitive, the exploit…" }),
    ],
    content: defaultValue,
    editorProps: { attributes: { class: "writeup-prose min-h-[480px] max-w-none p-4 outline-none" } },
    onUpdate: ({ editor: e }) => setHtml(e.getHTML()),
  });

  // Content arriving from PDF import replaces the document; emitUpdate routes it through onUpdate.
  useEffect(() => {
    if (editor && externalValue) editor.commands.setContent(externalValue.html, { emitUpdate: true });
  }, [editor, externalValue]);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      h3: e?.isActive("heading", { level: 3 }) ?? false,
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      code: e?.isActive("code") ?? false,
      codeBlock: e?.isActive("codeBlock") ?? false,
      bullet: e?.isActive("bulletList") ?? false,
      ordered: e?.isActive("orderedList") ?? false,
      quote: e?.isActive("blockquote") ?? false,
    }),
  });

  const btn = (active: boolean | undefined) => cn("rounded px-2 py-1 font-mono text-xs", active ? "bg-primary text-primary-foreground" : "hover:bg-secondary");
  const c = () => editor!.chain().focus();

  return (
    <div className="rounded-md border border-input">
      <div className="flex flex-wrap gap-1 border-b border-input p-2">
        <button type="button" className={btn(s?.h2)} onClick={() => c().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button type="button" className={btn(s?.h3)} onClick={() => c().toggleHeading({ level: 3 }).run()}>
          H3
        </button>
        <button type="button" className={btn(s?.bold)} onClick={() => c().toggleBold().run()}>
          B
        </button>
        <button type="button" className={btn(s?.italic)} onClick={() => c().toggleItalic().run()}>
          I
        </button>
        <button type="button" className={btn(s?.code)} onClick={() => c().toggleCode().run()}>
          `code`
        </button>
        <button type="button" className={btn(s?.codeBlock)} onClick={() => c().toggleCodeBlock().run()}>
          {"{ }"}
        </button>
        <button type="button" className={btn(s?.bullet)} onClick={() => c().toggleBulletList().run()}>
          • list
        </button>
        <button type="button" className={btn(s?.ordered)} onClick={() => c().toggleOrderedList().run()}>
          1. list
        </button>
        <button type="button" className={btn(s?.quote)} onClick={() => c().toggleBlockquote().run()}>
          quote
        </button>
        <button
          type="button"
          className={btn(false)}
          onClick={() => {
            const href = prompt("Link URL");
            if (href) c().setLink({ href }).run();
            else c().unsetLink().run();
          }}
        >
          link
        </button>
        <button type="button" className={btn(false)} onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          table
        </button>
        <label className={cn(btn(false), "cursor-pointer")}>
          image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                c()
                  .setImage({ src: (await uploadFile(f)).url, alt: f.name })
                  .run();
              } catch (err) {
                toast.error((err as Error).message);
              }
            }}
          />
        </label>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
