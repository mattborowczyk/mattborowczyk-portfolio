"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { categories, pageNav, site } from "@/lib/site";
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

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.2em] text-label-lighter">
      {children}
    </p>
  );
}

function NavItem({
  href,
  label,
  active,
  className,
}: {
  href: string;
  label: string;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-sans text-[13px] font-bold text-ink transition-opacity [transition-duration:250ms] hover:opacity-100",
        active ? "opacity-100" : "opacity-40",
        className,
      )}
    >
      {label}
    </Link>
  );
}

/** Desktop left rail (>= 860px) + mobile top bar (< 860px). */
export default function SiteNav() {
  const pathname = usePathname();
  const activeFilter = useActiveFilter();

  const catItems = categories.map((cat) => ({
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
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[206px] flex-col bg-bone px-[26px] py-[28px] nav:flex">
        <Link
          href="/"
          className="font-serif text-[19px] font-medium text-gold transition-opacity hover:opacity-65"
        >
          {site.name}
        </Link>

        <div className="mt-10">
          <GroupLabel>CATALOGUE</GroupLabel>
          <nav className="flex flex-col gap-[9px]">
            {catItems.map((item) => (
              <NavItem key={item.label} {...item} />
            ))}
          </nav>
        </div>

        <div className="mt-8">
          <GroupLabel>STUDIO</GroupLabel>
          <nav className="flex flex-col gap-[9px]">
            {pageItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>
        </div>

        <div className="mt-auto font-mono text-[9.5px] uppercase leading-[1.7] tracking-[0.14em] text-label-lighter">
          <div>{site.footer}</div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-40 flex flex-col gap-2 border-b border-[color:var(--hairline)] bg-[rgba(242,238,228,0.92)] px-5 py-3 backdrop-blur-[6px] nav:hidden">
        <Link href="/" className="font-sans text-[15px] font-bold text-gold">
          {site.name}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {catItems.map((item) => (
            <NavItem key={item.label} {...item} className="text-[12px]" />
          ))}
          <span className="text-label-lighter">·</span>
          {pageItems.map((item) => (
            <NavItem key={item.href} {...item} className="text-[12px]" />
          ))}
        </div>
      </header>
    </>
  );
}
