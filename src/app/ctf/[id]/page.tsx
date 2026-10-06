import { notFound, permanentRedirect } from "next/navigation";
import { getWriteup } from "@/lib/data/writeups";

export const dynamic = "force-dynamic";

export default async function LegacyCtf({ params }: { params: Promise<{ id: string }> }) {
  const w = await getWriteup((await params).id);
  if (!w) notFound();
  permanentRedirect(w.href);
}
