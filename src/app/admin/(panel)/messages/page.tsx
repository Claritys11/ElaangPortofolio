import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { deleteMessage, deleteMessages } from "@/lib/admin/actions/messages";
import { pageParam } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

const PAGE = 50;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const where = q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { content: { contains: q, mode: "insensitive" as const } }] } : {};
  const [total, rows] = await Promise.all([
    prisma.secureMessage.count({ where }),
    prisma.secureMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = q ? `&q=${encodeURIComponent(q)}` : "";
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Messages <span className="meta">{total}</span>
        </h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="search" aria-label="Search messages" className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" />
          <Button size="sm" variant="secondary">
            Search
          </Button>
        </form>
      </div>
      <form action={deleteMessages} className="grid gap-3">
        <div>
          <Button size="sm" variant="destructive" type="submit">
            Delete selected
          </Button>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((m) => (
            <li key={m.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-4 py-4">
              <input type="checkbox" name="ids" value={m.id} aria-label={`Select ${m.title ?? "message"}`} className="mt-1.5" />
              <details>
                <summary className="cursor-pointer">
                  <span className="font-medium">{m.title ?? "(no subject)"}</span>
                  <span className="meta ml-3">{m.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
                </summary>
                <pre className="mt-3 font-sans text-sm break-words whitespace-pre-wrap text-muted-foreground">{m.content}</pre>
              </details>
              <DeleteButton action={deleteMessage.bind(null, m.id)} />
            </li>
          ))}
        </ul>
      </form>
      <nav className="flex items-center gap-4 text-sm">
        {page > 1 && <Link href={`?page=${page - 1}${qs}`}>← prev</Link>}
        <span className="meta">
          page {page} / {pages}
        </span>
        {page < pages && <Link href={`?page=${page + 1}${qs}`}>next →</Link>}
      </nav>
    </div>
  );
}
