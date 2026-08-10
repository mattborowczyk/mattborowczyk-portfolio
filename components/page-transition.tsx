"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Exit length — must match `--duration-page` in globals.css, which is also what
 * the `animate-mbpage` entry runs at. The same number both ways on purpose: an
 * exit quicker than the entry (or the reverse) reads as two unrelated effects
 * rather than one movement.
 */
const PAGE_FADE_MS = 1000;

/**
 * How long the incoming page will wait for its own images before fading in
 * regardless. The wait is what stops a piece from popping in a beat after the
 * page around it, but it can only ever be a courtesy — on a slow connection the
 * alternative to showing an unfinished page is showing nothing at all.
 */
const MEDIA_WAIT_CAP_MS = 1200;

/** True from the moment a navigation is committed to until the new route lands. */
const LeavingContext = createContext(false);

/**
 * Set just before a router push and read by the `PageFade` that arrives after
 * it. Only a page reached *through* a transition holds its entry back for its
 * images; a first load does not, and the difference matters. On a first load
 * the hold would have to be applied from an effect, which does not run until
 * hydration — so the fade would start, stall part-way through, and finish
 * later, which is precisely the hitch this is supposed to remove. Nothing is
 * gained by it either: a document load already carries `<link rel=preload>` for
 * its priority images, so they arrive with the markup rather than after it.
 *
 * A module-scoped flag rather than state because it has to survive the unmount
 * of the outgoing page and the mount of the incoming one — there is no
 * component alive across both. It is only ever read, never branched on during
 * render in a way that could differ between server and client: on the server it
 * is always false, and on the client it is false on the load that hydrates.
 */
let arrivedByNavigation = false;

/** Whether a route change is currently fading the page out. */
export function usePageLeaving() {
  return useContext(LeavingContext);
}

/** Whether the visitor has asked for less motion. */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The navigation this click would perform, or `null` if it is not ours to
 * animate. Returns a URL rather than a boolean so the caller has the resolved
 * destination and never has to re-read the anchor.
 */
function navigationTarget(e: MouseEvent): URL | null {
  // Modified clicks open tabs and windows; a handled click has already been
  // spoken for. Only a plain primary click is a navigation of this page.
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;

  const anchor = (e.target as Element | null)?.closest?.("a");
  if (!anchor || !(anchor instanceof HTMLAnchorElement)) return null;
  return linkTarget(anchor);
}

/** The same test, against an anchor alone — used for hover prefetching. */
function linkTarget(anchor: HTMLAnchorElement): URL | null {
  if (anchor.hasAttribute("download")) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  // Deliberate opt-out, for a link that must perform a real document request.
  if (anchor.dataset.noTransition !== undefined) return null;

  // `anchor.href` is already absolute. A `mailto:`/`tel:` link parses to the
  // opaque "null" origin and so falls out here with everything cross-site —
  // the commission links throughout the run rely on that.
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return null;

  // Route handlers and the Studio are real document loads, not app
  // navigations: `/api/draft/disable` has to reach the server to clear the
  // cookie, and pushing it through the router would render from the router
  // cache instead. The Studio is a separate 1.6MB bundle outside this tree.
  if (url.pathname.startsWith("/api/")) return null;
  if (url.pathname.startsWith("/admin")) return null;

  // Same page: a catalogue filter (`/?filter=Rings`) or an in-page hash. Those
  // animate in place — the run grows and shrinks its own pieces — and fading
  // the whole page out from under that would destroy the effect it exists for.
  if (url.pathname === location.pathname) return null;

  return url;
}

/**
 * Owns the route transition: it takes the navigation off the anchor, fades, and
 * pushes once the fade has finished.
 *
 * Next unmounts the old tree the moment the route changes, so there is no
 * "leaving" state to animate — an exit transition only exists if the navigation
 * is delayed until the fade is done. Which makes this deliberately a *document*
 * listener rather than a wrapper around a custom Link: the links that leave a
 * page are scattered across the nav rails, the footer, the run and the page
 * bodies, and every one of them has to behave the same way or the site fades
 * out on some navigations and cuts on others.
 *
 * The state is published on a context rather than kept inside the page wrapper
 * because the fade is not only the page's: the filter rail lives in `SiteNav`,
 * outside the content, and has to leave with the pieces it filters.
 *
 * Wrap the whole frame in this, and mount `PageFade` (keyed on the pathname)
 * around the page content — see `app-shell.tsx`.
 */
