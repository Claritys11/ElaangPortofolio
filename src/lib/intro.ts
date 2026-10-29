/**
 * The first visit to "/" in a session opens behind a preloader. An inline script in <head>
 * sets html[data-intro] before paint, so the overlay never flashes for returning visitors.
 * Animations that should play as the page is revealed wait on onIntroDone().
 */
export const INTRO_KEY = "intro-seen";
export const INTRO_EVENT = "intro:done";

/** Runs before hydration. Kept tiny and dependency-free because it is inlined as a string. */
export const INTRO_SCRIPT = `try{if(location.pathname==="/"&&!sessionStorage.getItem("${INTRO_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="1"}catch(e){}`;

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
