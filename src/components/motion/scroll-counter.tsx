"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger, toHexProgress } from "@/lib/motion";

export function ScrollCounter({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (ref.current) ref.current.textContent = toHexProgress(self.progress);
      },
    });
    return () => st.kill();
  }, []);
  return (
    <span ref={ref} className={className} aria-hidden>
      0x0000
    </span>
  );
}
