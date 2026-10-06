"use client";

import { useState } from "react";

export function FlagReveal({ flag }: { flag: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-16 border-y border-border py-8">
      <p className="meta mb-3">flag</p>
      {shown ? (
        <div className="flex flex-wrap items-center gap-4">
          <code className="font-mono text-lg break-all text-primary">{flag}</code>
          <button type="button" className="meta hover:text-foreground" onClick={() => navigator.clipboard.writeText(flag).then(() => setCopied(true))}>
            {copied ? "copied" : "copy"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setShown(true)} className="group flex items-center gap-4" aria-label="Reveal flag">
          <span className="font-mono text-lg tracking-tight text-foreground/80 select-none" aria-hidden>
            {"█".repeat(Math.min(28, Math.max(12, flag.length)))}
          </span>
          <span className="meta group-hover:text-primary">click to reveal</span>
        </button>
      )}
    </div>
  );
}
