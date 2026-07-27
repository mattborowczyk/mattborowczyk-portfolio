import { NextRequest, NextResponse } from "next/server";
import { NewsletterError, subscribeToNewsletter } from "@/lib/mailerlite";

export async function POST(req: NextRequest) {
  try {
    const { email, companyUrl } = (await req.json()) ?? {};

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
