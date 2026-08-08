"use client";

import { useEffect } from "react";

import Container from "@/components/ui/container";
import { CtaButton } from "@/components/ui/cta";
import Eyebrow from "@/components/ui/eyebrow";

/**
 * Route-level error boundary. Catches render/data failures below the root
 * layout and offers a retry, rather than dropping the visitor on Next's
 * unstyled default screen. The message itself is never shown — it can carry
 * internals — only logged.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The browser console is the visitor's, so only the full error is dev-only.
    // In production log just the digest — the id that correlates to the real
    // stack in the server logs — and nothing that could leak internals.
    if (process.env.NODE_ENV === "production") {
      if (error.digest) console.error(`[render] digest: ${error.digest}`);
    } else {
      console.error("[render]", error);
    }
  }, [error]);

  return (
    <main className="flex min-h-screen items-center">
      <Container className="flex animate-mbfade flex-col gap-lg py-2xl">
        <div className="flex flex-col gap-md">
          <Eyebrow>Error</Eyebrow>
          <h1 className="max-w-[18ch] font-serif text-heading-md font-medium leading-display text-ink">
            Something went wrong.
          </h1>
          <p className="max-w-[48ch] text-lg leading-loose text-body-soft">
            The page didn’t load. Trying again usually sorts it.
          </p>
        </div>

        <CtaButton type="button" onClick={reset} className="self-start">
          Try again
        </CtaButton>
      </Container>
    </main>
  );
}
