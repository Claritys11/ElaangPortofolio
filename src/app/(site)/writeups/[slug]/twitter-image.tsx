export { alt, contentType, default, size } from "./opengraph-image";
export const dynamic = "force-static";

export async function generateStaticParams() {
  const { listWriteups } = await import("@/lib/data/writeups");
  return (await listWriteups()).map(({ slug }) => ({ slug }));
}
