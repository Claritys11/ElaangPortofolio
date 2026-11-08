"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { EditorView } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/components/admin/image-field";
import { cn } from "@/lib/utils";

type Props = { name: string; defaultValue?: string; externalValue?: { html: string; nonce: number }; onUploadingChange?: (uploading: boolean) => void };

const imagesIn = (files: FileList | null | undefined) => Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));

/** Runs fn on the image node showing `src`, wherever edits since then have moved it. */
function withImageNode(view: EditorView, src: string, fn: (pos: number, size: number, attrs: Record<string, unknown>) => void) {
  view.state.doc.descendants((node, pos) => {
    if (node.type.name === "image" && node.attrs.src === src) fn(pos, node.nodeSize, node.attrs);
  });
}

export function RichEditor({ name, defaultValue = "", externalValue, onUploadingChange }: Props) {
  const [html, setHtml] = useState(defaultValue);
  const [uploading, setUploading] = useState(0);

  /**
   * Shows each image straight away from a local preview, then swaps in the real URL once uploaded,
   * so writing can carry on during the upload. The form can't be saved while a preview is in the document.
   */
  const insertImages = (view: EditorView, files: File[], at?: number) => {
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      // Clipboard screenshots are all called "image.png"; that says nothing to a screen reader.
      const alt = /^image\.\w+$/i.test(file.name) ? "" : file.name;
      const node = view.state.schema.nodes.image.create({ src: preview, alt });
      const { tr } = view.state;
      view.dispatch(at === undefined ? tr.replaceSelectionWith(node) : tr.insert(at, node));
      setUploading((n) => n + 1);
      uploadFile(file)
        .then(({ url }) => withImageNode(view, preview, (pos, _size, attrs) => view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...attrs, src: url }))))
        .catch((err: Error) => {
          withImageNode(view, preview, (pos, size) => view.dispatch(view.state.tr.delete(pos, pos + size)));
          toast.error(`${file.name}: ${err.message}`);
        })
        .finally(() => {
          URL.revokeObjectURL(preview);
          setUploading((n) => n - 1);
        });
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true }, heading: { levels: [2, 3, 4] } }),
      Image,
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: "Explain the bug, the primitive, the exploit…" }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: { class: "writeup-prose min-h-[480px] max-w-none p-4 outline-none" },
      handlePaste: (view, event) => {
        const files = imagesIn(event.clipboardData?.files);
        // Copied text can carry a picture of itself (spreadsheets, Word); then the text is what was meant.
        if (!files.length || event.clipboardData?.getData("text/plain").trim()) return false;
        insertImages(view, files);
        return true;
      },
      handleDrop: (view, event) => {
        const files = imagesIn(event.dataTransfer?.files);
        if (!files.length) return false;
        event.preventDefault();
        insertImages(view, files, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos);
        return true;
      },
    },
    onUpdate: ({ editor: e }) => setHtml(e.getHTML()),
  });

  // Content arriving from PDF import replaces the document; emitUpdate routes it through onUpdate.
  useEffect(() => {
    if (editor && externalValue) editor.commands.setContent(externalValue.html, { emitUpdate: true });
  }, [editor, externalValue]);

  useEffect(() => onUploadingChange?.(uploading > 0), [uploading, onUploadingChange]);

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
      {/* Sticks to the top of the window, so the tools stay in reach in a long writeup. */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 rounded-t-md border-b border-input bg-background p-2">
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
            multiple
            onChange={(e) => {
              if (editor) insertImages(editor.view, imagesIn(e.target.files));
              e.target.value = "";
            }}
          />
        </label>
        <span className="meta ml-auto px-2" role="status">
          {uploading > 0 ? `uploading ${uploading}…` : "paste or drop images"}
        </span>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
