import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";
import { DeferredImage } from "@/components/site/deferred-image";

type Props = { src: string | null; alt: string; className?: string; label?: string; eager?: boolean };

export function Media({ src, alt, className, label, eager = false }: Props) {
  if (!src) {
    return (
      <div className={cn("grid place-items-center bg-muted", className)} role="img" aria-label={alt}>
        <span className="meta">{label ?? "no image"}</span>
      </div>
    );
  }
  const assetSrc = withBasePath(src) ?? src;
  // A single viewport scheduler prevents native lazy-load thresholds from starting many requests during hydration.
  return <DeferredImage src={assetSrc} alt={alt} className={cn("object-cover", className)} eager={eager} />;
}
