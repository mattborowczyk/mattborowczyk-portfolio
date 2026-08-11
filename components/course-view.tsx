"use client";

import { useEffect, useRef, useState } from "react";

import RenderPlaceholder from "@/components/render-placeholder";
import Container from "@/components/ui/container";
import { CtaAnchor, CtaButton } from "@/components/ui/cta";
import Eyebrow from "@/components/ui/eyebrow";
import SpecList from "@/components/ui/spec-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Course, courseFormat } from "@/lib/courses";
import { cn } from "@/lib/utils";

/**
 * Tab cross-fade length — must match `--duration-base` in globals.css, which is
 * what the panel's own `transition-opacity` runs at. The timer is what holds
 * the outgoing panel on screen long enough to fade: Radix unmounts an inactive
 * panel the instant its value stops being the selected one, so switching tabs
 * immediately would leave nothing to animate and the panel would simply be
 * replaced — which is the "swift" swap this exists to soften.
 */
const TAB_FADE_MS = 350;

/**
 * Whether the visitor has asked for less motion.
 *
 * Read at the moment of the press rather than held in state: it is only ever
 * consulted inside an event handler, where `window` certainly exists, so there
 * is nothing to keep in sync and no hydration mismatch to arrange around.
 */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Enrol CTA. When a checkout URL exists it renders a real external link;
 * otherwise it stays disabled ("opening soon"). Seed data has no URL yet, so
 * without a connected CMS this always renders disabled — as before.
 */
function EnrolButton({
  label,
  href,
  block = false,
}: {
  label: string;
  href?: string | null;
  block?: boolean;
}) {
  if (href) {
    return (
      <CtaAnchor href={href} target="_blank" rel="noreferrer" block={block}>
        {label}
      </CtaAnchor>
    );
  }

  return (
    <CtaButton type="button" disabled title="Enrolment opening soon" block={block}>
      {label}
    </CtaButton>
  );
}

