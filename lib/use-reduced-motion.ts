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
 * The answer is corrected in an effect rather than read in the initialiser:
 * there is no `window` during the server render, and a client that disagreed
 * with the HTML on the first pass would be a hydration mismatch. Same shape,
 * and for the same reason, as `useHoverCapable` in
 * components/catalogue-run.tsx.
 *
 * But it starts `true`, which is the opposite of that hook, and the difference
 * is the whole point. The initial value is not a guess at the preference — it
 * is what happens in the window before the preference is *knowable*, and the
 * two directions are not symmetrical. Starting `false` puts `autoplay` in the
 * server-rendered HTML, so the clip begins at parse time and plays until
 * hydration catches up and pauses it: a visitor who asked for no motion gets
 * motion for exactly as long as their connection is slow, which is precisely
 * backwards. Starting `true` costs the other visitor a clip that begins a beat
 * late.
 *
 * The price is real and worth stating: playback now needs JavaScript, where
 * before the `autoplay` attribute carried it. What is shown in the meantime is
 * the poster frame, which is what a piece at rest looks like anyway.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
