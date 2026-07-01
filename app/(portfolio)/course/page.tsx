import type { Metadata } from "next";

import CourseView from "@/components/course-view";
import { getCourses } from "@/sanity/lib/fetch-data";

export const revalidate = 60; // ISR

export const metadata: Metadata = {
  title: "Course",
  description:
    "Online, self-paced 3D-jewellery courses — design jewellery and custom grillz from sketch to cast-ready file.",
};

export default async function CoursePage() {
  const courses = await getCourses();
  return <CourseView courses={courses} />;
}
