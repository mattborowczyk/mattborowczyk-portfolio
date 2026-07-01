import { cn } from "@/lib/utils";

/**
 * Stand-in for a real 3D render: a sage tonal background with a diagonal
 * stripe pattern and a centred mono caption. Swapped for `next/image`
 * once real render stills land in the CMS (Phase 3+).
 */
export default function RenderPlaceholder({
  tone,
  caption = "3D RENDER",
  code,
  className,
}: {
  tone: string;
  caption?: string;
  code?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "render-stripe relative flex h-full w-full flex-col items-center justify-center",
        className,
      )}
      style={{ backgroundColor: tone }}
      aria-hidden="true"
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-label">
        {caption}
      </span>
      {code && (
        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-label-light">
          {code}
        </span>
      )}
    </div>
  );
}
