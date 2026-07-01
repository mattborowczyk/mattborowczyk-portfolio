"use client";

import RenderPlaceholder from "@/components/render-placeholder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Course, courseFormat, courses } from "@/lib/courses";

/** Disabled enrol button — no checkout URL yet (renders, non-functional). */
function EnrolButton({
  label,
  full = false,
}: {
  label: string;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      disabled
      title="Enrolment opening soon"
      className={`${full ? "block w-full" : "inline-block"} cursor-not-allowed bg-ink px-8 py-4 text-center font-sans text-[12px] font-bold uppercase tracking-[0.12em] text-bone opacity-60`}
    >
      {label}
    </button>
  );
}

function CourseBody({ course }: { course: Course }) {
  return (
    <div className="animate-mbfade">
      {/* Hero (headline / intro / enrol) */}
      <div className="mx-auto max-w-[980px] px-[clamp(20px,5vw,72px)]">
        <h1 className="max-w-[15ch] font-serif text-[clamp(40px,6.5vw,84px)] font-medium leading-none tracking-[-0.01em] text-ink">
          {course.headline}
        </h1>
        <p className="mt-7 max-w-[52ch] text-[17px] leading-[1.75] text-body-soft">
          {course.intro}
        </p>
        <div className="mt-[38px] flex flex-wrap items-center gap-5">
          <EnrolButton label={`Enrol — ${course.price} →`} />
          <span className="font-mono text-[11px] tracking-[0.06em] text-label">
            {course.meta}
          </span>
        </div>
      </div>

      {/* Hero image */}
      <div className="mx-auto mt-12 max-w-[980px] px-[clamp(20px,5vw,72px)]">
        <div className="aspect-[16/9]">
          <RenderPlaceholder tone="#c8cfc1" caption="Course Preview" />
        </div>
      </div>

      {/* Curriculum */}
      <div className="mx-auto max-w-[980px] px-[clamp(20px,5vw,72px)] pt-[clamp(52px,8vw,96px)]">
        <p className="mb-7 font-mono text-[11px] uppercase tracking-[0.18em] text-label">
          Curriculum
        </p>
        <div className="flex flex-col">
          {course.modules.map((m) => (
            <div
              key={m.no}
              className="flex flex-wrap items-baseline gap-[clamp(16px,3vw,40px)] border-t border-[color:var(--hairline)] py-6"
            >
              <div className="w-11 flex-none font-serif text-[32px] leading-none text-gold opacity-50">
                {m.no}
              </div>
              <div className="min-w-0 flex-[1_1_260px]">
                <div className="mb-[5px] font-sans text-[15px] font-bold text-ink">
                  {m.title}
                </div>
                <div className="max-w-[52ch] text-[13.5px] leading-[1.6] text-body-muted">
                  {m.body}
                </div>
              </div>
              <div className="flex-none font-mono text-[11px] tracking-[0.06em] text-label-light">
                {m.duration}
              </div>
            </div>
          ))}
          <div className="border-t border-[color:var(--hairline)]" />
        </div>
      </div>

      {/* Included + enrol band */}
      <div className="mx-auto mt-[clamp(52px,8vw,90px)] max-w-[980px] px-[clamp(20px,5vw,72px)] pb-[90px]">
        <div className="flex flex-col items-start gap-[clamp(28px,5vw,56px)] nav:flex-row">
          {/* What's included */}
          <div className="w-full min-w-0 flex-[1.2] nav:w-auto">
            <p className="mb-[22px] font-mono text-[11px] uppercase tracking-[0.18em] text-label">
              What’s included
            </p>
            <div className="flex flex-col gap-3">
              {course.includes.map((inc) => (
                <div
                  key={inc}
                  className="flex items-baseline gap-3 text-[15px] leading-[1.5] text-body"
                >
                  <span className="flex-none font-mono text-[11px] text-gold">→</span>
                  <span>{inc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Format + enrol card */}
          <div className="w-full min-w-0 flex-1 nav:w-auto">
            <div className="bg-band px-[clamp(24px,3vw,32px)] py-[30px]">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-[11px] font-mono text-[12px] tracking-[0.02em] text-body">
                {(
                  [
                    ["Format", courseFormat.format],
                    ["Level", course.level],
                    ["Length", course.length],
                    ["Access", courseFormat.access],
                    ["Files", courseFormat.files],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-label-light">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mb-5 mt-7 flex items-baseline gap-3.5 border-t border-[rgba(40,38,33,0.14)] pt-[22px]">
                <span className="font-serif text-[44px] leading-none text-ink">
                  {course.price}
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.06em] text-label-light">
                  ONE-TIME
                </span>
              </div>

              <EnrolButton label="Enrol now →" full />
              <p className="mt-3 text-center font-mono text-[9px] tracking-[0.06em] text-label-lighter">
                Enrolment opening soon — secure checkout via easytools
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseView() {
  return (
    <Tabs
      defaultValue={courses[0].key}
      className="animate-mbfade pt-[clamp(48px,8vw,110px)]"
    >
      <div className="mx-auto max-w-[980px] px-[clamp(20px,5vw,72px)]">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-label">
          Course — Online, self-paced
        </p>
        <TabsList className="mb-[30px] border border-[rgba(40,38,33,0.18)]">
          {courses.map((c) => (
            <TabsTrigger
              key={c.key}
              value={c.key}
              className="px-[22px] py-[11px] text-ink data-[state=active]:bg-ink data-[state=active]:text-bone"
            >
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {courses.map((c) => (
        <TabsContent key={c.key} value={c.key}>
          <CourseBody course={c} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