export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [leaving, setLeaving] = useState(false);
  // Guards a second click while a fade is already running: the first has taken
  // the navigation and a second would stack another timer behind it.
  const navigating = useRef(false);

  // The new route has landed — release the fade so the next click can start
  // one. The incoming content is a fresh `PageFade`, which fades itself in.
  useEffect(() => {
    navigating.current = false;
    setLeaving(false);
  }, [pathname]);

  useEffect(() => {
    // `pointerover` bubbles from whatever is under the cursor, so crossing a
    // piece fires it once per child element. Next dedupes prefetches itself,
    // but there is no reason to ask it on every one.
    const warmed = new Set<string>();

    // Warm the destination as soon as the cursor lands on a link, so the
    // fade-out and the fetch overlap instead of running one after the other.
    // By the time the second is due the payload is usually already there.
    //
    // Worth knowing when this looks broken in development: `router.prefetch`
    // is a no-op under `next dev`, where routes are compiled on demand. The
    // overlap only actually happens in a production build.
    function onEnter(e: Event) {
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      const url = linkTarget(anchor);
      if (!url) return;
      const path = url.pathname + url.search;
      if (warmed.has(path)) return;
      warmed.add(path);
      router.prefetch(path);
    }

    function onClick(e: MouseEvent) {
      const url = navigationTarget(e);
      if (!url) return;

      // Reduced motion keeps the navigation instant. Note this returns *before*
      // preventDefault, so the browser performs its own navigation as usual —
      // suppressing the animation must not also suppress the link.
      if (prefersReducedMotion()) return;

      // `stopPropagation`, and not just `preventDefault`, is what actually
      // takes the navigation. Next's App Router hydrates the whole document,
      // so React's delegated listener sits on `document` too — and it was
      // registered during hydration, before this one. In the bubble phase
      // `Link`'s own handler therefore runs *first* and pushes immediately,
      // and cancelling the default afterwards cancels nothing, because `Link`
      // never consulted the default in the first place. Hence the capture
      // phase below, and hence stopping the event here: it has to not reach
      // React at all. Everything this handler intercepts is a link it is about
      // to navigate itself, so nothing downstream is owed the event.
      e.preventDefault();
      e.stopPropagation();
      if (navigating.current) return;
      navigating.current = true;

      const href = `${url.pathname}${url.search}${url.hash}`;
      router.prefetch(url.pathname + url.search);
      arrivedByNavigation = true;
      setLeaving(true);

      window.setTimeout(() => {
        // Scroll while the page is blank, not after the new one has painted.
        // Next would otherwise reset the scroll itself on arrival — and with
        // `scroll-behavior: smooth` set globally that reset is *animated*,
        // which is the lurch between pages this whole transition is meant to
        // remove. Doing it here, invisibly, and telling the router to keep its
        // hands off is the only way to be sure it happens unseen. A link
        // carrying a hash is left to the router, which knows where to put it.
        if (!url.hash) {
          window.scrollTo({ top: 0, behavior: "instant" });
          router.push(href, { scroll: false });
        } else {
          router.push(href);
        }
      }, PAGE_FADE_MS);
    }

    // `pointerenter` does not bubble; its delegated form is `pointerover`.
    document.addEventListener("pointerover", onEnter);
    document.addEventListener("focusin", onEnter);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerover", onEnter);
      document.removeEventListener("focusin", onEnter);
      document.removeEventListener("click", onClick, true);
    };
  }, [router]);

  return (
    <LeavingContext.Provider value={leaving}>{children}</LeavingContext.Provider>
  );
}

/**
 * The page content, faded out on the way to a new route and in again on
 * arrival. Mount it keyed on the pathname so each route gets a fresh element:
 * that is what restarts the entry animation, and it is what lets the back
 * button still fade in even though nothing can fade it out — a popstate gives
 * no chance to animate before the route has already changed.
 *
 * The entry is a CSS animation and not a JS-driven opacity, which matters more
 * than it looks: an element rendered at `opacity: 0` and raised by script is
 * invisible in exactly the cases script does not run on schedule — a background
 * tab, where timers and `requestAnimationFrame` are throttled, and no-JS
 * entirely, where it would never come back at all. A keyframe with `both` fill
 * needs none of that. Everything below only ever *pauses* that animation, so
 * the failure mode of the script not running is the plain fade, not a blank
 * page.
 */
export function PageFade({ children }: { children: React.ReactNode }) {
  const leaving = usePageLeaving();
  const ref = useRef<HTMLDivElement>(null);
  // Read in the initialiser, so a page arrived at through a transition is
  // already paused on its very first render — no effect, no frame of fade
  // played before the hold applies. Reading a module flag here is safe under
  // StrictMode's double-invoked initialiser precisely because it only reads;
  // the clearing happens in an effect below.
  const [held, setHeld] = useState(() => arrivedByNavigation);

  useEffect(() => {
    arrivedByNavigation = false;
  }, []);

  // Hold the fade until the images that are actually going to show have
  // decoded, so the page arrives whole instead of assembling itself in front of
  // the visitor. Only eager images are waited on: a lazy one below the fold has
  // not been requested yet and never will be until it is scrolled to, so
  // waiting on it would mean always waiting out the cap. Next gives the product
  // hero `priority`, which is what makes it eager and therefore counted here.
  useEffect(() => {
    if (!held) return;
    const el = ref.current;
    if (!el) return;

    const pending = [
      ...el.querySelectorAll<HTMLImageElement>('img:not([loading="lazy"])'),
    ].filter((img) => !img.complete);

    if (pending.length === 0) {
      setHeld(false);
      return;
    }

    let remaining = pending.length;
    const release = () => setHeld(false);
    const onSettle = () => {
      if (--remaining <= 0) release();
    };

    // `error` releases too. A broken image is not a reason to sit on a blank
    // page — the rest of the piece is still worth showing.
    for (const img of pending) {
      img.addEventListener("load", onSettle, { once: true });
      img.addEventListener("error", onSettle, { once: true });
    }
    const cap = window.setTimeout(release, MEDIA_WAIT_CAP_MS);

    return () => {
      window.clearTimeout(cap);
      for (const img of pending) {
        img.removeEventListener("load", onSettle);
        img.removeEventListener("error", onSettle);
      }
    };
  }, [held]);

  return (
    <div
      ref={ref}
      className="animate-mbpage transition-opacity duration-page motion-reduce:animate-none motion-reduce:transition-none"
      style={
        leaving
          ? // `animation: none` is not decoration here — it is what lets the
            // exit happen at all. A running (or `both`-filled, and so still
            // applying) animation outranks every ordinary declaration in the
            // cascade, inline styles included, so the entry keyframe would
            // otherwise pin this at opacity 1 and the fade-out would never be
            // visible. Dropping the animation hands the property back to the
            // transition.
            { animation: "none", opacity: 0 }
          : held
            ? { animationPlayState: "paused" }
            : undefined
      }
    >
      {children}
    </div>
  );
}
