import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Turns draft mode back off and returns to the published, ISR-cached site.
 * Reached from the "Exit" link in the draft banner, so it takes a `redirect`
 * telling it which page the editor was looking at.
 */
export const dynamic = "force-dynamic";

/**
 * A private origin to resolve candidate redirects against. `.invalid` is
 * reserved by RFC 2606 and can never be registered, so nothing can arrange to
 * match it.
 */
const TRUSTED_ORIGIN = "http://redirect.invalid";

/**
 * Only same-site paths are honoured. `redirect` comes from a query string, so
 * it is attacker-controllable: anything that resolves off this origin goes to
 * the home page instead.
 *
 * This resolves rather than pattern-matches, because a prefix test only rejects
 * the spellings it thought of. `//evil.com` is the obvious protocol-relative
 * case, but `/\evil.com` is the same URL — browsers normalise a backslash into
 * the authority position, so `new URL("/\\evil.com", origin)` and
 * `new URL("//evil.com", origin)` both come out as `http://evil.com/`. Handing
 * the string to the URL parser applies exactly the normalisation the browser
 * will apply when it reads the `Location` header, which is the only definition
 * of "same site" that actually matters here.
 *
 * Only the parsed pathname/search/hash go back out, never the raw input, so
 * what is redirected to is what was validated.
 */
function safePath(value: string | null): string {
  if (!value) return "/";
  try {
    const url = new URL(value, TRUSTED_ORIGIN);
    if (url.origin !== TRUSTED_ORIGIN) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    // A candidate the parser rejects outright is not one to redirect to.
    return "/";
  }
}

export async function GET(request: Request) {
  (await draftMode()).disable();
  const { searchParams } = new URL(request.url);
  redirect(safePath(searchParams.get("redirect")));
}
