import Link from "next/link";

import Container from "@/components/ui/container";
import Eyebrow from "@/components/ui/eyebrow";
import { underlineLinkClass } from "@/components/ui/underline-link";

/**
 * Root 404. Deliberately self-contained (no rails, no footer) — it is rendered
 * for unmatched URLs anywhere in the app, including outside the portfolio
 * group, so it can't assume the shell's settings are in hand.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center">
      <Container className="flex animate-mbfade flex-col gap-lg py-2xl">
        <div className="flex flex-col gap-md">
          <Eyebrow>404</Eyebrow>
          <h1 className="max-w-[18ch] font-serif text-heading-md font-medium leading-display text-ink">
            That piece isn’t here.
          </h1>
          <p className="max-w-[48ch] text-lg leading-loose text-body-soft">
            The page may have moved, or the reference may be retired.
          </p>
        </div>

        <Link href="/" className={`${underlineLinkClass} self-start text-xs uppercase tracking-wide-lg`}>
          ← Back to the portfolio
        </Link>
      </Container>
    </main>
  );
}
