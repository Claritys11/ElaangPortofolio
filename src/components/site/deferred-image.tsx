"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  draggable?: boolean;
  onClick?: () => void;
};

/** Starts low-priority image requests before their rendered box reaches the viewport. */
export function DeferredImage({ src, alt, className, eager = false, fetchPriority = "low", draggable, onClick }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    if (eager) return;
    const image = ref.current;
    if (!image) return;
    const preloadMargin = Math.max(900, Math.round(window.innerHeight * 1.5));
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      // Start the request roughly 1.5 screens early so it can finish before the visitor scrolls to it.
      { rootMargin: `${preloadMargin}px 0px` },
    );
    observer.observe(image);
    return () => observer.disconnect();
  }, [eager, src]);

  const load = eager || nearViewport;
  return (
    <img
      ref={ref}
      src={load ? src : undefined}
      data-deferred-src={load ? undefined : src}
      alt={alt}
      className={className}
      loading={eager || nearViewport ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : fetchPriority}
      decoding="async"
      draggable={draggable}
      onClick={onClick}
    />
  );
}
