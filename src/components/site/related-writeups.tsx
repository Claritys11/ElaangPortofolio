import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Media } from "@/components/site/media";
import { formatDate } from "@/lib/format";
import type { RelatedWriteup } from "@/lib/related";

export function RelatedWriteups({ items }: { items: RelatedWriteup[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-24" aria-labelledby="related-heading">
      <div className="mb-8 flex items-end justify-between">
        <h2 id="related-heading" className="font-display text-3xl font-bold tracking-tight md:text-5xl">
          Related writeups
        </h2>
        <Link href="/writeups" className="meta border-b border-primary pb-1 text-foreground">
          all writeups →
        </Link>
      </div>
      <Reveal stagger className="grid gap-px bg-border md:grid-cols-3">
        {items.map((w) => (
          <Link key={w.id} href={w.href} className="group flex flex-col bg-background">
            <div className="overflow-hidden">
              <Media src={w.cover} alt="" label={w.category} className="aspect-[16/9] w-full opacity-80 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100" />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <p className="meta">
                <span className="text-primary">{w.category}</span>
                {w.difficulty && ` · ${w.difficulty}`} · {formatDate(w.date)}
              </p>
              <h3 className="font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-primary">{w.title}</h3>
              {w.shared.length > 0 && (
                <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="Shared techniques">
                  {w.shared.map((t) => (
                    <li key={t} className="rounded-full border border-primary/40 px-2.5 py-0.5 font-mono text-[10px] tracking-wider text-primary uppercase">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Link>
        ))}
      </Reveal>
    </section>
  );
}
