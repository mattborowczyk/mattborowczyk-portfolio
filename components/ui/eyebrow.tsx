import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

const sizeClass = {
  /** Micro tagline (links hub). */
  "2xs": "text-2xs tracking-wide-xl text-label-light",
  /** Section marker inside dense layouts. */
  xs: "text-xs tracking-wide-xl text-label",
  /** Standard page eyebrow above an h1/h2. */
  sm: "text-sm tracking-wide-lg text-label",
} as const;

/**
 * The mono, uppercase, wide-tracked label that sits above every headline and
 * marks each section. One component so the whole site's eyebrows move
 * together when the scale changes.
 */
export default function Eyebrow({
  size = "sm",
  as: Tag = "p",
  className,
  children,
}: {
  size?: keyof typeof sizeClass;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn("font-mono uppercase", sizeClass[size], className)}>
      {children}
    </Tag>
  );
}
