"use client";

import { useGSAP } from "@gsap/react";
import { Mail } from "lucide-react";
import * as React from "react";
import { useEffect, useRef } from "react";
import { scrollToTop } from "@/components/motion/smooth-scroll";
import { GithubIcon, InstagramIcon } from "@/components/site/brand-icons";
import { fitScaleX, GLITCH_TIMING, nextGlitchDelay, sliceInset } from "@/lib/glitch";
import { gsap, NO_REDUCED, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import "./motion-footer.css";

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE STYLES live in ./motion-footer.css (served once, cached)
// -------------------------------------------------------------------------

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency)
// -------------------------------------------------------------------------
export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      const element = localRef.current;
      if (!element || prefersReducedMotion()) return;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(element, { x: x * 0.4, y: y * 0.4, rotationX: -y * 0.15, rotationY: x * 0.15, scale: 1.05, ease: "power2.out", duration: 0.4 });
      };
      const handleMouseLeave = () => {
        gsap.to(element, { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, ease: "elastic.out(1, 0.3)", duration: 1.2 });
      };

      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
        gsap.killTweensOf(element);
      };
    }, []);

    return (
      <Component
        ref={(node: HTMLElement | null) => {
          localRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. GLITCH SWAP — ELANG briefly becomes CLARITYS
// -------------------------------------------------------------------------
type GlitchSwapProps = {
  primary: string;
  secret: string;
  trigger: React.RefObject<HTMLElement | null>;
};

export function GlitchSwap({ primary, secret, trigger }: GlitchSwapProps) {
  const primaryRef = useRef<HTMLSpanElement>(null);
  const rgbRef = useRef<HTMLSpanElement>(null);
  const secretRef = useRef<HTMLSpanElement>(null);
  const secretInnerRef = useRef<HTMLSpanElement>(null);

  // Keep the secret inside the primary word's box: no layout shift, no overflow.
  useEffect(() => {
    const fit = () => {
      if (!primaryRef.current || !secretInnerRef.current) return;
      gsap.set(secretInnerRef.current, { scaleX: 1 });
      gsap.set(secretInnerRef.current, { scaleX: fitScaleX(primaryRef.current.offsetWidth, secretInnerRef.current.scrollWidth) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (primaryRef.current) ro.observe(primaryRef.current);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [primary, secret]);

  useGSAP(() => {
    const p = primaryRef.current!;
    const rgb = rgbRef.current!;
    const s = secretRef.current!;
    const mm = gsap.matchMedia();

    mm.add(NO_REDUCED, () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let active = false;

      const glitch = () =>
        gsap
          .timeline()
          .set(rgb, { autoAlpha: 0.8, x: "-0.4vw" })
          .to(p, { clipPath: sliceInset(), x: "3vw", duration: 0.05, ease: "none" })
          .to(p, { clipPath: sliceInset(), x: "-2vw", duration: 0.05, ease: "none" })
          .set(p, { autoAlpha: 0, clipPath: "inset(0% 0 0% 0)", x: 0 })
          .set(s, { autoAlpha: 1, clipPath: sliceInset() })
          .to(s, { clipPath: "inset(0% 0 0% 0)", x: "1.5vw", duration: 0.04, ease: "none" })
          .to(s, { x: 0, duration: 0.04, ease: "none" })
          .to({}, { duration: GLITCH_TIMING.secretHoldS })
          .set(s, { autoAlpha: 0 })
          .set(p, { autoAlpha: 1, clipPath: sliceInset(), x: "-3vw" })
          .to(p, { clipPath: "inset(0% 0 0% 0)", x: 0, duration: 0.06, ease: "none" })
          .set(rgb, { autoAlpha: 0, x: 0 });

      const schedule = (delay: number) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (active && document.visibilityState === "visible") glitch();
          if (active) schedule(nextGlitchDelay(GLITCH_TIMING.minDelayMs, GLITCH_TIMING.maxDelayMs));
        }, delay);
      };

      ScrollTrigger.create({
        trigger: trigger.current,
        start: "top 40%",
        end: "bottom top",
        onToggle: (self) => {
          active = self.isActive;
          if (active) schedule(GLITCH_TIMING.firstDelayMs);
          else clearTimeout(timer);
        },
      });
      return () => clearTimeout(timer);
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      ScrollTrigger.create({
        trigger: trigger.current,
        start: "top 40%",
        once: true,
        onEnter: () => {
          gsap
            .timeline({ delay: 0.5 })
            .to(p, { autoAlpha: 0, duration: 0.15 })
            .to(s, { autoAlpha: 1, duration: 0.15 }, "<")
            .to(s, { autoAlpha: 0, duration: 0.15 }, "+=0.6")
            .to(p, { autoAlpha: 1, duration: 0.15 }, "<");
        },
      });
    });

    return () => mm.revert();
  });

  return (
    <span className="relative block" aria-hidden>
      <span ref={primaryRef} className="footer-giant-bg-text block">
        {primary}
      </span>
      <span ref={rgbRef} className="footer-giant-bg-text is-rgb invisible absolute inset-0 block">
        {primary}
      </span>
      <span ref={secretRef} className="invisible absolute inset-0 flex justify-center">
        <span ref={secretInnerRef} className="footer-giant-bg-text is-secret inline-block origin-center whitespace-nowrap">
          {secret}
        </span>
      </span>
    </span>
  );
}

// -------------------------------------------------------------------------
// 4. MAIN COMPONENT
// -------------------------------------------------------------------------
export type FooterLink = { label: string; href: string; icon?: "github" | "mail" | "instagram"; external?: boolean };
export type CinematicFooterProps = {
  giantText: string;
  secretText: string;
  marquee: string[];
  heading: string;
  primaryLinks: FooterLink[];
  secondaryLinks: FooterLink[];
  copyright: string;
  creditName: string;
};

const ICONS = {
  github: GithubIcon,
  instagram: InstagramIcon,
  mail: ({ className }: { className?: string }) => <Mail className={className} aria-hidden />,
};

function MarqueeItem({ items }: { items: string[] }) {
  return (
    <div className="flex items-center space-x-12 px-6">
      {items.map((item, i) => (
        <React.Fragment key={`${item}-${i}`}>
          <span>{item}</span>
          <span className={i % 2 ? "text-foreground/30" : "text-primary/60"}>✦</span>
        </React.Fragment>
      ))}
    </div>
  );
}

const linkProps = (l: FooterLink) => (l.external ? { href: l.href, target: "_blank", rel: "noopener noreferrer" } : { href: l.href });

export function CinematicFooter(props: CinematicFooterProps) {
  const { giantText, secretText, marquee, heading, primaryLinks, secondaryLinks, copyright, creditName } = props;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        // Background parallax
        gsap.fromTo(
          giantTextRef.current,
          { y: "10vh", scale: 0.8, opacity: 0 },
          {
            y: "0vh",
            scale: 1,
            opacity: 1,
            ease: "power1.out",
            scrollTrigger: { trigger: wrapperRef.current, start: "top 80%", end: "bottom bottom", scrub: 1 },
          },
        );
        // Staggered content reveal
        gsap.fromTo(
          [headingRef.current, linksRef.current],
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: { trigger: wrapperRef.current, start: "top 40%", end: "bottom bottom", scrub: 1 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: wrapperRef },
  );

  return (
    <>

      {/* Curtain reveal: the fixed footer is only visible inside this clipped box. */}
      <div ref={wrapperRef} className="relative h-svh min-h-[640px] w-full" style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}>
        <footer className="cinematic-footer-wrapper fixed bottom-0 left-0 flex h-svh min-h-[640px] w-full flex-col justify-between overflow-hidden bg-background text-foreground">
          <div className="footer-aurora animate-footer-breathe pointer-events-none absolute top-1/2 left-1/2 z-0 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[80px]" />
          <div className="footer-bg-grid pointer-events-none absolute inset-0 z-0" />

          <div ref={giantTextRef} className="pointer-events-none absolute -bottom-[5vh] left-1/2 z-0 -translate-x-1/2 whitespace-nowrap select-none">
            <GlitchSwap primary={giantText} secret={secretText} trigger={wrapperRef} />
          </div>

          <div className="absolute top-12 left-0 z-10 w-full -rotate-2 scale-110 overflow-hidden border-y border-border/50 bg-background/60 py-4 shadow-2xl backdrop-blur-md">
            <div className="animate-footer-scroll-marquee flex w-max font-mono text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase md:text-xs">
              <MarqueeItem items={marquee} />
              <MarqueeItem items={marquee} />
            </div>
          </div>

          <div className="relative z-10 mx-auto mt-20 flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 md:px-6">
            <h2 ref={headingRef} className="footer-text-glow mb-10 text-center font-display text-5xl font-black tracking-tighter md:mb-12 md:text-8xl">
              {heading}
            </h2>
            <div ref={linksRef} className="flex w-full flex-col items-center gap-6">
              <div className="flex w-full flex-wrap justify-center gap-3 md:gap-4">
                {primaryLinks.map((l) => {
                  const Icon = l.icon ? ICONS[l.icon] : null;
                  return (
                    <MagneticButton
                      key={l.href}
                      as="a"
                      {...linkProps(l)}
                      className="footer-glass-pill group flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold text-foreground md:px-10 md:py-5 md:text-base"
                    >
                      {Icon && <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground md:h-6 md:w-6" />}
                      {l.label}
                    </MagneticButton>
                  );
                })}
              </div>
              <div className="mt-2 flex w-full flex-wrap justify-center gap-3 md:gap-6">
                {secondaryLinks.map((l) => (
                  <MagneticButton
                    key={l.href}
                    as="a"
                    {...linkProps(l)}
                    className="footer-glass-pill rounded-full px-6 py-3 text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
                  >
                    {l.label}
                  </MagneticButton>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-20 flex w-full flex-col items-center justify-between gap-6 px-4 pb-8 md:flex-row md:px-12">
            <div className="order-2 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase md:order-1 md:text-xs">{copyright}</div>
            <div className="footer-glass-pill order-1 flex cursor-default items-center gap-2 rounded-full border-border/50 px-6 py-3 md:order-2">
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase md:text-xs">Crafted with</span>
              <span className="animate-footer-heartbeat text-sm text-destructive md:text-base">❤</span>
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase md:text-xs">by</span>
              <span className="ml-1 text-xs font-black tracking-normal text-foreground md:text-sm">{creditName}</span>
            </div>
            <MagneticButton
              as="button"
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="footer-glass-pill group order-3 flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}
