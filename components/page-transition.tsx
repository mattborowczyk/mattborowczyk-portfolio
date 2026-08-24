"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Exit length — must match `--duration-page` in globals.css, which is also what
 * the `animate-mbpage` entry runs at. The same number both ways on purpose: an
 * exit quicker than the entry (or the reverse) reads as two unrelated effects
 * rather than one movement.
 */
const PAGE_FADE_MS = 500;

/**
 * How long the incoming page will wait for its own images before fading in
 * regardless. The wait is what stops a piece from popping in a beat after the
 * page around it, but it can only ever be a courtesy — on a slow connection the
 * alternative to showing an unfinished page is showing nothing at all.
 *
 * Capped at one fade length, and deliberately not longer. The chrome does not
 * wait for anything: the filter rail fades back in over `--duration-page` from
 * the moment the route lands. Every millisecond this sits above that is a
 * millisecond of the nav being fully back while the page under it is still
 * blank — which reads as the content lagging the frame, not as one transition.
 * It was 1200ms against a 1000ms fade, which was already most of a second of
 * that; against 500ms it would be more than double.
 */
const MEDIA_WAIT_CAP_MS = 500;

/**
 * The navigation in flight: true from the moment one is committed to until the
 * new route lands, alongside where it is going.
 *
 * The destination is published as well as the fact, because the grid needs it.
 * Its exit is not a single fade — the tile you clicked stays while the others
 * leave around it — and "which tile did they click" is a question only the
 * href can answer, since the click itself was taken by the document listener
 * below rather than by anything inside the grid.
 */
const LeavingContext = createContext<{ leaving: boolean; href: string | null }>(
  { leaving: false, href: null },
);

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

/**
 * Whether a `PageFade` has already mounted in this document.
 *
 * The entry fade belongs to a *route change*, not to arriving at the site. On
 * the first load it costs exactly what it looks like it costs: the page is
 * painted at opacity 0 and spends `--duration-page` becoming visible, and the
 * largest element is not "contentful" to the browser until it does — so LCP is
 * pushed out by most of a second on a page whose bytes were all there from the
 * start. Nothing is animating *from* anything on that load either; there is no
 * outgoing page it is cross-fading with, only a blank screen it fades up out of.
 *
 * So the first `PageFade` renders plain and every one after it fades in. False
 * on the server and false on the render that hydrates, which is what keeps the
 * markup identical across the two; the effect below flips it once the first page
 * is mounted, and by then only a navigation can mount another.
 */
let pageHasMounted = false;

/** Whether a route change is currently fading the page out. */
export function usePageLeaving() {
  return useContext(LeavingContext).leaving;
}

/**
 * The path a route change in flight is heading to, or `null` when none is.
 * Pathname only — the destinations this is used to recognise never carry a
 * query, and comparing one that did against a bare path would silently miss.
 */
export function usePageLeavingHref() {
  return useContext(LeavingContext).href;
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

/**
 * A link that stays on this route and only changes the query — the catalogue
 * filters, and nothing else on the site today.
 *
 * These get taken over too, but for the opposite reason to a route change:
 * not to animate them, to stop them being animated *away*. Left to the anchor
 * they were performing a full document load — the whole page fetched again,
 * React re-initialised, and the scroll therefore back at the top, which is the
 * one thing a filter must not do, since the pieces it filters are exactly where
 * you were looking. Pushing through the router keeps it a client render, and
 * `scroll: false` keeps the position. If the filtered run is shorter than the
 * scroll, the browser clamps to the last screen on its own, which is the
 * behaviour wanted at the bottom anyway.
 */
function inPlaceTarget(e: MouseEvent): URL | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;

  const anchor = (e.target as Element | null)?.closest?.("a");
  if (!anchor || !(anchor instanceof HTMLAnchorElement)) return null;
  if (!sameSiteTarget(anchor)) return null;

  const url = new URL(anchor.href, location.href);
  if (url.pathname !== location.pathname) return null;
  // A bare `#hash` on the current view is the browser's business, not ours.
  if (url.search === location.search) return null;
  return url;
}

/**
 * Whether this anchor is one the router may take at all — shared by both tests
 * above, since "is this ours" is the same question whether the destination is
 * another route or the same one with a different query.
 */
function sameSiteTarget(anchor: HTMLAnchorElement): boolean {
  if (anchor.hasAttribute("download")) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  // Deliberate opt-out, for a link that must perform a real document request.
  if (anchor.dataset.noTransition !== undefined) return false;

  // `anchor.href` is already absolute. A `mailto:`/`tel:` link parses to the
  // opaque "null" origin and so falls out here with everything cross-site —
  // the commission links throughout the run rely on that.
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return false;

  // Route handlers and the Studio are real document loads, not app
  // navigations: `/api/draft/disable` has to reach the server to clear the
  // cookie, and pushing it through the router would render from the router
  // cache instead. The Studio is a separate 1.6MB bundle outside this tree.
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/admin")) return false;

  return true;
}

