import Link from "next/link";

export const metadata = { title: "CTF Writeups", alternates: { canonical: "/writeups" } };

export default function LegacyCtfIndex() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-24">
      <meta httpEquiv="refresh" content="0;url=/writeups" />
      <p className="meta">legacy route</p>
      <h1 className="mt-4 font-display text-5xl font-black tracking-tight">CTF archive moved.</h1>
      <p className="mt-4 text-muted-foreground">The writeup archive now lives at the canonical route.</p>
      <Link href="/writeups" className="mt-8 inline-flex w-fit border-b border-primary pb-1 text-sm">Open writeups →</Link>
    </main>
  );
}
