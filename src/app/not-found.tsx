import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-[1600px] flex-col justify-center px-4 md:px-8">
      <p className="meta">0x194 / not found</p>
      <h1 className="mt-4 font-display text-[22vw] leading-[0.8] font-black tracking-[-0.05em] md:text-[14vw]">404</h1>
      <p className="mt-6 max-w-md text-muted-foreground">This address doesn&apos;t map to anything. Segfault avoided.</p>
      <Link href="/" className="meta mt-8 w-fit border-b border-primary pb-1 text-foreground">
        back home →
      </Link>
    </main>
  );
}
