"use client";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-6 px-4">
      <p className="meta">0xERR / content unavailable</p>
      <h1 className="font-display text-5xl font-bold tracking-tight md:text-7xl">Something didn&apos;t load.</h1>
      <button type="button" onClick={reset} className="meta w-fit border-b border-primary pb-1 text-foreground">
        try again
      </button>
    </main>
  );
}
