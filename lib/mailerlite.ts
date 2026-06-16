/**
 * Thin wrapper around the MailerLite API v2.
 * Docs: https://developers.mailerlite.com/docs/subscribers
 */

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY!;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;
const BASE_URL = "https://connect.mailerlite.com/api";

export async function subscribeToNewsletter(email: string): Promise<void> {
  const endpoint = MAILERLITE_GROUP_ID
    ? `${BASE_URL}/subscribers` // group assignment handled below
    : `${BASE_URL}/subscribers`;

  const body: Record<string, unknown> = { email };

  if (MAILERLITE_GROUP_ID) {
    body.groups = [MAILERLITE_GROUP_ID];
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MAILERLITE_API_KEY}`,
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error?.message ?? `MailerLite error: ${res.status} ${res.statusText}`
    );
  }
}
