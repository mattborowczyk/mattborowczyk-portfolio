import type { Metadata } from "next";
import Image from "next/image";
import { sanityFetch } from "@/sanity/lib/client";
import { aboutPageQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import type { Page } from "@/sanity/lib/queries";

export const metadata: Metadata = { title: "About" };
export const revalidate = 60;

export default async function AboutPage() {
  const page = await sanityFetch<Page>({ query: aboutPageQuery });

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 sm:px-12">
      {page?.coverImage && (
        <div className="relative mb-10 aspect-[3/2] overflow-hidden bg-stone-100">
          <Image
            src={urlFor(page.coverImage).width(1200).url()}
            alt={page.title ?? "About"}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <h1 className="text-3xl font-light tracking-wide">
        {page?.title ?? "About"}
      </h1>

      {page?.body && (
        <div
          className="prose-jewelry mt-6"
          /* PortableText rendering goes here — add @portabletext/react when needed */
        >
          <p className="text-stone-500 italic">
            (Portable text body — wire up @portabletext/react here)
          </p>
        </div>
      )}
    </article>
  );
}
