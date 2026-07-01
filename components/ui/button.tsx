import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Button — restyled to the editorial tokens:
 * square corners, hairline / near-black variants, gold hover.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-sans font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Solid near-black CTA → gold on hover.
        solid: "bg-ink text-bone hover:bg-gold",
        // Hairline outline → subtle fill on hover.
        outline:
          "border border-[color:var(--hairline)] bg-transparent text-ink hover:bg-card",
        // Bare text link, mono, gold on hover (used for inline "→" links).
        link: "font-mono underline underline-offset-2 hover:text-gold p-0 h-auto",
        ghost: "hover:bg-card text-ink",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8",
        full: "h-12 w-full px-8",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
