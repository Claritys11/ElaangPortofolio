import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { username } = await requireAdmin();
  return (
    <div className="min-h-svh md:flex">
      <Sidebar username={username} />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
