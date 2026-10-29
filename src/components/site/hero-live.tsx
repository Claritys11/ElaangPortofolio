"use client";

import { useEffect, useState } from "react";
import { RollingDigits } from "@/components/motion/rolling-digits";
import { prefersReducedMotion } from "@/lib/motion";

const HELLO = ["Halo!", "Hello!", "こんにちは!", "안녕하세요!", "Hola!", "Bonjour!"];

/** Greeting that rolls up to the next language every few seconds. */
export function Greeting({ className }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % HELLO.length), 2600);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className={`relative inline-block h-[1.2em] overflow-hidden align-bottom ${className ?? ""}`}>
      <span className="sr-only">{HELLO[0]}</span>
      <span aria-hidden className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)]" style={{ transform: `translateY(-${i * 1.2}em)` }}>
        {HELLO.map((w) => (
          <span key={w} className="block h-[1.2em] leading-[1.2em] whitespace-nowrap">
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

/** Malang local time, ticking. Empty on the server so hydration never disagrees about the second. */
export function LocalClock({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className={className}>
      {now ? <RollingDigits value={now} duration={450} /> : <span aria-hidden>--:--:--</span>} <span className="text-muted-foreground">WIB</span>
    </span>
  );
}

/** Small "live" dot beside the availability line. */
export function LiveDot() {
  return (
    <span aria-hidden className="relative mr-2 inline-flex size-1.5 align-middle">
      <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
      <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
    </span>
  );
}
