import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Solid near-black → gold CTA used for the primary "Start a commission"
 * conversion actions. Shared so the two CTAs stay visually identical.
 */
export const ctaSolidClass =
  "inline-block bg-ink px-7 py-[15px] font-sans text-[12px] font-bold uppercase tracking-[0.12em] text-bone transition-colors hover:bg-gold";

export function CtaLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return <Link className={cn(ctaSolidClass, className)} {...props} />;
}

export function CtaAnchor({
  className,
  ...props
}: ComponentProps<"a">) {
  return <a className={cn(ctaSolidClass, className)} {...props} />;
}
