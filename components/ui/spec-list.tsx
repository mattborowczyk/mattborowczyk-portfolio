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
    <dl
      className={cn(
        "grid grid-cols-[auto_1fr] gap-x-lg gap-y-xs font-mono text-body",
        sizeClass[size],
        className,
      )}
    >
      {/* Keyed by position, not label: labels come from the CMS and repeat
          freely (two "Email" rows in Contact details is perfectly reasonable). */}
      {items.map((item, i) => (
        <div key={i} className="contents">
          <dt className="text-label-light">{item.label}</dt>
          <dd>
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
