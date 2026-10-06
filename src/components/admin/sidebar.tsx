"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  ["/admin", "Dashboard"],
  ["/admin/writeups", "Writeups"],
  ["/admin/projects", "Projects"],
  ["/admin/achievements", "Achievements"],
  ["/admin/profile", "Profile"],
  ["/admin/messages", "Messages"],
  ["/admin/uploads", "Uploads"],
  ["/admin/logs", "Access logs"],
] as const;

export function Sidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <aside className="flex flex-col gap-1 border-b border-border p-4 md:sticky md:top-0 md:h-svh md:w-56 md:border-r md:border-b-0">
      <Link href="/" className="mb-6 font-display text-lg font-semibold">
        Claritys <span className="meta ml-1">admin</span>
      </Link>
      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {ITEMS.map(([href, label]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn("rounded-md px-3 py-2 text-sm whitespace-nowrap", active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden pt-6 md:block">
        <p className="meta mb-2">{username}</p>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.replace("/admin/login");
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
