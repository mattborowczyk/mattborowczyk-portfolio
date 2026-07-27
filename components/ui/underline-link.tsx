import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Mono link on a hairline underscore, going gold on hover — the site's inline
 * link treatment (commission prompts, contact details). Size and casing come
 * from the caller so it can sit inside copy of any scale.
 */
export const underlineLinkClass =
  "border-b border-hairline-strong pb-px font-mono text-ink transition-colors hover:text-gold";

export function UnderlineAnchor({
  className,
  ...props
}: ComponentProps<"a">) {
  return <a className={cn(underlineLinkClass, className)} {...props} />;
}

export function UnderlineLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return <Link className={cn(underlineLinkClass, className)} {...props} />;
}
