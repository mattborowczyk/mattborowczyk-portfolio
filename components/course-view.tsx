"use client";

import RenderPlaceholder from "@/components/render-placeholder";
import Container from "@/components/ui/container";
import { CtaAnchor, CtaButton } from "@/components/ui/cta";
import Eyebrow from "@/components/ui/eyebrow";
import SpecList from "@/components/ui/spec-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Course, courseFormat } from "@/lib/courses";

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
    <div className="flex animate-mbfade flex-col gap-section">
      {/* Hero (headline / intro / enrol) */}
      <Container size="lg" className="flex flex-col gap-lg">
        <h1 className="max-w-[15ch] font-serif text-heading-xl font-medium leading-none tracking-tight text-ink">
          {course.headline}
        </h1>
        <p className="max-w-[52ch] text-2xl leading-loose text-body-soft">
          {course.intro}
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <EnrolButton
            label={`Enrol — ${course.price} →`}
            href={course.checkoutUrl}
          />
          <span className="font-mono text-sm tracking-wide-sm text-label">
            {course.meta}
          </span>
        </div>
      </Container>

      {/* Hero image */}
      <Container size="lg">
        <div className="aspect-[16/9]">
          <RenderPlaceholder tone="#c8cfc1" caption="Course Preview" />
        </div>
      </Container>

      {/* Curriculum */}
      <Container size="lg" className="flex flex-col gap-md">
        <Eyebrow>Curriculum</Eyebrow>
        <div className="flex flex-col border-b border-hairline">
          {course.modules.map((m) => (
            <div
              key={m.no}
              className="flex flex-wrap items-baseline gap-x-stack-sm gap-y-3 border-t border-hairline py-6"
            >
              <div className="w-11 flex-none font-serif text-display-lg leading-none text-gold opacity-50">
                {m.no}
              </div>
              <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-3xs">
                <div className="font-sans text-lg font-bold text-ink">
                  {m.title}
                </div>
                <div className="max-w-[52ch] text-base leading-relaxed text-body-muted">
                  {m.body}
                </div>
              </div>
              <div className="flex-none font-mono text-sm tracking-wide-sm text-label-light">
                {m.duration}
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Included + enrol band */}
      <Container size="lg" className="pb-3xl">
        <div className="flex flex-col items-start gap-stack nav:flex-row">
          {/* What's included */}
          <div className="flex w-full min-w-0 flex-[1.2] flex-col gap-md nav:w-auto">
            <Eyebrow>What’s included</Eyebrow>
            <div className="flex flex-col gap-3">
              {course.includes.map((inc) => (
                <div
                  key={inc}
                  className="flex items-baseline gap-3 text-lg leading-normal text-body"
                >
                  <span className="flex-none font-mono text-sm text-gold">→</span>
                  <span>{inc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Format + enrol card */}
          <div className="w-full min-w-0 flex-1 nav:w-auto">
            <div className="flex flex-col gap-md bg-band p-lg">
              <SpecList
                items={[
                  { label: "Format", value: courseFormat.format },
                  { label: "Level", value: course.level },
                  { label: "Length", value: course.length },
                  { label: "Access", value: courseFormat.access },
                  { label: "Files", value: courseFormat.files },
                ]}
              />

              <div className="flex items-baseline gap-3.5 border-t border-hairline-md pt-md">
                <span className="font-serif text-display-2xl leading-none text-ink">
                  {course.price}
                </span>
                <span className="font-mono text-xs uppercase tracking-wide-sm text-label-light">
                  One-time
                </span>
              </div>

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

export default function CourseView({ courses }: { courses: Course[] }) {
  if (courses.length === 0) return null;
  return (
    <Tabs
      defaultValue={courses[0].key}
      className="animate-mbfade pt-section-lg"
    >
      <Container size="lg" className="flex flex-col gap-4 pb-lg">
        <Eyebrow>Course — Online, self-paced</Eyebrow>
        <TabsList className="self-start border border-hairline-md">
          {courses.map((c) => (
            <TabsTrigger
              key={c.key}
              value={c.key}
              className="px-md py-3 text-ink data-[state=active]:bg-ink data-[state=active]:text-bone"
            >
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Container>

      {courses.map((c) => (
        <TabsContent key={c.key} value={c.key}>
          <CourseBody course={c} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
