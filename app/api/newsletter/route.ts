import { NextRequest, NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/mailerlite";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

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
      { message: "Thanks! You're on the list." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[newsletter]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
