"use client";

import { Copy, Mail, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Message = { from: "me" | "you"; text: string };

const OPENING = [
  "Halo! 👋",
  "Got a binary for me?",
  "CTF team invite, collab, or a challenge you think I can't pwn. Drop me an email.",
];
const TYPING_MS = 850;

function Bubble({ message }: { message: Message }) {
  return (
    <li
      className={cn(
        "max-w-[85%] animate-in rounded-2xl px-4 py-2.5 text-sm leading-relaxed duration-300 fade-in slide-in-from-bottom-2",
        message.from === "me" ? "self-start rounded-bl-sm bg-muted" : "self-end rounded-br-sm bg-primary text-primary-foreground",
      )}
    >
      {message.text}
    </li>
  );
}

function Typing() {
  return (
    <li className="flex w-fit gap-1 self-start rounded-2xl rounded-bl-sm bg-muted px-4 py-3.5" aria-label="typing">
      {[0, 1, 2].map((index) => (
        <span key={index} className="typing-dot size-1.5 rounded-full bg-foreground" />
      ))}
    </li>
  );
}

export function ContactSection({
  name,
  imageUrl,
  email,
  githubUrl,
}: {
  name: string;
  imageUrl: string;
  email: string | null;
  githubUrl: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const section = useRef<HTMLElement>(null);
  const log = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const scheduledTimers: number[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (prefersReducedMotion()) {
          setMessages(OPENING.map((text) => ({ from: "me" as const, text })));
          return;
        }
        OPENING.forEach((text, index) => {
          const start = index * (TYPING_MS + 420);
          scheduledTimers.push(window.setTimeout(() => setTyping(true), start));
          scheduledTimers.push(
            window.setTimeout(() => {
              setTyping(false);
              setMessages((previous) => [...previous, { from: "me", text }]);
            }, start + TYPING_MS),
          );
        });
      },
      { threshold: 0.4 },
    );
    if (section.current) observer.observe(section.current);
    return () => {
      observer.disconnect();
      scheduledTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (log.current) log.current.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function copyEmail() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const mailHref = email ? "mailto:" + email + "?subject=Portfolio%20Inquiry" : null;

  return (
    <section
      ref={section}
      id="contact"
      className="mx-auto grid max-w-[1600px] gap-12 border-t border-border px-4 py-24 md:grid-cols-12 md:px-8 md:py-36"
    >
      <div className="md:col-span-5">
        <SectionLabel index={6} name="contact" />
        <h2 className="mt-6 font-display text-5xl leading-[0.95] font-bold tracking-tight md:text-7xl">Say hi.</h2>
        <p className="mt-6 max-w-sm text-muted-foreground">
          CTF team invites, collabs, or a challenge you think I can&apos;t pwn. I read everything.
        </p>
      </div>

      <div className="flex h-[34rem] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20 md:col-span-6 md:col-start-7">
        <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <Media src={imageUrl} alt="" className="size-9 rounded-full grayscale" />
          <div className="leading-tight">
            <p className="text-sm font-medium">{name}</p>
            <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-500 align-middle" />
              available · Malang
            </p>
          </div>
        </header>

        <ol ref={log} className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-5" aria-live="polite">
          {messages.map((message, index) => <Bubble key={index} message={message} />)}
          {typing && <Typing />}
        </ol>

        <div className="grid gap-2 border-t border-border p-3">
          {mailHref ? (
            <a
              href={mailHref}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01]"
            >
              <Mail className="size-4" />
              Open email
              <ArrowUp className="size-4" />
            </a>
          ) : githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              Contact on GitHub <ArrowUp className="size-4" />
            </a>
          ) : (
            <p className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">Contact details are not configured yet.</p>
          )}
          {email && (
            <button
              type="button"
              onClick={copyEmail}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <Copy className="size-3.5" />
              {copied ? "Copied email" : "Copy email address"}
            </button>
          )}
          <p className="px-2 text-center text-[11px] leading-relaxed text-muted-foreground">
            Your email app will open with a draft. Review it and press Send there.
          </p>
        </div>
      </div>
    </section>
  );
}
