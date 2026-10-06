import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return { username: s.username };
}
