"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { SectionLabel } from "@/components/site/section-label";

type Status = { kind: "idle" | "sending" | "sent" } | { kind: "error"; message: string; fields?: Record<string, string[]> };

const field =
  "w-full border-0 border-b border-border bg-transparent py-3 text-lg outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary";

export function ContactSection() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
    if (res?.status === 201) {
      setStatus({ kind: "sent" });
      return;
    }
    const json = await res?.json().catch(() => ({}));
    setStatus({ kind: "error", message: json?.error ?? "Network error. Try email instead.", fields: json?.fields });
  }

  const err = (name: string) => (status.kind === "error" ? status.fields?.[name]?.[0] : undefined);

  return (
    <section id="contact" className="mx-auto grid max-w-[1600px] gap-12 border-t border-border px-4 py-24 md:grid-cols-12 md:px-8 md:py-36">
      <div className="md:col-span-5">
        <SectionLabel index={5} name="contact" />
        <h2 className="mt-6 font-display text-5xl leading-[0.95] font-bold tracking-tight md:text-7xl">Say hi.</h2>
        <p className="mt-6 max-w-sm text-muted-foreground">CTF team invites, collabs, or a challenge you think I can&apos;t pwn. I read everything.</p>
      </div>
      <Reveal className="md:col-span-6 md:col-start-7">
        {status.kind === "sent" ? (
          <p className="font-display text-3xl" role="status">
            Received. I&apos;ll get back to you soon.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="relative grid gap-8" noValidate>
            <div className="grid gap-8 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="meta">name</span>
                <input name="name" required maxLength={80} className={field} aria-invalid={!!err("name")} />
                {err("name") && <span className="text-sm text-destructive">{err("name")}</span>}
              </label>
              <label className="grid gap-1">
                <span className="meta">email / handle</span>
                <input name="contact" required maxLength={120} className={field} aria-invalid={!!err("contact")} />
                {err("contact") && <span className="text-sm text-destructive">{err("contact")}</span>}
              </label>
            </div>
            <label className="grid gap-1">
              <span className="meta">message</span>
              <textarea name="message" required rows={4} maxLength={4000} className={`${field} resize-none`} aria-invalid={!!err("message")} />
              {err("message") && <span className="text-sm text-destructive">{err("message")}</span>}
            </label>
            {/* Honeypot: hidden from people, filled by bots. */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
            <div className="flex items-center gap-6">
              <button
                type="submit"
                disabled={status.kind === "sending"}
                className="rounded-full bg-primary px-8 py-4 font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60"
              >
                {status.kind === "sending" ? "Sending…" : "Send message"}
              </button>
              {status.kind === "error" && (
                <p className="text-sm text-destructive" role="alert">
                  {status.message}
                </p>
              )}
            </div>
          </form>
        )}
      </Reveal>
    </section>
  );
}
