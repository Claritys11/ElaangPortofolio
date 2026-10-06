import { ProfileForm } from "@/components/admin/profile-form";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { parseObjectArray, parseRecord, parseStringArray } from "@/lib/json";

export default async function ProfilePage() {
  await requireAdmin();
  const r = await prisma.profileSettings.findUnique({ where: { id: "main" } });
  const seo = parseRecord(r?.seoSettingsJson);
  const s = (v: string | null | undefined) => v ?? "";
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Profile</h1>
      <ProfileForm
        initial={{
          displayName: s(r?.displayName),
          alias: s(r?.alias),
          navbarBrandMode: r?.navbarBrandMode ?? "default",
          navbarBrandName: s(r?.navbarBrandName),
          email: s(r?.email),
          websiteUrl: s(r?.websiteUrl),
          githubUrl: s(r?.githubUrl),
          instagramUrl: s(r?.instagramUrl),
          profileImageUrl: s(r?.profileImageUrl),
          aboutText: s(r?.aboutText),
          philosophyText: s(r?.philosophyText),
          technicalArsenal: parseObjectArray(r?.technicalArsenalJson, (x) => (typeof x.name === "string" ? { name: x.name, level: Number(x.level) || 0 } : null)),
          professionalJourney: parseObjectArray(r?.professionalJourneyJson, (x) =>
            typeof x.role === "string" ? { role: x.role, company: String(x.company ?? ""), period: String(x.period ?? ""), desc: String(x.desc ?? "") } : null,
          ),
          educationHistory: parseObjectArray(r?.educationHistoryJson, (x) =>
            typeof x.school === "string" ? { level: String(x.level ?? ""), school: x.school, period: String(x.period ?? "") } : null,
          ),
          seo: { ...seo, keywords: parseStringArray(seo.keywords), sameAs: parseStringArray(seo.sameAs) },
        }}
      />
    </div>
  );
}
