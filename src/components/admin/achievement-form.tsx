"use client";

import { Field } from "@/components/admin/field";
import { useFormAction } from "@/components/admin/use-form-action";
import { CertificateField } from "@/components/admin/certificate-field";
import { ProofScoreField } from "@/components/admin/proof-score-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveAchievement } from "@/lib/admin/actions/achievements";

type Initial = {
  id?: string;
  title?: string | null;
  issuer?: string | null;
  platform?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  date?: string | null;
  proofScore?: number | null;
  documentUrl?: string | null;
};

export function AchievementForm({ initial = {} }: { initial?: Initial }) {
  const [state, action, pending] = useFormAction(saveAchievement);
  const f = state.fields ?? {};
  return (
    <form onSubmit={action} className="grid max-w-2xl gap-6">
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
        <Field label="Proof score (0–10)" name="proofScore" hint="7+ shows largest, 4–6 large, 0–3 normal." error={f.proofScore}>
          <ProofScoreField defaultValue={initial.proofScore} />
        </Field>
      </div>
      <Field label="Description" name="description" error={f.description}>
        <Textarea id="description" name="description" rows={4} defaultValue={initial.description ?? ""} />
      </Field>
      <Field label="Certificate (image or PDF)" name="imageUrl" hint="A PDF keeps the original and shows a preview rendered from page 1." error={f.imageUrl}>
        <CertificateField defaultImage={initial.imageUrl} defaultDocument={initial.documentUrl} />
      </Field>
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save achievement"}
      </Button>
    </form>
  );
}
