"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ScrollCounter } from "@/components/motion/scroll-counter";
import { getLenis } from "@/components/motion/smooth-scroll";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/writeups", label: "Writeups" },
  { href: "/projects", label: "Projects" },
  { href: "/achievements", label: "Record" },
  { href: "/about", label: "About" },
];

type MenuState = "closed" | "open" | "closing";
const MENU_CLOSE_FALLBACK_MS = 360;

export function Nav({ brand }: { brand: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const prefetchOnIntent = (href: string) => () => router.prefetch(href);
  const [menuState, setMenuState] = useState<MenuState>("closed");
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | null>(null);
  const pendingHref = useRef<string | null>(null);
  const isOpen = menuState === "open";
  const isActive = menuState !== "closed";

  const syncHeaderViewport = useCallback(() => {
    const scrollbarGutter = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    headerRef.current?.style.setProperty("right", `${scrollbarGutter}px`);
  }, []);

  useLayoutEffect(() => {
    syncHeaderViewport();
    window.addEventListener("resize", syncHeaderViewport);
    return () => window.removeEventListener("resize", syncHeaderViewport);
  }, [syncHeaderViewport]);

  const finishClose = useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    const href = pendingHref.current;
    pendingHref.current = null;
    setMenuState("closed");
    if (href) router.push(href);
  }, [router]);

  const closeMenu = useCallback((href?: string) => {
    pendingHref.current = href ?? null;
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    setMenuState("closing");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishClose();
      return;
    }

    // The transition event is primary; this also handles browsers that skip it during resize/navigation.
    closeTimer.current = window.setTimeout(finishClose, MENU_CLOSE_FALLBACK_MS);
  }, [finishClose]);

  const openMenu = useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    pendingHref.current = null;
    setMenuState("open");
  }, []);

  const handleMobileNavigation = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    closeMenu(href);
  };

  useEffect(() => {
    if (!isActive) return;

    const previousOverflow = document.documentElement.style.overflow;
    const smoothScroll = getLenis();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.documentElement.style.overflow = "hidden";
    syncHeaderViewport();
    smoothScroll?.stop();
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.documentElement.style.overflow = previousOverflow;
      syncHeaderViewport();
      smoothScroll?.start();
    };
  }, [isActive, closeMenu, syncHeaderViewport]);

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
  }, []);

  return (
    <header
      ref={headerRef}
      data-nav-state={menuState}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === "height" && menuState === "closing") finishClose();
      }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex h-16 flex-col overflow-hidden bg-transparent text-white mix-blend-difference transition-[height,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        isActive && "isolate bg-background text-foreground mix-blend-normal",
        isOpen && "h-dvh",
      )}
    >
      <nav className="relative z-10 mx-auto flex h-16 w-full max-w-[1600px] shrink-0 items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight"
          onClick={(event) => {
            if (isOpen) handleMobileNavigation(event, "/");
          }}
        >
          {brand}
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              onMouseEnter={prefetchOnIntent(l.href)}
              onFocus={prefetchOnIntent(l.href)}
              onTouchStart={prefetchOnIntent(l.href)}
              className={cn("text-sm transition-opacity hover:opacity-100", pathname.startsWith(l.href) ? "opacity-100" : "opacity-60")}
            >
              {l.label}
            </Link>
          ))}
          <ScrollCounter className="w-14 font-mono text-[11px] tabular-nums opacity-60" />
          <ThemeToggle />
        </div>
        <button
          type="button"
          className={cn("meta ml-3 shrink-0 whitespace-nowrap px-1 py-2 md:hidden", isOpen ? "text-foreground" : "text-white")}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          onClick={() => (isOpen ? closeMenu() : openMenu())}
        >
          {isOpen ? "close" : "menu"}
        </button>
      </nav>
      <nav
        id="mobile-menu"
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-background px-5 pt-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none md:hidden",
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <p className="meta mb-8">Navigate / 01</p>
        <ul className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                prefetch={false}
                onMouseEnter={prefetchOnIntent(l.href)}
                onFocus={prefetchOnIntent(l.href)}
                onTouchStart={prefetchOnIntent(l.href)}
                aria-current={pathname.startsWith(l.href) ? "page" : undefined}
                className={cn(
                  "block py-2 font-display text-[clamp(2.75rem,10vw,4.75rem)] leading-[0.92] tracking-tight transition-colors",
                  pathname.startsWith(l.href) ? "text-primary" : "text-foreground hover:text-primary",
                )}
                onClick={(event) => handleMobileNavigation(event, l.href)}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-6">
          <span className="meta">Appearance</span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
