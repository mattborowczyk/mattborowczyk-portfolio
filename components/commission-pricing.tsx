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
      <TabsList className="self-start border border-hairline-md">
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
