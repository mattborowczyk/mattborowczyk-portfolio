"use client";

import { useEffect, useRef, useState } from "react";

import { CtaButton } from "@/components/ui/cta";

const DISMISS_KEY = "mb_nl_v2_dismissed";
const OPEN_EVENT = "mb:newsletter-open";

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
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyUrl }),
      });
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
        setTimeout(() => setShow(false), 4000);
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (!show) return null;

  return (
    <div className="animate-mbnl fixed bottom-6 right-6 z-[200] w-[min(88vw,18.25rem)] bg-card shadow-card">
      <div className="relative flex flex-col gap-4 p-md">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss newsletter"
          className="absolute right-4 top-3.5 font-mono text-sm leading-none text-label-lighter transition-colors hover:text-ink"
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

        {status === "success" ? (
          <p className="font-mono text-xs leading-relaxed tracking-wide-xs text-body">
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
            <input
              type="email"
              required
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={status === "loading"}
              className="block w-full border-b border-hairline-md bg-transparent py-2 font-mono text-sm text-ink outline-none placeholder:text-label-lighter disabled:opacity-50"
            />
            <CtaButton type="submit" size="sm" block disabled={status === "loading"}>
              {status === "loading" ? "…" : "Subscribe"}
            </CtaButton>
            {status === "error" && (
              <p className="font-mono text-2xs tracking-wide-xs text-danger">
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
