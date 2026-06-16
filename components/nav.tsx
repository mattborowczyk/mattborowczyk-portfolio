"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-12">
      <Link
        href="/"
        className="text-sm tracking-widest uppercase font-medium"
      >
        Mateusz Borowczyk
      </Link>

      <nav>
        <ul className="flex gap-6">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-sm tracking-widest uppercase transition hover:text-stone-900 ${
                  pathname.startsWith(href)
                    ? "text-stone-900"
                    : "text-stone-400"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
