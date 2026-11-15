import Link from "next/link";
import { publishedSlugs } from "@/lib/content";

export const dynamicParams = false;
export function generateStaticParams() {
  return publishedSlugs().map((id) => ({ id }));
}

export default async function LegacyCtfArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = "/writeups/" + encodeURIComponent(id);
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-24">
      <meta httpEquiv="refresh" content={'0;url=' + destination} />
      <p className="meta">legacy route</p>
      <h1 className="mt-4 font-display text-5xl font-black tracking-tight">Writeup moved.</h1>
      <p className="mt-4 text-muted-foreground">This article has a new canonical URL.</p>
      <Link href={destination} className="mt-8 inline-flex w-fit border-b border-primary pb-1 text-sm">Open article →</Link>
    </main>
  );
}
