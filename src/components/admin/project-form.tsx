"use client";

import { Field } from "@/components/admin/field";
import { useFormAction } from "@/components/admin/use-form-action";
import { ImageField } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveProject } from "@/lib/admin/actions/projects";

type Initial = { id?: string; title?: string | null; description?: string | null; imageUrl?: string | null; projectUrl?: string | null; category?: string | null; tags?: string[] };

export function ProjectForm({ initial = {} }: { initial?: Initial }) {
  const [state, action, pending] = useFormAction(saveProject);
  const f = state.fields ?? {};
  return (
    <form onSubmit={action} className="grid max-w-2xl gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Field label="Title" name="title" error={f.title}>
        <Input id="title" name="title" defaultValue={initial.title ?? ""} required />
      </Field>
      <Field label="Category" name="category" error={f.category}>
        <Input id="category" name="category" defaultValue={initial.category ?? ""} />
      </Field>
      <Field label="Description" name="description" error={f.description}>
        <Textarea id="description" name="description" rows={5} defaultValue={initial.description ?? ""} />
      </Field>
      <Field label="Image" name="imageUrl" error={f.imageUrl}>
        <ImageField name="imageUrl" defaultValue={initial.imageUrl} />
      </Field>
      <Field label="Project URL" name="projectUrl" error={f.projectUrl}>
        <Input id="projectUrl" name="projectUrl" defaultValue={initial.projectUrl ?? ""} />
      </Field>
      <Field label="Tags" name="tags" hint="Comma separated" error={f.tags}>
        <Input id="tags" name="tags" defaultValue={(initial.tags ?? []).join(", ")} />
      </Field>
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save project"}
      </Button>
    </form>
  );
}
