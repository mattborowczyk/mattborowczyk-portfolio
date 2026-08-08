/**
 * Thin wrapper around the MailerLite API.
 * Docs: https://developers.mailerlite.com/docs/subscribers.html
 *
 * POST /subscribers upserts: 201 for a new subscriber, 200 if one already
 * existed (non-destructive — omitted fields/groups are left alone).
 */

const BASE_URL = "https://connect.mailerlite.com/api";

/** Thrown when the subscribe call fails, carrying a message safe to show the user. */
export class NewsletterError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly userMessage: string
  ) {
    super(message);
    this.name = "NewsletterError";
  }
}

export async function subscribeToNewsletter(email: string): Promise<void> {
  // Read at call time so the value tracks the runtime environment, not build time.
  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  if (!apiKey) {
    throw new NewsletterError(
      "MAILERLITE_API_KEY is not set — see .env.local.example",
      500,
      "The newsletter isn’t available right now."
    );
  }

  const body: Record<string, unknown> = { email };

  if (groupId) {
    body.groups = [groupId];
  }

  // Double opt-in: "unconfirmed" is what asks MailerLite to send the
  // confirmation email. Requires "Double opt-in for API and integrations" to be
  // ON in Account settings → Subscribe settings — see the note in README.
  body.status = "unconfirmed";

  // Bounded so a hung MailerLite connection can't hold the route handler open
  // for the platform's full function timeout.
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new NewsletterError(
      `MailerLite request failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      504,
      "Something went wrong. Please try again."
    );
  }

  if (res.ok) return;

  const payload = await res.json().catch(() => ({}));

  // 422 is a validation failure — the field message is worth showing.
  if (res.status === 422) {
    const fieldError = Object.values(
      (payload?.errors ?? {}) as Record<string, string[]>
    )
      .flat()
      .find(Boolean);
    throw new NewsletterError(
      `MailerLite validation error: ${JSON.stringify(payload?.errors ?? {})}`,
      400,
      fieldError ?? "Please check your details and try again."
    );
  }

  // 401/403 means the key is missing scopes or wrong; 404 usually a bad group id.
  throw new NewsletterError(
    `MailerLite error ${res.status} ${res.statusText}: ${
      payload?.message ?? "(no message)"
    }`,
    502,
    "Something went wrong. Please try again."
  );
}
