import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Content measures, xs → lg. See `--shell-*` in globals.css. */
type Shell = "xs" | "sm" | "md" | "lg";

const shellClass: Record<Shell, string> = {
  xs: "max-w-shell-xs",
  sm: "max-w-shell-sm",
  md: "max-w-shell-md",
  lg: "max-w-shell-lg",
};

/**
 * The single horizontal frame for page content: centred, capped to one of the
 * four measures, and padded by the fluid page gutter. Every page uses this
 * instead of repeating a max-width + clamp() pair.
 *
 * `tight` swaps in the narrower gutter used by the full-bleed product page.
 */
export default function Container({
  size = "sm",
  tight = false,
  as: Tag = "div",
  className,
  children,
}: {
  size?: Shell;
  tight?: boolean;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full",
        shellClass[size],
        tight ? "px-gutter-tight" : "px-gutter",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
