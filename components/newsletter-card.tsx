"use client";

import { useEffect, useRef, useState } from "react";

import { CtaButton } from "@/components/ui/cta";

const DISMISS_KEY = "mb_nl_v2_dismissed";
const OPEN_EVENT = "mb:newsletter-open";
/** Ties the inline error to the email field via `aria-describedby`. */
const ERROR_ID = "mb-newsletter-error";

/** Dispatch from anywhere (e.g. the Links page) to open the newsletter card. */
export function openNewsletter() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

type Status = "idle" | "loading" | "success" | "error";

/**
 * Subtle bottom-right newsletter card. Slides in 2s after load (once, unless
 * previously dismissed), and can be re-opened on demand. No overlay/dimming.
 * Subscribe posts to the existing MailerLite endpoint.
 */
export default function NewsletterCard({
  headline,
  microcopy,
}: {
  headline: string;
  microcopy: string;
}) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  // Honeypot — humans leave this empty. Not named "company": that's a real
  // MailerLite field, and the collision would be confusing later.
  const [companyUrl, setCompanyUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  // Whether the current error is the *field's* — see `subscribe`. Separate
  // from `status` because the card shows one message either way, and only this
  // subset of errors may be attached to the input.
  const [fieldError, setFieldError] = useState(false);
  // One ref for every pending timer — the auto-open delay and the post-success
  // auto-close both live here, so opening the card always cancels whichever is
  // outstanding. Previously the close timer was unowned: re-opening within 4s
  // of a successful signup got shut again by the earlier timeout.
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = !!localStorage.getItem(DISMISS_KEY);
    } catch {
      /* localStorage unavailable — behave as not-dismissed */
    }
    if (!dismissed) {
      autoTimer.current = setTimeout(() => setShow(true), 2000);
    }

    const onOpen = () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
      setStatus("idle");
      setFieldError(false);
      setShow(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    setFieldError(false);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyUrl }),
      });
      // Throttling happens at the Netlify edge, so a 429 carries Netlify's own
      // response rather than our JSON envelope — `data.error` would be empty
      // and the generic fallback would invite a retry that's certain to fail.
      if (res.status === 429) {
        setStatus("error");
        setMessage("Too many attempts — please try again in a few minutes.");
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "You’re on the list.");
        setEmail("");
        try {
          localStorage.setItem(DISMISS_KEY, "1");
        } catch {
          /* ignore */
        }
        // Long enough to read a "check your inbox to confirm" instruction.
        if (autoTimer.current) clearTimeout(autoTimer.current);
        autoTimer.current = setTimeout(() => setShow(false), 4000);
      } else {
        setStatus("error");
        // 400 is the route's answer to an address it will not accept, and the
        // only failure that is about the *value in the field*. Everything else
        // here — 429 above, a 500, the network giving out below — is about the
        // request, and saying `aria-invalid` for one of those would tell a
        // screen reader the address is wrong when it is fine.
        setFieldError(res.status === 400);
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (!show) return null;

  return (
    // A labelled landmark, so the card is not a loose region of the page: it
    // arrives on its own two seconds in, and a screen reader user meeting it at
    // the end of the document should be told what it is before its heading.
    <section
      aria-label="Newsletter"
      className="animate-mbnl fixed bottom-6 right-6 z-[200] w-[min(88vw,18.25rem)] bg-card shadow-card"
    >
      <div className="relative flex flex-col gap-4 p-md">
        {/* The glyph is 7×11px, which was the whole target — under half the
            24px WCAG 2.5.8 asks for, on the one control that dismisses an
            overlay. The box is now 24×24 with the ✕ centred in it, and the
            offsets are pulled in to keep the glyph exactly where it was. */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss newsletter"
          className="focus-ring absolute right-2 top-2 flex h-6 w-6 items-center justify-center font-mono text-sm leading-none text-label-lighter transition-colors hover:text-ink"
        >
          ✕
        </button>

        <div className="flex flex-col gap-1.5">
          <p className="pr-4 font-serif text-display-sm leading-snug tracking-tight">
            {headline}
          </p>
          <p className="font-mono text-2xs leading-relaxed tracking-wide-sm text-label">
            {microcopy}
          </p>
        </div>

        {/* Both outcomes are announced. The success case replaces the form
            outright and the error case appears under it, and a DOM change is
            silent either way — a screen reader user pressed Subscribe and then
            waited for something that had already happened. `role="status"`
            (polite) rather than `alert`, for both: neither interrupts anything
            the visitor is more likely to be doing. */}
        {status === "success" ? (
          <p
            role="status"
            className="font-mono text-xs leading-relaxed tracking-wide-xs text-body"
          >
            {message}
          </p>
        ) : (
          <form onSubmit={subscribe} className="flex flex-col gap-3">
            <input
              type="text"
              name="company_url"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />
            {/* `outline-none` with nothing in its place left the one text
                input on the site with no focus indicator at all. The ring is
                inset here rather than offset — the field is a bare underline
                with no box of its own, so an outset ring would float clear of
                anything it could be read as belonging to.

                `aria-describedby` is what ties the error to the field: without
                it the message is a paragraph that happens to sit underneath,
                and moving focus back to the input to correct it announces the
                label and nothing about what went wrong.

                Both attributes hang off `fieldError` and not off `status`,
                because only some of the errors are the field's. A rate limit,
                a 500 or a dropped connection all end in the same `status` and
                the same message, and marking the input invalid for those would
                say the address is wrong when there is nothing wrong with it —
                and would send someone back to re-type a perfectly good one. */}
            <input
              type="email"
              required
              aria-label="Email address"
              aria-describedby={fieldError ? ERROR_ID : undefined}
              aria-invalid={fieldError || undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={status === "loading"}
              className="block w-full border-b border-hairline-ui bg-transparent py-2 font-mono text-sm text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-ink placeholder:text-label-lightest disabled:opacity-50"
            />
            <CtaButton type="submit" size="sm" block disabled={status === "loading"}>
              {status === "loading" ? "…" : "Subscribe"}
            </CtaButton>
            {status === "error" && (
              <p
                id={ERROR_ID}
                role="status"
                className="font-mono text-2xs tracking-wide-xs text-danger"
              >
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
