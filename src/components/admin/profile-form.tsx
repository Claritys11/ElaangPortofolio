"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import { useFormAction } from "@/components/admin/use-form-action";
import { ImageField } from "@/components/admin/image-field";
import { ListEditor } from "@/components/admin/list-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveProfile } from "@/lib/admin/actions/profile";

type Seo = Record<string, unknown> & { jobTitle?: string; locale?: string; description?: string; keywords: string[]; sameAs: string[] };

export type ProfileInitial = {
  displayName: string;
  alias: string;
  navbarBrandMode: string;
  navbarBrandName: string;
  email: string;
  websiteUrl: string;
  githubUrl: string;
  instagramUrl: string;
  profileImageUrl: string;
  aboutText: string;
  philosophyText: string;
  technicalArsenal: { name: string; level: number }[];
  professionalJourney: { role: string; company: string; period: string; desc: string }[];
  educationHistory: { level: string; school: string; period: string }[];
  seo: Seo;
};

type TextKey = "displayName" | "alias" | "navbarBrandName" | "email" | "websiteUrl" | "githubUrl" | "instagramUrl";

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [state, action, pending] = useFormAction(saveProfile);
  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);
  const f = state.fields ?? {};
  const text = (name: TextKey, label: string) => (
    <Field label={label} name={name} error={f[name]}>
      <Input id={name} name={name} defaultValue={initial[name]} />
    </Field>
  );
  return (
    <form onSubmit={action} className="grid max-w-3xl gap-8">
      <div className="grid gap-6 md:grid-cols-2">
        {text("displayName", "Display name")}
        {text("alias", "Alias (also the footer glitch word)")}
        <Field label="Navbar brand" name="navbarBrandMode" error={f.navbarBrandMode}>
          <select id="navbarBrandMode" name="navbarBrandMode" defaultValue={initial.navbarBrandMode} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="default">Use alias</option>
            <option value="custom">Custom name</option>
          </select>
        </Field>
        {text("navbarBrandName", "Custom brand name")}
        {text("email", "Email")}
        {text("websiteUrl", "Website")}
        {text("githubUrl", "GitHub")}
        {text("instagramUrl", "Instagram")}
      </div>
      <Field label="Profile image" name="profileImageUrl" error={f.profileImageUrl}>
        <ImageField name="profileImageUrl" defaultValue={initial.profileImageUrl} />
      </Field>
      <Field label="About" name="aboutText" hint="The first two sentences appear on the home page." error={f.aboutText}>
        <Textarea id="aboutText" name="aboutText" rows={6} defaultValue={initial.aboutText} />
      </Field>
      <Field label="Philosophy / quote" name="philosophyText" hint='Format: "Quote." -Author' error={f.philosophyText}>
        <Input id="philosophyText" name="philosophyText" defaultValue={initial.philosophyText} />
      </Field>
      <Field label="Skills (Pwn / Binary Exploitation is always shown first)" name="technicalArsenal" error={f.technicalArsenal}>
        <ListEditor
          name="technicalArsenal"
          columns={[
            { key: "name", label: "Skill" },
            { key: "level", label: "Level 0–100", type: "number" },
          ]}
          defaultValue={initial.technicalArsenal}
        />
      </Field>
      <Field label="Journey" name="professionalJourney" error={f.professionalJourney}>
        <ListEditor
          name="professionalJourney"
          columns={[
            { key: "role", label: "Role" },
            { key: "company", label: "Place" },
            { key: "period", label: "Period" },
            { key: "desc", label: "Description", type: "textarea" },
          ]}
          defaultValue={initial.professionalJourney}
        />
      </Field>
      <Field label="Education" name="educationHistory" error={f.educationHistory}>
        <ListEditor
          name="educationHistory"
          columns={[
            { key: "level", label: "Level" },
            { key: "school", label: "School" },
            { key: "period", label: "Period" },
          ]}
          defaultValue={initial.educationHistory}
        />
      </Field>
      <fieldset className="grid gap-4 rounded-md border border-border p-4">
        <legend className="meta px-2">SEO</legend>
        <SeoFields initial={initial.seo} error={f.seo} />
      </fieldset>
      {state.message && !state.ok && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

function SeoFields({ initial, error }: { initial: Seo; error?: string[] }) {
  // State holds the whole stored object, so keys without an input (siteName, canonicalUrl, …) round-trip untouched.
  const [seo, setSeo] = useState<Seo>(initial);
  const list = (k: "keywords" | "sameAs") => seo[k].join(", ");
  const setList = (k: "keywords" | "sameAs", v: string) =>
    setSeo({
      ...seo,
      [k]: v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  return (
    <>
      <Input aria-label="Job title" placeholder="Job title" value={seo.jobTitle ?? ""} onChange={(e) => setSeo({ ...seo, jobTitle: e.target.value })} />
      <Input aria-label="Locale" placeholder="Locale (id_ID)" value={seo.locale ?? ""} onChange={(e) => setSeo({ ...seo, locale: e.target.value })} />
      <Textarea aria-label="Description" placeholder="Meta description" value={seo.description ?? ""} onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
      <Textarea aria-label="Keywords" placeholder="Keywords, comma separated" value={list("keywords")} onChange={(e) => setList("keywords", e.target.value)} />
      <Textarea aria-label="Same as" placeholder="Profile URLs, comma separated" value={list("sameAs")} onChange={(e) => setList("sameAs", e.target.value)} />
      {error?.[0] && <p className="text-sm text-destructive">{error[0]}</p>}
      <input type="hidden" name="seo" value={JSON.stringify(seo)} />
    </>
  );
}