/** The same test, against an anchor alone — used for hover prefetching. */
function linkTarget(anchor: HTMLAnchorElement): URL | null {
  if (!sameSiteTarget(anchor)) return null;
  const url = new URL(anchor.href, location.href);

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
  // Kept beside `leaving` rather than folded into it, so the many places that
  // only care whether a navigation is happening are unchanged.
  const [leavingHref, setLeavingHref] = useState<string | null>(null);
  // Guards a second click while a fade is already running: the first has taken
  // the navigation and a second would stack another timer behind it.
  const navigating = useRef(false);
  // The push waiting out the fade, held so it can be called off.
  const pendingNavigation = useRef<number | null>(null);

  // The new route has landed — release the fade so the next click can start
  // one. The incoming content is a fresh `PageFade`, which fades itself in.
  useEffect(() => {
    navigating.current = false;
    setLeaving(false);
    setLeavingHref(null);

    return () => {
      // Only ever non-null if the timer has not fired, because the callback
      // clears it before pushing — so this cannot cancel a navigation that is
      // merely completing. What it catches is the route changing by some other
      // means while the fade is still running: the visitor pressing Back, or
      // this provider unmounting. Without it the timer still fires and pushes
      // them forward to the link they clicked, a second after they left it.
      if (pendingNavigation.current === null) return;
      window.clearTimeout(pendingNavigation.current);
      pendingNavigation.current = null;
      // The arrival this was set for is not coming. Left true, it would hold
      // the *next* page's entry animation waiting on images that page never
      // announced.
      arrivedByNavigation = false;
    };
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
      // A filter change. Taken before the reduced-motion check below, because
      // nothing here animates — this branch exists to keep the navigation
      // client-side and the scroll where it was, which a visitor who has asked
      // for less motion wants just as much as anyone.
      const inPlace = inPlaceTarget(e);
      if (inPlace) {
        e.preventDefault();
        e.stopPropagation();

        // A route change may already be fading out when this is clicked, and
        // the visitor has plainly changed their mind. Call it off rather than
        // letting it land: the query push does not change the pathname, so the
        // effect keyed on it never runs, `leaving` would stay true and hold the
        // freshly filtered run at opacity 0 — and then the timer would fire and
        // navigate away from it regardless, making the filter click look
        // ignored. Undoing it here is the whole of putting the page back.
        if (pendingNavigation.current !== null) {
          window.clearTimeout(pendingNavigation.current);
          pendingNavigation.current = null;
          arrivedByNavigation = false;
        }
        navigating.current = false;
        setLeaving(false);
        setLeavingHref(null);

        // `scroll: false` unconditionally. A filter must not move the scroll at
        // all — the pieces being filtered are exactly what you were looking at.
        // A view change must, but not here: it belongs with the swap, which
        // happens a fade later in `CatalogueView`, at the moment the page is at
        // opacity 0 and nothing can be seen moving. Next's own reset would run
        // after the new view had painted, and with `scroll-behavior: smooth`
        // set globally it would animate in full view.

        // Hash included: nothing on the site pairs one with a query today, but
        // the route branch below preserves it and a silent difference between
        // the two is the kind that gets found the hard way.
        router.push(
          `${inPlace.pathname}${inPlace.search}${inPlace.hash}`,
          { scroll: false },
        );
        return;
      }

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
      setLeavingHref(url.pathname);

      pendingNavigation.current = window.setTimeout(() => {
        // Cleared before the push, not after: from here the navigation is
        // happening, and the cleanup above must not mistake it for one still
        // waiting to be called off.
        pendingNavigation.current = null;
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

  // Memoised: this object is the context value, and a fresh one every render
  // would re-render every consumer on every parent render — which here means
  // every tile in the grid, on a page that is otherwise entirely static.
  const state = useMemo(
    () => ({ leaving, href: leavingHref }),
    [leaving, leavingHref],
  );

  return (
    <LeavingContext.Provider value={state}>{children}</LeavingContext.Provider>
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
 *
 * The **exit is an animation too**, and that is a fix rather than a symmetry.
 * It used to be a transition to `opacity: 0` that also set `animation: none`,
 * because a `both`-filled entry keyframe outranks any ordinary declaration and
 * would otherwise pin the element opaque. But removing an animation and
 * changing the property it was animating in the same style recalculation does
 * not reliably start a transition — there is no before-change value left to
 * interpolate from — so the page did not fade out, it vanished. Only ever from
 * the second navigation onward, which is what made it look intermittent: the
 * first page of a document has no entry animation to remove, so its transition
 * worked, and every page after it had one. Two keyframes at one duration have
 * nothing to contend over.
 *
 * The first page of a document is the exception and gets no entry animation at
 * all — see `pageHasMounted`.
 */
export function PageFade({ children }: { children: React.ReactNode }) {
  const leaving = usePageLeaving();
  const ref = useRef<HTMLDivElement>(null);
  // Same reasoning as `held` below: read in the initialiser so the very first
  // render already knows, rather than a frame of animation playing and then
  // being taken away.
  const [entering] = useState(() => pageHasMounted);
  // Read in the initialiser, so a page arrived at through a transition is
  // already paused on its very first render — no effect, no frame of fade
  // played before the hold applies. Reading a module flag here is safe under
  // StrictMode's double-invoked initialiser precisely because it only reads;
  // the clearing happens in an effect below.
  const [held, setHeld] = useState(() => arrivedByNavigation);

  useEffect(() => {
    arrivedByNavigation = false;
    pageHasMounted = true;
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

  // A page still holding for its images has never actually been seen: it is
  // sitting at opacity 0 with its entry paused. There is nothing to fade out,
  // and the exit keyframe starts from `opacity: 1` — so running it here would
  // snap the blank page fully visible and *then* fade it, which is worse than
  // the swap it replaced. Leave it paused and let the navigation happen under
  // it. Reachable whenever a link is clicked inside `MEDIA_WAIT_CAP_MS` of
  // arriving, which the rails invite: they are outside this element and so stay
  // visible and clickable for the whole hold.
  const exiting = leaving && !held;

  return (
    <div
      ref={ref}
      className={cn(
        "motion-reduce:animate-none",
        entering && "animate-mbpage",
        // Last, so tailwind-merge resolves the `animation` conflict in favour
        // of the exit while a page is leaving.
        exiting && "animate-mbpageout",
      )}
      // Only ever pauses the entry. The exit needs no inline style at all now
      // that it is an animation of its own.
      style={held ? { animationPlayState: "paused" } : undefined}
    >
      {children}
    </div>
  );
}
