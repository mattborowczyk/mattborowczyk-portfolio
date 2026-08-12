"use client";

import SpecList from "@/components/ui/spec-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PricingTab } from "@/sanity/lib/fetch-data";

/**
 * Commission pricing as a segmented control — one tab per commission type, each
 * with its own label/value grid. Same tab dressing as the course page.
 */
export default function CommissionPricing({ tabs }: { tabs: PricingTab[] }) {
  if (tabs.length === 0) return null;

  return (
    <Tabs defaultValue={tabs[0].key} className="flex flex-col gap-md">
      {/* The box around the segmented control is the only thing that says it
          is one control rather than two words; `hairline-ui` is the weight
          that carries 3:1 against the page, as WCAG 1.4.11 asks. */}
      <TabsList className="self-start border border-hairline-ui">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className="px-md py-3 text-ink data-[state=active]:bg-ink data-[state=active]:text-bone"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.key} value={tab.key}>
          <SpecList items={tab.items} className="bg-band p-md" />
        </TabsContent>
      ))}
    </Tabs>
  );
}
