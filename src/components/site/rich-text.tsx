import { Binary, CodeXml, Flag, type LucideIcon, Server, ShieldHalf, SquareTerminal } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

/** Words that earn an inline icon chip. The text comes from the admin, so these are matched, not placed. */
const CHIPS: [RegExp, LucideIcon][] = [
  [/cybersecurity/i, ShieldHalf],
  [/linux( systems)?/i, SquareTerminal],
  [/server infrastructure|infrastructure/i, Server],
  [/web development/i, CodeXml],
  [/\bpwn\b/i, Binary],
  [/CTF competitions/i, Flag],
];
const MAX_CHIPS = 4;
/** The first of these found in the text gets the highlighter stroke: the main focus. */
const HIGHLIGHTS = [/binary and web exploitation/i, /binary exploitation/i, /exploitation/i];

type Piece = { kind: "text"; text: string } | { kind: "chip"; text: string; Icon: LucideIcon } | { kind: "mark"; text: string };

/** Splits text into plain runs, chip-prefixed words and one highlighted phrase. */
function decorate(text: string): Piece[] {
  const marks: { start: number; end: number; piece: Piece }[] = [];
  const hl = HIGHLIGHTS.map((r) => r.exec(text)).find(Boolean);
  if (hl) marks.push({ start: hl.index, end: hl.index + hl[0].length, piece: { kind: "mark", text: hl[0] } });
  for (const [re, Icon] of CHIPS) {
    if (marks.filter((m) => m.piece.kind === "chip").length >= MAX_CHIPS) break;
    const m = re.exec(text);
    if (!m || marks.some((x) => m.index < x.end && m.index + m[0].length > x.start)) continue;
    marks.push({ start: m.index, end: m.index + m[0].length, piece: { kind: "chip", text: m[0], Icon } });
  }
  marks.sort((a, b) => a.start - b.start);
  const out: Piece[] = [];
  let at = 0;
  for (const m of marks) {
    if (m.start > at) out.push({ kind: "text", text: text.slice(at, m.start) });
    out.push(m.piece);
    at = m.end;
  }
  if (at < text.length) out.push({ kind: "text", text: text.slice(at) });
  return out;
}

/** Highlighter colour, as a background image so it can sweep in via background-size. */
const MARK =
  "bg-transparent bg-[linear-gradient(color-mix(in_oklch,var(--primary)_55%,transparent),color-mix(in_oklch,var(--primary)_55%,transparent))] [background-position:0_86%] bg-no-repeat [background-size:100%_0.32em] text-inherit [box-decoration-break:clone]";

/**
 * The intro with its inline icon chips (.rt-chip) and highlighted phrase (.rt-mark). Rendered fully drawn,
 * so it reads correctly without JS; the page animates those classes in.
 */
export function RichText({ text }: { text: string }) {
  return decorate(text).map((p, i) =>
    p.kind === "text" ? (
      <Fragment key={i}>{p.text}</Fragment>
    ) : p.kind === "mark" ? (
      <mark key={i} className={cn("rt-mark", MARK)}>
        {p.text}
      </mark>
    ) : (
      <Fragment key={i}>
        <span
          aria-hidden
          className={cn(
            "rt-chip mr-[0.2em] inline-grid size-[0.82em] translate-y-[0.06em] place-items-center rounded-[0.2em] align-baseline",
            i % 2 ? "bg-foreground text-background" : "bg-primary text-primary-foreground",
          )}
        >
          <p.Icon className="size-[0.5em]" strokeWidth={2.5} />
        </span>
        {p.text}
      </Fragment>
    ),
  );
}
