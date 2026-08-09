import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CourseView from "@/components/course-view";
import { getCourses, getSettings } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

export const metadata: Metadata = {
  title: "Course",
  description:
    "Online, self-paced 3D-jewellery courses — design jewellery and custom grillz from sketch to cast-ready file.",
};

export default async function CoursePage() {
  const [courses, settings] = await Promise.all([getCourses(), getSettings()]);

  // The real gate for the CMS switch — hiding the nav entry only removes the
  // signpost, and a bookmark or a crawler would still reach the page. Unlike
  // the coming-soon curtain this is a genuine 404 rather than an overlay, so
  // the course stops being indexable while it is off.
  if (!settings.courseEnabled) notFound();

  return <CourseView courses={courses} />;
}
