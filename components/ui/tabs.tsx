"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Tabs (Radix) — unstyled here so pages can dress the segmented
 * control to the editorial tokens. Gives keyboard/roving-tabindex a11y.
 */
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("inline-flex items-center", className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    // The ring is drawn *inside* the trigger. These sit flush against each
    // other inside one bordered box, so an offset ring would be clipped by the
    // neighbour on one side and overlap it on the other; `outline-offset` of
    // -2px keeps the whole indicator on the button it belongs to. It used to
    // be `focus-visible:outline-none` with nothing put back, which left the
    // segmented control keyboard-operable and invisible while operated.
    className={cn(
      "cursor-pointer font-sans text-sm font-bold uppercase tracking-wide-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-ink disabled:pointer-events-none",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  // Radix gives the panel `tabindex="0"` so the content below a tab list is
  // reachable, which makes it a stop in the tab order like any other — and it
  // was another `outline-none`.
  <TabsPrimitive.Content
    ref={ref}
    className={cn("focus-ring", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