function CourseBody({ course }: { course: Course }) {
  return (
    <div className="flex animate-mbtab flex-col gap-section motion-reduce:animate-none">
      {/* Hero (headline / intro / enrol) */}
      <Container size="lg" className="flex flex-col gap-lg">
        <h1 className="max-w-[15ch] font-serif text-heading-xl font-medium leading-none tracking-tight text-ink">
          {course.headline}
        </h1>
        {course.intro && (
          <p className="max-w-[52ch] text-2xl leading-loose text-body-soft">
            {course.intro}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-5">
          <EnrolButton
            // An unpriced course still gets a working button — never "£undefined".
            label={course.price ? `Enrol — ${course.price} →` : "Enrol →"}
            href={course.checkoutUrl}
          />
          {course.meta && (
            <span className="font-mono text-sm tracking-wide-sm text-label">
              {course.meta}
            </span>
          )}
        </div>
      </Container>

      {/* Hero image */}
      <Container size="lg">
        <div className="aspect-[16/9]">
          <RenderPlaceholder tone="#c8cfc1" caption="Course Preview" />
        </div>
      </Container>

      {/* Curriculum — the whole section goes when a course has no modules yet */}
      {course.modules.length > 0 && (
        <Container size="lg" className="flex flex-col gap-md">
          <Eyebrow>Curriculum</Eyebrow>
          <div className="flex flex-col border-b border-hairline">
            {course.modules.map((m, i) => (
              <div
                key={i}
                className="flex flex-wrap items-baseline gap-x-stack-sm gap-y-3 border-t border-hairline py-6"
              >
                <div className="w-11 flex-none font-serif text-display-lg leading-none text-gold opacity-50">
                  {m.no}
                </div>
                <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-3xs">
                  <div className="font-sans text-lg font-bold text-ink">
                    {m.title}
                  </div>
                  {m.body && (
                    <div className="max-w-[52ch] text-base leading-relaxed text-body-muted">
                      {m.body}
                    </div>
                  )}
                </div>
                {m.duration && (
                  <div className="flex-none font-mono text-sm tracking-wide-sm text-label-light">
                    {m.duration}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* Included + enrol band */}
      <Container size="lg" className="pb-3xl">
        <div className="flex flex-col items-start gap-stack nav:flex-row">
          {/* What's included */}
          {course.includes.length > 0 && (
            <div className="flex w-full min-w-0 flex-[1.2] flex-col gap-md nav:w-auto">
              <Eyebrow>What’s included</Eyebrow>
              <div className="flex flex-col gap-3">
                {course.includes.map((inc, i) => (
                  <div
                    key={i}
                    className="flex items-baseline gap-3 text-lg leading-normal text-body"
                  >
                    <span className="flex-none font-mono text-sm text-gold">→</span>
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Format + enrol card */}
          <div className="w-full min-w-0 flex-1 nav:w-auto">
            <div className="flex flex-col gap-md bg-band p-lg">
              <SpecList
                // Level and length are optional in the CMS — drop the row
                // rather than render a label with nothing beside it.
                items={[
                  { label: "Format", value: courseFormat.format },
                  ...(course.level
                    ? [{ label: "Level", value: course.level }]
                    : []),
                  ...(course.length
                    ? [{ label: "Length", value: course.length }]
                    : []),
                  { label: "Access", value: courseFormat.access },
                  { label: "Files", value: courseFormat.files },
                ]}
              />

              {course.price && (
                <div className="flex items-baseline gap-3.5 border-t border-hairline-md pt-md">
                  <span className="font-serif text-display-2xl leading-none text-ink">
                    {course.price}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wide-sm text-label-light">
                    One-time
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <EnrolButton label="Enrol now →" href={course.checkoutUrl} block />
                <p className="text-center font-mono text-2xs tracking-wide-sm text-label-lighter">
                  {course.checkoutUrl
                    ? "Secure checkout via easytools"
                    : "Enrolment opening soon — secure checkout via easytools"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

/**
 * A tab change fades the panel out and the next one in, rather than swapping
 * it in one frame.
 *
 * Two pieces of state, and they are deliberately out of step. `selected` is the
 * tab the visitor just pressed and drives the segmented control, so the
 * highlight moves under the cursor with no delay. `shown` is the tab Radix is
 * actually on, and it lags by one fade — which is the whole trick, because
 * Radix unmounts a panel as soon as it stops being the selected one, and an
 * unmounted node cannot fade. Holding its value back keeps the outgoing panel
 * mounted for exactly as long as it takes to fade it out.
 *
 * The cost is that `aria-selected` follows `shown` and so trails the highlight
 * by `TAB_FADE_MS`. That is the better of the two trades available: the
 * alternative is keeping both panels mounted and stacked, which sizes the
 * section to the taller course and leaves a gap under the shorter one.
 */
export default function CourseView({ courses }: { courses: Course[] }) {
  const first = courses[0]?.key ?? "";
  const [selected, setSelected] = useState(first);
  const [shown, setShown] = useState(first);
  const swap = useRef<number | null>(null);

  // A pending swap would otherwise land after the page had gone.
  useEffect(() => {
    return () => {
      if (swap.current) window.clearTimeout(swap.current);
    };
  }, []);

  if (courses.length === 0) return null;

  // Both values are seeded once and would otherwise outlive the list they name:
  // if the course they point at is retired while this stays mounted, a
  // controlled `value` matching no panel renders the section as nothing at all.
  // Falling back to the first course keeps a page on screen.
  const keys = courses.map((c) => c.key);
  const safeShown = keys.includes(shown) ? shown : first;
  const safeSelected = keys.includes(selected) ? selected : first;

  const fading = safeSelected !== safeShown;

  function choose(next: string) {
    if (next === safeSelected) return;
    setSelected(next);
    if (swap.current) window.clearTimeout(swap.current);

    // Reduced motion takes the swap whole, with no fade and — the part that
    // matters — no delay. Holding the panel back for `TAB_FADE_MS` while the
    // transition it was waiting for has been suppressed leaves the section
    // blank for a third of a second, which is a worse answer to "less motion"
    // than the fade it was standing in for.
    if (prefersReducedMotion()) {
      setShown(next);
      return;
    }

    swap.current = window.setTimeout(() => {
      swap.current = null;
      setShown(next);
    }, TAB_FADE_MS);
  }

  // No `animate-mbfade` on the root: the page-level fade is owned by
  // PageTransition. The one inside `CourseBody` stays — it fires on a *tab*
  // change, which no page transition covers.
  return (
    <Tabs value={safeShown} onValueChange={choose}>
      <Container size="lg" className="flex flex-col gap-4 pb-lg">
        <Eyebrow>Course — Online, self-paced</Eyebrow>
        {/* A toggle with one option is furniture, not a choice — when the CMS
            leaves a single course enabled the page just showcases it. */}
        {courses.length > 1 && (
          <TabsList className="self-start border border-hairline-md">
            {courses.map((c) => (
              <TabsTrigger
                key={c.key}
                value={c.key}
                // Lit from `selected`, not from Radix's own state, so the
                // control answers the press immediately while the panel below
                // is still fading.
                className={cn(
                  "px-md py-3 text-ink",
                  safeSelected === c.key && "bg-ink text-bone",
                )}
              >
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
      </Container>

      {courses.map((c) => (
        <TabsContent key={c.key} value={c.key}>
          <div
            className={cn(
              "transition-opacity duration-base motion-reduce:transition-none",
              fading && "opacity-0",
            )}
          >
            <CourseBody course={c} />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
