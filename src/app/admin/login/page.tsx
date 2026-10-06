import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="grid w-full max-w-sm gap-8">
        <p className="meta">
          <span className="text-primary">0x00</span> / admin
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
