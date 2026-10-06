import { cn } from "@/lib/utils";

type Props = { src: string | null; alt: string; className?: string; label?: string; eager?: boolean };

export function Media({ src, alt, className, label, eager }: Props) {
  if (!src) {
    return (
      <div className={cn("grid place-items-center bg-muted", className)} role="img" aria-label={alt}>
        <span className="meta">{label ?? "no image"}</span>
      </div>
    );
  }
  // Plain <img>: sources include data: URLs and the uploads API route, which next/image can't optimise uniformly.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn("object-cover", className)} loading={eager ? "eager" : "lazy"} decoding="async" />;
}
