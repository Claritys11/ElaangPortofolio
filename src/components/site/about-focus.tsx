import Link from "next/link";
import { SplitHeading } from "@/components/motion/split-heading";
import { FocusIcon } from "@/components/site/focus-areas";
import { SectionLabel } from "@/components/site/section-label";
import { SkillBars } from "@/components/site/skill-bars";
import { shortTitle } from "@/lib/focus";
import type { ProjectItem, Skill, WriteupSummary } from "@/lib/types";

type Props = {
  focusName: string;
  pwnCount: number;
  webCount: number;
  total: number;
  topTags: string[];
  pwn: WriteupSummary[];
  web: WriteupSummary[];
  sysadmin: ProjectItem[];
  webdev: ProjectItem[];
  skills: Skill[];
};

function WriteupLinks({ items, tag }: { items: WriteupSummary[]; tag: string }) {
  return items.map((w) => (
    <li key={w.id} className="border-b border-border">
      <Link href={w.href} className="group flex items-baseline justify-between gap-6 py-4">
        <span className="font-display text-2xl font-semibold tracking-tight transition-transform duration-500 group-hover:translate-x-2 group-hover:text-primary">{w.title}</span>
        <span className="meta shrink-0">
          {tag} · {w.competition || w.difficulty}
        </span>
      </Link>
    </li>
  ));
}

function Complement({ icon, title, sub, line, projects }: { icon: "sysadmin" | "web"; title: string; sub: string; line: string; projects: ProjectItem[] }) {
  return (
    <div className="border-t border-border py-8">
      <div className="flex items-center gap-4">
        <FocusIcon kind={icon} className="h-8 w-[3.2rem] shrink-0 text-muted-foreground" />
        <div>
          <h3 className="font-display text-3xl font-semibold tracking-tight">{title}</h3>
          <p className="meta mt-1">{sub}</p>
        </div>
      </div>
      <p className="mt-4 max-w-md text-muted-foreground">{line}</p>
      {projects.length > 0 && (
        <p className="meta mt-4 flex flex-wrap gap-x-3 gap-y-1">
          <span>built:</span>
          {projects.map((p) => {
            const external = !!p.projectUrl?.startsWith("http");
            return (
              <Link
                key={p.id}
                href={p.projectUrl ?? "/projects"}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="border-b border-border text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {shortTitle(p.title)}
              </Link>
            );
          })}
        </p>
      )}
    </div>
  );
}

/** Cybersecurity leads (pwn first, then web); sysadmin and web development follow as the skills behind it. */
export function AboutFocus({ focusName, pwnCount, webCount, total, topTags, pwn, web, sysadmin, webdev, skills }: Props) {
  return (
    <section className="mt-32 grid gap-16 md:mt-44 md:grid-cols-12">
      <div className="md:col-span-6">
        <SectionLabel index={3} name="focus" />
        <div className="mt-6 flex items-center gap-3">
          <FocusIcon kind="pwn" className="h-9 w-[3.6rem] text-foreground" />
          <span className="meta">
            <span className="text-primary">main focus</span> · cybersecurity
          </span>
        </div>
        <h2 className="mt-6 font-display text-[11.5vw] leading-[0.9] font-black tracking-[-0.04em] md:text-8xl">
          {focusName.split(" ").map((word, i) => (
            <SplitHeading key={word} as="span" text={word} onScroll delay={i * 0.12} className={i === 0 ? "block whitespace-nowrap text-primary" : "block whitespace-nowrap"} />
          ))}
          <span className="sr-only"> (pwn)</span>
        </h2>
        <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-muted-foreground md:text-4xl">
          <span className="text-foreground">&amp;</span> Web Exploitation
        </p>
        <p className="mt-8 max-w-md text-muted-foreground">
          {pwnCount} of {total} writeups are pwn{topTags.length > 0 ? ` (mostly ${topTags.join(", ")})` : ""}
          {webCount > 0 ? `, ${webCount} on web` : ""}.
        </p>
        {pwn.length + web.length > 0 && (
          <ul className="mt-10 border-t border-border">
            <WriteupLinks items={pwn} tag="pwn" />
            <WriteupLinks items={web} tag="web" />
          </ul>
        )}
      </div>

      <div className="md:col-span-5 md:col-start-8 md:pt-16">
        <p className="meta mb-2">alongside</p>
        <Complement icon="sysadmin" title="System Administration" sub="linux · servers · infrastructure" line="Running Linux as my daily driver and self-hosting my own services." projects={sysadmin} />
        <Complement icon="web" title="Web Development" sub="frontend · backend" line="Full-stack web apps, from the interface down to the database." projects={webdev} />
        {skills.length > 0 && (
          <div className="border-t border-border pt-8">
            <p className="meta mb-6">skills</p>
            <SkillBars skills={skills} />
          </div>
        )}
      </div>
    </section>
  );
}
