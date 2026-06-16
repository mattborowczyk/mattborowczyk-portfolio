import type { Metadata } from "next";

export const metadata: Metadata = { title: "Courses" };

/**
 * Course & digital products page.
 *
 * The actual buy button / checkout is an Easytools overlay widget.
 * To wire it up:
 *  1. Create your product at https://easy.tools
 *  2. Copy the "Buy button" embed script they provide
 *  3. Paste it below (replace the placeholder <script> comment)
 *
 * Easytools injects a floating checkout overlay on top of this page —
 * you keep full control of the layout and copy here.
 */
export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-12">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-light tracking-widest uppercase">
          Courses & Digital Products
        </h1>
        <p className="mt-3 text-stone-500">
          Learn the craft — from stone-setting to CAD modelling.
        </p>
      </header>

      {/* ── Course card ─────────────────────────────────────────── */}
      <div className="border border-stone-200 p-8">
        <span className="text-xs tracking-widest uppercase text-stone-400">
          Coming soon
        </span>
        <h2 className="mt-2 text-2xl font-light">Stone Setting Fundamentals</h2>
        <p className="mt-3 text-stone-500 leading-relaxed">
          A hands-on course covering bezel, prong, and pavé settings — from
          bench skills to CAD modelling for casting.
        </p>

        <div className="mt-6 flex items-baseline gap-3">
          <span className="text-2xl">€249</span>
          <span className="text-sm text-stone-400">one-time</span>
        </div>

        {/*
          Easytools buy button — replace this comment with the embed script
          you get from the Easytools dashboard:

          <script
            src="https://app.easy.tools/..."
            data-product-id="YOUR_PRODUCT_ID"
          />

          Or use their data-easycart attribute on a button:
          <button data-easycart="YOUR_PRODUCT_ID" className="...">
            Enrol now
          </button>
        */}
        <button
          className="mt-6 w-full border border-stone-900 py-3 text-sm tracking-widest uppercase transition hover:bg-stone-900 hover:text-white"
          disabled
        >
          Notify me when it launches
        </button>
      </div>
    </div>
  );
}
