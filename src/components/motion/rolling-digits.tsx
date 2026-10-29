import { cn } from "@/lib/utils";

const STRIP = "0123456789".split("");

/**
 * Odometer text: every digit is a 0–9 strip that slides to its value, so a change rolls instead of
 * swapping. Other characters render as-is. Screen readers get the plain value.
 */
export function RollingDigits({ value, className, duration = 600 }: { value: string; className?: string; duration?: number }) {
  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      <span className="sr-only">{value}</span>
      {value.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} aria-hidden className="relative inline-block h-[1em] overflow-hidden leading-none">
            <span
              className="flex flex-col transition-transform ease-[cubic-bezier(0.7,0,0.2,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(ch) * 10}%)`, transitionDuration: `${duration}ms` }}
            >
              {STRIP.map((d) => (
                <span key={d} className="block h-[1em] leading-none">
                  {d}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden className="inline-block leading-none whitespace-pre">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}
