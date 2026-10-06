"use client";

import { useEffect, useRef } from "react";

/** Renders sanitized writeup HTML and wires the copy buttons that the HTML pipeline adds to code blocks. */
export function ArticleBody({ html }: { html: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = async (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-copy]");
      if (!btn) return;
      const code = btn.closest("figure")?.querySelector("pre")?.innerText ?? "";
      try {
        await navigator.clipboard.writeText(code.replace(/\n$/, ""));
        btn.textContent = "copied ✓";
        btn.dataset.state = "copied";
      } catch {
        btn.textContent = "copy failed";
      }
      setTimeout(() => {
        btn.textContent = "copy";
        delete btn.dataset.state;
      }, 1600);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);
  return <article ref={ref} className="writeup-prose min-w-0" dangerouslySetInnerHTML={{ __html: html }} />;
}
