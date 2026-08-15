import { cn } from "@/lib/utils";
import { UnderlineAnchor } from "@/components/ui/underline-link";

export type SpecItem = {
  label: string;
  value: string;
  /** When set the value renders as a link (external targets open in a tab). */
  href?: string;
};

const sizeClass = {
  sm: "text-sm tracking-wide-xs",
  md: "text-md tracking-wide-xs",
  base: "text-base tracking-wide-xs",
} as const;

/**
 * Two-column label/value table — the studio specs, contact details, commission
 * pricing and course format card are all this one shape. `contents` on the
 * wrapper lets each pair keep its key while the grid stays two columns.
 */
export default function SpecList({
  items,
  size = "md",
  className,
}: {
  items: readonly SpecItem[];
  size?: keyof typeof sizeClass;
  className?: string;
}) {
  return (
    /* `minmax(0,1fr)`, not `1fr`. A `1fr` track is `minmax(auto,1fr)`, and its
       `auto` floor is the column's *min-content* width — the longest
       unbreakable run in it. On Contact that is `studio@mattborowczyk.com`,
       which is 200px, so at a 320px viewport the value column refused to go
       below 200 and pushed 7px of the page off the right edge: a horizontal
       scrollbar, which is what WCAG 1.4.10 exists to prevent. A zero floor lets
       the track shrink; `break-words` on the cell below is the other half, or
       the address would simply overflow the narrower box instead. */
    <dl
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] gap-x-lg gap-y-xs font-mono text-body",
        sizeClass[size],
        className,
      )}
    >
      {/* Keyed by position, not label: labels come from the CMS and repeat
          freely (two "Email" rows in Contact details is perfectly reasonable). */}
      {items.map((item, i) => (
        <div key={i} className="contents">
          <dt className="text-label-light">{item.label}</dt>
          <dd className="break-words">
            {item.href ? (
              <UnderlineAnchor
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              >
                {item.value}
              </UnderlineAnchor>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
