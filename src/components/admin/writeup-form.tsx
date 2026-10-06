"use client";

import { useActionState, useState } from "react";
import { AttachmentsField } from "@/components/admin/attachments-field";
import { Field } from "@/components/admin/field";
import { PdfImport } from "@/components/admin/pdf-import";
import { RichEditor } from "@/components/admin/rich-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveWriteup } from "@/lib/admin/actions/writeups";
import type { ActionState } from "@/lib/admin/form";
import type { Attachment } from "@/lib/types";

export type WriteupInitial = {
  id?: string;
  title?: string | null;
  slug?: string | null;
  competition?: string | null;
  category?: string | null;
  difficulty?: string | null;
  date?: string | null;
  summary?: string | null;
  content?: string | null;
  flag?: string | null;
  tags?: string[];
  attachments?: Attachment[];
};

const CATEGORIES = ["Pwn", "Reverse", "Forensics", "Crypto", "Web", "Misc", "OSINT"];

export function WriteupForm({ initial = {} }: { initial?: WriteupInitial }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveWriteup, { ok: true });
  const [title, setTitle] = useState(initial.title ?? "");
  const [summary, setSummary] = useState(initial.summary ?? "");
  const [imported, setImported] = useState<{ html: string; nonce: number }>();
  const f = state.fields ?? {};
  return (
    <form action={action} className="grid gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="flex justify-end">
        <PdfImport
          onImported={(d) => {
            if (d.title) setTitle(d.title);
            if (d.summary) setSummary(d.summary);
            setImported({ html: d.content, nonce: Date.now() });
          }}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Title" name="title" error={f.title}>
          <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Slug" name="slug" hint="Empty = category-title" error={f.slug}>
          <Input id="slug" name="slug" defaultValue={initial.slug ?? ""} />
        </Field>
        <Field label="Category" name="category" error={f.category}>
          <Input id="category" name="category" list="categories" defaultValue={initial.category ?? "Pwn"} />
          <datalist id="categories">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Competition" name="competition" error={f.competition}>
          <Input id="competition" name="competition" defaultValue={initial.competition ?? ""} />
        </Field>
        <Field label="Difficulty" name="difficulty" error={f.difficulty}>
          <Input id="difficulty" name="difficulty" list="difficulties" defaultValue={initial.difficulty ?? ""} />
          <datalist id="difficulties">
            {["Easy", "Medium", "Hard", "Insane"].map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <Field label="Date" name="date" error={f.date}>
          <Input id="date" name="date" type="date" defaultValue={initial.date ?? ""} />
        </Field>
      </div>
      <Field label="Summary" name="summary" error={f.summary}>
        <Textarea id="summary" name="summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <Field label="Tags" name="tags" hint="Comma separated" error={f.tags}>
        <Input id="tags" name="tags" defaultValue={(initial.tags ?? []).join(", ")} />
      </Field>
      <Field label="Content" name="content" error={f.content}>
        <RichEditor name="content" defaultValue={initial.content ?? ""} externalValue={imported} />
      </Field>
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Flag" name="flag" error={f.flag}>
          <Input id="flag" name="flag" defaultValue={initial.flag ?? ""} className="font-mono" />
        </Field>
        <Field label="Attachments" name="attachments" error={f.attachments}>
          <AttachmentsField name="attachments" defaultValue={initial.attachments} />
        </Field>
      </div>
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save writeup"}
      </Button>
    </form>
  );
}
