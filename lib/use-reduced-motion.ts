"use client";

import { useEffect, useState } from "react";

/**
 * Whether the visitor has asked for less motion, as live state.
 *
 * There are two other readings of the same query in the codebase and both are
 * right where they are: `components/page-transition.tsx` and
 * `components/course-view.tsx` consult `matchMedia` inside an event handler,
 * where `window` certainly exists and the answer is only needed once, at the
 * moment of a press. This is for the other case — a decision that has to hold
 * across a render rather than a click, which today means whether a clip is
 * allowed to play.
 *
 * Starts `false` and is corrected in an effect rather than read in the
 * initialiser: there is no `window` during the server render, and a client
 * that disagreed with the HTML on the first pass would be a hydration
 * mismatch. Same shape, and for the same reason, as `useHoverCapable` in
 * components/catalogue-run.tsx.
 *
 * Note which way the initial value errs. It says "motion is fine" for the one
 * frame before the effect runs, which for an autoplaying video means the clip
 * may begin and be paused immediately after. That is the safe direction for a
 * *muted, looping* clip; it would not be for anything with sound.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
