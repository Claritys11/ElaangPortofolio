"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Status = { kind: "idle" | "sending" | "sent" } | { kind: "error"; message: string; fields?: Record<string, string[]> };
type Msg = { from: "me" | "you"; text: string; error?: boolean };

const OPENING = ["Halo! 👋", "Got a binary for me?", "CTF team invite, collab, or a challenge you think I can't pwn. Drop it below, I read everything."];
const TYPING_MS = 900;

const field =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary";

function Bubble({ m }: { m: Msg }) {
  return (
    <li
      className={cn(
        "max-w-[85%] animate-in rounded-2xl px-4 py-2.5 text-sm leading-relaxed duration-300 fade-in slide-in-from-bottom-2",
        m.from === "me" ? "self-start rounded-bl-sm bg-muted" : "self-end rounded-br-sm bg-primary text-primary-foreground",
        m.error && "bg-destructive/15 text-destructive",
      )}
    >
      {m.text}
    </li>
  );
}

function Typing() {
  return (
    <li className="flex w-fit gap-1 self-start rounded-2xl rounded-bl-sm bg-muted px-4 py-3.5" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot size-1.5 rounded-full bg-foreground" />
      ))}
    </li>
  );
}

export function ContactSection({ name, imageUrl }: { name: string; imageUrl: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const timers = useRef<number[]>([]);

  /** Shows the dots for a beat, then the message. */
  const say = (m: Msg, after = 0) => {
    timers.current.push(window.setTimeout(() => setTyping(true), after));
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false);
        setMsgs((list) => [...list, m]);
      }, after + TYPING_MS),
    );
  };

  useEffect(() => {
    // The conversation starts when the chat comes into view, not on page load.
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (prefersReducedMotion()) {
          setMsgs(OPENING.map((text) => ({ from: "me", text })));
          return;
        }
        OPENING.forEach((text, i) => say({ from: "me", text }, i * (TYPING_MS + 500)));
      },
      { threshold: 0.4 },
    );
    if (ref.current) io.observe(ref.current);
    const pending = timers.current;
    return () => {
      io.disconnect();
      for (const t of pending) window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus({ kind: "sending" });
    const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
    if (res?.status === 201) {
      setStatus({ kind: "sent" });
      setMsgs((list) => [...list, { from: "you", text: String(data.message) }]);
      say({ from: "me", text: `Received${data.name ? `, ${String(data.name).split(" ")[0]}` : ""}. I'll get back to you soon.` }, 300);
      form.reset();
      return;
    }
    const json = await res?.json().catch(() => ({}));
    const message = json?.error ?? "Network error. Try email instead.";
    setStatus({ kind: "error", message, fields: json?.fields });
    setMsgs((list) => [...list, { from: "me", text: message, error: true }]);
  }

  const err = (n: string) => (status.kind === "error" ? status.fields?.[n]?.[0] : undefined);

  return (
    <section ref={ref} id="contact" className="mx-auto grid max-w-[1600px] gap-12 border-t border-border px-4 py-24 md:grid-cols-12 md:px-8 md:py-36">
      <div className="md:col-span-5">
        <SectionLabel index={6} name="contact" />
        <h2 className="mt-6 font-display text-5xl leading-[0.95] font-bold tracking-tight md:text-7xl">Say hi.</h2>
        <p className="mt-6 max-w-sm text-muted-foreground">CTF team invites, collabs, or a challenge you think I can&apos;t pwn. I read everything.</p>
      </div>

      <div className="flex h-[34rem] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20 md:col-span-6 md:col-start-7">
        <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <Media src={imageUrl} alt="" className="size-9 rounded-full grayscale" />
          <div className="leading-tight">
            <p className="text-sm font-medium">{name}</p>
            <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-500 align-middle" />
              online · Malang
            </p>
          </div>
        </header>

        <ol ref={log} className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-5" aria-live="polite">
          {msgs.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
          {typing && <Typing />}
        </ol>

        <form onSubmit={onSubmit} className="relative grid gap-2 border-t border-border p-3" noValidate>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="sr-only">Name</span>
              <input name="name" required maxLength={80} placeholder="Name" className={field} aria-invalid={!!err("name")} />
            </label>
            <label>
              <span className="sr-only">Email or handle</span>
              <input name="contact" required maxLength={120} placeholder="Email / handle" className={field} aria-invalid={!!err("contact")} />
            </label>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="sr-only">Message</span>
              <textarea
                name="message"
                required
                rows={2}
                maxLength={4000}
                placeholder="Write me a message…"
                className={cn(field, "resize-none")}
                aria-invalid={!!err("message")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
                }}
              />
            </label>
            <button
              type="submit"
              disabled={status.kind === "sending"}
              aria-label={status.kind === "sending" ? "Sending" : "Send message"}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-60"
            >
              <ArrowUp className={cn("size-5", status.kind === "sending" && "animate-pulse")} />
            </button>
          </div>
          {/* Honeypot: hidden from people, filled by bots. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
        </form>
      </div>
    </section>
  );
}
