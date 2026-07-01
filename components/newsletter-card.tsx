"use client";

import { useEffect, useRef, useState } from "react";

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
export default function NewsletterCard() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email }),
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
        setTimeout(() => setShow(false), 1600);
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
    <div className="animate-mbnl fixed bottom-6 right-6 z-[200] w-[min(88vw,292px)] bg-card shadow-[0_2px_24px_rgba(28,25,22,0.09)]">
      <div className="relative px-[22px] pb-[22px] pt-5">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss newsletter"
          className="absolute right-4 top-3.5 font-mono text-[11px] leading-none text-label-lighter transition-colors hover:text-ink"
        >
          ✕
        </button>

        <p className="mb-1.5 pr-[18px] font-serif text-[20px] leading-[1.25] tracking-[-0.01em]">
          New work, when it happens.
        </p>
        <p className="mb-4 font-mono text-[9px] leading-[1.65] tracking-[0.08em] text-label">
          Studio releases &amp; process notes. Sent rarely.
        </p>

        {status === "success" ? (
          <p className="font-mono text-[10px] leading-[1.6] tracking-[0.04em] text-body">
            {message}
          </p>
        ) : (
          <form onSubmit={subscribe}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={status === "loading"}
              className="mb-3 block w-full border-b border-[rgba(40,38,33,0.18)] bg-transparent py-2 font-mono text-[11px] text-ink outline-none placeholder:text-label-lighter disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-ink py-3 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-gold disabled:opacity-50"
            >
              {status === "loading" ? "…" : "Subscribe"}
            </button>
            {status === "error" && (
              <p className="mt-2 font-mono text-[9px] tracking-[0.04em] text-[#9a3b2f]">
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
