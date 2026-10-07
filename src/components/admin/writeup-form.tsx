"use client";

import { useState } from "react";
import { AttachmentsField } from "@/components/admin/attachments-field";
import { Field } from "@/components/admin/field";
import { useFormAction } from "@/components/admin/use-form-action";
import { PdfImport } from "@/components/admin/pdf-import";
import { RichEditor } from "@/components/admin/rich-editor";
import { TagInput } from "@/components/admin/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveWriteup } from "@/lib/admin/actions/writeups";
import { normalizeCategory } from "@/lib/data/mappers";
import type { TagStat } from "@/lib/tags";
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

export function WriteupForm({ initial = {}, tagIndex = [] }: { initial?: WriteupInitial; tagIndex?: TagStat[] }) {
  const [state, action, pending] = useFormAction(saveWriteup);
  const [title, setTitle] = useState(initial.title ?? "");
  const [summary, setSummary] = useState(initial.summary ?? "");
  const [category, setCategory] = useState(initial.category ?? "Pwn");
  const [competition, setCompetition] = useState(initial.competition ?? "");
  const [difficulty, setDifficulty] = useState(initial.difficulty ?? "");
  const [date, setDate] = useState(initial.date ?? "");
  const [tags, setTags] = useState({ list: initial.tags ?? [], key: 0 });
  const [imported, setImported] = useState<{ html: string; nonce: number }>();
  const f = state.fields ?? {};
  return (
    <form onSubmit={action} className="grid gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="flex justify-end">
        <PdfImport
          onImported={(d) => {
            if (d.title) setTitle(d.title);
            if (d.summary) setSummary(d.summary);
            if (d.competition) setCompetition(d.competition);
            if (d.category) setCategory(d.category);
            if (d.difficulty) setDifficulty(d.difficulty);
            if (d.date) setDate(d.date);
            if (d.tags?.length) setTags((t) => ({ list: [...new Set([...t.list, ...d.tags!])], key: t.key + 1 }));
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
          <Input id="category" name="category" list="categories" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="categories">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Competition" name="competition" error={f.competition}>
          <Input id="competition" name="competition" value={competition} onChange={(e) => setCompetition(e.target.value)} />
        </Field>
        <Field label="Difficulty" name="difficulty" error={f.difficulty}>
          <Input id="difficulty" name="difficulty" list="difficulties" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
          <datalist id="difficulties">
            {["Easy", "Medium", "Hard", "Insane"].map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <Field label="Date" name="date" error={f.date}>
          <Input id="date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Summary" name="summary" error={f.summary}>
        <Textarea id="summary" name="summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <Field label="Tags" name="tags" hint="Enter or comma adds a tag; suggestions come from your existing writeups. Technique tags power related-writeup recommendations." error={f.tags}>
        <TagInput key={tags.key} name="tags" defaultValue={tags.list} index={tagIndex} category={normalizeCategory(category)} />
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
