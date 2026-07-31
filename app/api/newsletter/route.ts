import { NextRequest, NextResponse } from "next/server";
import { NewsletterError, subscribeToNewsletter } from "@/lib/mailerlite";

/**
 * Throttling is not done here. It lives at the edge, in
 * netlify/edge-functions/newsletter-guard.ts, which Netlify enforces before
 * this handler is ever invoked — so an over-limit request costs no compute and
 * never reaches this code. The 429 a client sees is Netlify's, not ours.
 *
 * What remains here is application-level: the honeypot and format validation.
 */
export async function POST(req: NextRequest) {
  try {
    // A malformed body is the caller's mistake, not ours — `req.json()` rejects
    // (it never resolves to null), so it needs its own catch to stay a 400
    // instead of falling through to the generic 500 below.
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const { email, companyUrl } = (body ?? {}) as {
      email?: unknown;
      companyUrl?: unknown;
    };

    // Honeypot: hidden field that only a bot would fill in. Report success so
    // the bot doesn't retry, but don't touch MailerLite. Deliberately NOT named
    // "company" — that's a real MailerLite field name.
    if (typeof companyUrl === "string" && companyUrl.trim() !== "") {
      return NextResponse.json(
        { message: "Almost there — check your inbox to confirm." },
        { status: 200 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    await subscribeToNewsletter(email.toLowerCase().trim());

    return NextResponse.json(
      { message: "Almost there — check your inbox to confirm." },
      { status: 200 }
    );
  } catch (err) {
    // Log the detailed cause; return only the user-safe message.
    console.error("[newsletter]", err);

    if (err instanceof NewsletterError) {
      return NextResponse.json(
        { error: err.userMessage },
        { status: err.status }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
