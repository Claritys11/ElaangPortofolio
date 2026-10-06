import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return { username: s.username };
}

/** Defence in depth for /api/admin routes (proxy.ts already gates them). */
export async function requireAdminApi() {
  return getSession();
}
