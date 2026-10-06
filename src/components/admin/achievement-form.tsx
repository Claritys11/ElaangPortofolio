"use client";

import { useActionState } from "react";
import { Field } from "@/components/admin/field";
import { ImageField } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveAchievement } from "@/lib/admin/actions/achievements";
import type { ActionState } from "@/lib/admin/form";

type Initial = {
  id?: string;
  title?: string | null;
  issuer?: string | null;
  platform?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  date?: string | null;
  proofScore?: number | null;
};

export function AchievementForm({ initial = {} }: { initial?: Initial }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveAchievement, { ok: true });
  const f = state.fields ?? {};
  return (
    <form action={action} className="grid max-w-2xl gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Field label="Title" name="title" error={f.title}>
        <Input id="title" name="title" defaultValue={initial.title ?? ""} required />
      </Field>
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Issuer" name="issuer" error={f.issuer}>
          <Input id="issuer" name="issuer" defaultValue={initial.issuer ?? ""} />
        </Field>
        <Field label="Platform" name="platform" error={f.platform}>
          <Input id="platform" name="platform" defaultValue={initial.platform ?? ""} />
        </Field>
        <Field label="Date" name="date" error={f.date}>
          <Input id="date" name="date" type="date" defaultValue={initial.date ?? ""} />
        </Field>
        <Field label="Proof score" name="proofScore" hint="Higher = shown larger. Empty = auto." error={f.proofScore}>
          <Input id="proofScore" name="proofScore" type="number" min={0} max={1000} defaultValue={initial.proofScore ?? ""} />
        </Field>
      </div>
      <Field label="Description" name="description" error={f.description}>
        <Textarea id="description" name="description" rows={4} defaultValue={initial.description ?? ""} />
      </Field>
      <Field label="Certificate image" name="imageUrl" error={f.imageUrl}>
        <ImageField name="imageUrl" defaultValue={initial.imageUrl} />
      </Field>
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save achievement"}
      </Button>
    </form>
  );
}
