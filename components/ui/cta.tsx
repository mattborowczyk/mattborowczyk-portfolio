import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type CtaSize = "sm" | "md";

const sizeClass: Record<CtaSize, string> = {
  /** Compact — inside cards (newsletter subscribe). */
  sm: "px-md py-sm text-xs tracking-wide-lg",
  /** Standard page CTA. */
  md: "px-lg py-sm text-md tracking-wide-md",
};

/**
 * Solid near-black → gold CTA: the site's one primary conversion action
 * ("Start a commission", "Enrol", "Subscribe"). Shared so every instance
 * stays visually identical.
 */
export function ctaClass({
  size = "md",
  block = false,
  className,
}: { size?: CtaSize; block?: boolean; className?: string } = {}) {
  return cn(
    "bg-ink text-center font-sans font-bold uppercase text-bone transition-colors duration-fast hover:bg-gold",
    sizeClass[size],
    block ? "block w-full" : "inline-block",
    className,
  );
}

type CtaOptions = { size?: CtaSize; block?: boolean };

export function CtaLink({
  size,
  block,
  className,
  ...props
}: ComponentProps<typeof Link> & CtaOptions) {
  return <Link className={ctaClass({ size, block, className })} {...props} />;
}

export function CtaAnchor({
  size,
  block,
  className,
  ...props
}: ComponentProps<"a"> & CtaOptions) {
  return <a className={ctaClass({ size, block, className })} {...props} />;
}

export function CtaButton({
  size,
  block,
  className,
  ...props
}: ComponentProps<"button"> & CtaOptions) {
  return (
    <button
      className={ctaClass({
        size,
        block,
        className: cn("disabled:cursor-not-allowed disabled:opacity-60", className),
      })}
      {...props}
    />
  );
}
