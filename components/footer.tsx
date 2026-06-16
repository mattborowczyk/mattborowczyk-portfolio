import Link from "next/link";
import { sanityFetch } from "@/sanity/lib/client";
import { settingsQuery } from "@/sanity/lib/queries";
import type { Settings } from "@/sanity/lib/queries";

export default async function Footer() {
  const settings = await sanityFetch<Settings>({
    query: settingsQuery,
    revalidate: 3600,
  });

  return (
    <footer className="border-t border-stone-200 px-6 py-8 sm:px-12">
      <div className="flex flex-col items-center justify-between gap-4 text-xs text-stone-400 sm:flex-row">
        <p>
          {settings?.footerText ?? "Handcrafted jewellery"} —{" "}
          {new Date().getFullYear()}
        </p>

        {settings?.social && (
          <ul className="flex gap-4">
            {settings.social.instagram && (
              <li>
                <a
                  href={settings.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="uppercase tracking-widest hover:text-stone-900 transition"
                >
                  Instagram
                </a>
              </li>
            )}
            {settings.social.tiktok && (
              <li>
                <a
                  href={settings.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="uppercase tracking-widest hover:text-stone-900 transition"
                >
                  TikTok
                </a>
              </li>
            )}
            {settings.social.youtube && (
              <li>
                <a
                  href={settings.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="uppercase tracking-widest hover:text-stone-900 transition"
                >
                  YouTube
                </a>
              </li>
            )}
          </ul>
        )}
      </div>
    </footer>
  );
}
