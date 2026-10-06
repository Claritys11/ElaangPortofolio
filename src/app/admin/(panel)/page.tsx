import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

const daysAgo = (d: number) => new Date(Date.now() - d * 864e5);

export default async function Dashboard() {
  await requireAdmin();
  const [writeups, projects, achievements, messages, latest, failed] = await Promise.all([
    prisma.writeup.count(),
    prisma.project.count(),
    prisma.achievement.count(),
    prisma.secureMessage.count(),
    prisma.secureMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.accessLog.count({ where: { accessSuccessful: false, accessedAt: { gte: daysAgo(7) } } }),
  ]);
  const cards = [
    ["Writeups", writeups, "/admin/writeups"],
    ["Projects", projects, "/admin/projects"],
    ["Achievements", achievements, "/admin/achievements"],
    ["Messages", messages, "/admin/messages"],
    ["Failed logins (7d)", failed, "/admin/logs"],
  ] as const;
  return (
    <div className="grid gap-10">
      <h1 className="font-display text-4xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-5">
        {cards.map(([label, n, href]) => (
          <Link key={label} href={href} className="bg-background p-5 hover:bg-secondary">
            <p className="meta">{label}</p>
            <p className="mt-2 font-display text-4xl font-black tabular-nums">{n}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2 className="meta mb-3">latest messages</h2>
        <ul className="divide-y divide-border border-y border-border">
          {latest.map((m) => (
            <li key={m.id} className="py-3">
              <p className="font-medium">{m.title ?? "(no subject)"}</p>
              <p className="line-clamp-1 text-sm text-muted-foreground">{m.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
