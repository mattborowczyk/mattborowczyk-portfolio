import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Turns draft mode back off and returns to the published, ISR-cached site.
 * Reached from the "Exit" link in the draft banner, so it takes a `redirect`
 * telling it which page the editor was looking at.
 */
export const dynamic = "force-dynamic";

/**
 * Only same-site paths are honoured. `redirect` comes from a query string, so
 * it is attacker-controllable: anything that isn't a plain absolute path goes
 * to the home page instead. `//evil.com` is the case worth naming — the browser
 * reads a protocol-relative URL as another origin, so the leading-slash test on
 * its own is not enough.
 */
function safePath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: Request) {
  (await draftMode()).disable();
  const { searchParams } = new URL(request.url);
  redirect(safePath(searchParams.get("redirect")));
}
