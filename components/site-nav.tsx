"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import Eyebrow from "@/components/ui/eyebrow";
import { pageNav } from "@/lib/site";
import type { SiteSettings } from "@/sanity/lib/fetch-data";
import { cn } from "@/lib/utils";

/** Href for a catalogue category filter. "Shop all" clears the param. */
function categoryHref(cat: string) {
  return cat === "Shop all" ? "/" : `/?filter=${encodeURIComponent(cat)}`;
}

function useActiveFilter() {
  const pathname = usePathname();
  const params = useSearchParams();
  if (pathname !== "/") return null;
  return params.get("filter") ?? "Shop all";
}

type NavEntry = { href: string; label: string; active: boolean };

function NavItem({
  href,
  label,
  active,
  className,
}: NavEntry & { className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "font-sans text-base font-bold text-ink transition-opacity duration-fast hover:opacity-100",
        active ? "opacity-100" : "opacity-40",
        className,
      )}
    >
      {label}
    </Link>
  );
}

/** A labelled block of rail links (CATALOGUE / STUDIO). */
function NavGroup({ label, items }: { label: string; items: NavEntry[] }) {
  return (
    <div className="flex flex-col gap-sm">
      <Eyebrow size="2xs" className="text-label-lighter">
        {label}
      </Eyebrow>
      <nav className="flex flex-col gap-xs">
        {items.map((item) => (
          <NavItem key={item.href + item.label} {...item} />
        ))}
      </nav>
    </div>
  );
}

/** Desktop left rail (>= nav breakpoint) + mobile top bar below it. */
export default function SiteNav({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const activeFilter = useActiveFilter();

  const catItems = settings.categories.map((cat) => ({
    label: cat,
    href: categoryHref(cat),
    active: activeFilter === cat,
  }));
  const pageItems = pageNav.map((p) => ({
    label: p.label,
    href: p.href,
    active: pathname.startsWith(p.href),
  }));

  return (
    <>
      {/* ── Desktop rail ─────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-rail flex-col gap-lg bg-bone px-6 py-7 nav:flex">
        <Link
          href="/"
          className="font-serif text-display-xs font-medium text-gold transition-opacity hover:opacity-65"
        >
          {settings.name}
        </Link>

        <NavGroup label="Catalogue" items={catItems} />
        <NavGroup label="Studio" items={pageItems} />

        <div className="mt-auto font-mono text-2xs uppercase leading-relaxed tracking-wide-lg text-label-lighter">
          <div>{settings.footer}</div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-40 flex flex-col gap-2xs border-b border-hairline bg-bone-veil px-5 py-3 backdrop-blur-sm nav:hidden">
        <Link href="/" className="font-sans text-lg font-bold text-gold">
          {settings.name}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {catItems.map((item) => (
            <NavItem key={item.label} {...item} className="text-md" />
          ))}
          <span className="text-label-lighter">·</span>
          {pageItems.map((item) => (
            <NavItem key={item.href} {...item} className="text-md" />
          ))}
        </div>
      </header>
    </>
  );
}
