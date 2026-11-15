/**
 * The first visit to "/" in a session opens behind a preloader. An inline script in <head>
 * sets html[data-intro] before paint, so the overlay never flashes for returning visitors.
 * Animations that should play as the page is revealed wait on onIntroDone().
 */
export const INTRO_KEY = "intro-seen";
export const INTRO_EVENT = "intro:done";

export function introProgress(elapsedMs: number, loaded: number, total: number, minMs: number, maxMs: number): number {
  if (elapsedMs >= maxMs) return 1;
  const time = Math.min(1, Math.max(0, elapsedMs) / minMs);
  const real = total > 0 ? Math.min(1, Math.max(0, loaded) / total) : 1;
  return Math.min(time, Math.max(real, time * 0.9));
}

/** Runs before hydration. Kept tiny and dependency-free because it is inlined as a string. */
export function createIntroScript(basePath = "") {
  const homePath = JSON.stringify(basePath);
  return `try{const p=location.pathname.replace(/\\/+$/,"")||"/";if((p==="/"||p===${homePath})&&!sessionStorage.getItem("${INTRO_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="1"}catch(e){}`;
}

export const introPending = () => typeof document !== "undefined" && document.documentElement.dataset.intro === "1";

/** Calls cb once the preloader has lifted, or right away when there is none. Returns an unsubscribe. */
export function onIntroDone(cb: () => void): () => void {
  if (!introPending()) {
    cb();
    return () => {};
  }
  window.addEventListener(INTRO_EVENT, cb, { once: true });
  return () => window.removeEventListener(INTRO_EVENT, cb);
}

export function finishIntro() {
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {}
  delete document.documentElement.dataset.intro;
  window.dispatchEvent(new Event(INTRO_EVENT));
}
