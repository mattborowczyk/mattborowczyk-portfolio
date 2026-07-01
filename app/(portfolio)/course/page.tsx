import type { Metadata } from "next";

import CourseView from "@/components/course-view";

export const metadata: Metadata = {
  title: "Course",
  description:
    "Online, self-paced 3D-jewellery courses — design jewellery and custom grillz from sketch to cast-ready file.",
};

export default function CoursePage() {
  return <CourseView />;
}
