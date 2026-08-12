import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

/**
 * Tailwind is the *interface* to the design system; the values themselves
 * live in `app/globals.css` as custom properties. Scales are named on an
 * xs → 2xl axis so a utility's size is legible from its class name, and so
 * a single edit in globals.css re-skins every component that uses it.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        // rem-based so breakpoints respect the browser's base font size.
        xs: "30rem", // 480px
        nav: "53.75rem", // 860px — the single design breakpoint (rail ⇄ top bar)
      },
      fontFamily: {
        // Cormorant Garamond — display, headlines, numerals.
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        // IBM Plex Mono — spec data, labels, eyebrows, meta.
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        // Helvetica Neue Bold — UI, nav, CTAs, product names (system stack).
        sans: ["'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
      },
      fontSize: {
        // Sizes only — line-height stays under `leading-*` control so the
        // two can be tuned independently.
        "3xs": "var(--fs-3xs)",
        "2xs": "var(--fs-2xs)",
        xs: "var(--fs-xs)",
        sm: "var(--fs-sm)",
        md: "var(--fs-md)",
        base: "var(--fs-base)",
        lg: "var(--fs-lg)",
        xl: "var(--fs-xl)",
        "2xl": "var(--fs-2xl)",
        // Fixed serif display sizes.
        "display-xs": "var(--fs-display-xs)",
        "display-sm": "var(--fs-display-sm)",
        "display-md": "var(--fs-display-md)",
        "display-lg": "var(--fs-display-lg)",
        "display-xl": "var(--fs-display-xl)",
        "display-2xl": "var(--fs-display-2xl)",
        // Fluid headings.
        "heading-xs": "var(--fs-heading-xs)",
        "heading-sm": "var(--fs-heading-sm)",
        "heading-md": "var(--fs-heading-md)",
        "heading-lg": "var(--fs-heading-lg)",
        "heading-xl": "var(--fs-heading-xl)",
        "heading-2xl": "var(--fs-heading-2xl)",
      },
      lineHeight: {
        flush: "0.95", // display headlines that must sit tight
        display: "1.05",
        snug: "1.25",
        normal: "1.5",
        relaxed: "1.65",
        loose: "1.8",
      },
      letterSpacing: {
        tight: "-0.01em",
        "wide-xs": "0.04em",
        "wide-sm": "0.06em",
        "wide-md": "0.12em",
        "wide-lg": "0.16em",
        "wide-xl": "0.22em",
      },
      // Named steps layered *on top of* Tailwind's numeric scale (which is
      // already rem-based). Reach for a named token when the value is a
      // design decision — card padding, section rhythm, stack gaps — and for
      // a numeric utility (p-3, gap-5) when fine-tuning a single element.
      spacing: {
        "3xs": "var(--space-3xs)",
        "2xs": "var(--space-2xs)",
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        "2xl": "var(--space-2xl)",
        "3xl": "var(--space-3xl)",
        // Fluid layout rhythm.
        gutter: "var(--gutter)",
        "gutter-tight": "var(--gutter-tight)",
        section: "var(--section)",
        "section-lg": "var(--section-lg)",
        "section-xl": "var(--section-xl)",
        "stack-sm": "var(--stack-sm)",
        stack: "var(--stack)",
        run: "var(--run)",
        // Chrome.
        rail: "var(--rail-width)",
        "rail-right": "var(--rail-right-width)",
        topbar: "var(--topbar-height)",
        // Draft banner: `draft-banner` is its height, `draft` the amount the
        // rest of the chrome has to move out of its way — zero unless draft
        // mode is on. See the Draft banner block in globals.css.
        "draft-banner": "var(--draft-banner-height)",
        draft: "var(--draft-offset)",
        // Mobile content clears the top bar *and* the banner in one value,
        // so the two offsets never have to be composed at the call site.
        "topbar-draft": "calc(var(--topbar-height) + var(--draft-offset))",
      },
      minHeight: {
        // For a full-viewport box nested *inside* an element already padded by
        // `pt-draft`: plain `min-h-screen` there stacks a second 100vh under
        // the offset and scrolls the page by exactly the banner's height.
        // Identical to `min-h-screen` when draft mode is off.
        "screen-draft": "calc(100vh - var(--draft-offset))",
      },
      maxWidth: {
        "shell-xs": "var(--shell-xs)",
        "shell-sm": "var(--shell-sm)",
        "shell-md": "var(--shell-md)",
        "shell-lg": "var(--shell-lg)",
        "shell-xl": "var(--shell-xl)",
      },
      width: {
        rail: "var(--rail-width)",
        "rail-right": "var(--rail-right-width)",
      },
      colors: {
        // ── Brand palette (locked design tokens) ──────────────────
        bone: {
          // Colours resolve through custom properties, so Tailwind's `/opacity`
          // modifier is unavailable — translucent variants get their own token.
          DEFAULT: "var(--bone)", // page background
          veil: "var(--bone-veil)", // translucent, for the blurred top bar
        },
        card: {
          DEFAULT: "var(--card)", // card / raised surface
          veil: "var(--card-veil)", // translucent, for cards over a render
        },
        band: "var(--band)", // muted band / spec block
        ink: {
          DEFAULT: "var(--ink)", // near-black — text, buttons
          faint: "var(--ink-faint)", // marks drawn on a placeholder tone
          fainter: "var(--ink-fainter)",
          ghost: "var(--ink-ghost)",
        },
        gold: {
          DEFAULT: "var(--gold)", // accent — fills, marks on ink, decoration
          ink: "var(--gold-ink)", // gold as *text*, and the focus ring
          soft: "var(--gold-soft)", // gold on ≥24px numerals only
        },
        // Hairline rules — usable as border-*, bg-* or text-*.
        hairline: {
          DEFAULT: "var(--hairline)",
          md: "var(--hairline-md)",
          strong: "var(--hairline-strong)",
          ui: "var(--hairline-ui)", // the edge of an operable control
        },
        body: {
          DEFAULT: "#3a372f", // body text
          soft: "#4a463d", // secondary
          muted: "#6a655b", // muted
        },
        // The mono label scale. Every step is darker than it was: the old
        // ladder ran #8a857b → #b3aea3, which is 3.17:1 down to 1.91:1 on
        // bone, and every one of those is set between 9px and 13px, so all
        // four owed 4.5:1 and none of them paid it.
        //
        // Re-cut against `band` (#eae6db), the darkest surface any of them
        // lands on, so a label reads the same in a spec block as on the page.
        // The four steps are much closer together than they were, and that is
        // the honest consequence rather than a choice: the room between the
        // AA floor and `body-muted` is about one and a half stops wide. If the
        // scale wants to be a scale again it has to come from somewhere other
        // than lightness — size, tracking or weight.
        label: {
          DEFAULT: "#5a5750", // 6.22:1 on bone
          light: "#605d55", // 5.67:1
          lighter: "#66625a", // 5.24:1
          lightest: "#6b675f", // 4.86:1 (4.51:1 on band)
        },
        danger: "#9a3b2f", // inline form errors
        // Sage placeholder tones (stand-ins until real renders land).
        sage: {
          "01": "#cdd3c7",
          "02": "#c4cdc2",
          "03": "#bcc5bb",
          "04": "#d4d5ca",
          "05": "#c8cfc1",
          "06": "#c0c7bd",
          "07": "#cccfc3",
          "08": "#c6cdbf",
        },
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
        page: "var(--duration-page)",
      },
      keyframes: {
        // Prototype keyframes: mbfade (opacity) + mbnl (slide-in).
        mbfade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        // The page exit. A keyframe rather than a transition on purpose — see
        // `animation` below and components/page-transition.tsx.
        mbfadeout: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        mbnl: {
          from: { opacity: "0", transform: "translateX(0.625rem)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        mbfade: "mbfade .4s ease both",
        // The page-level entry fade. Same keyframe, but at the duration the
        // navigation exit uses, so a route change fades out and back in over
        // the same interval. See components/page-transition.tsx.
        mbpage: "mbfade var(--duration-page) ease both",
        // The matching exit. Both directions are animations, at one duration,
        // so a route change never has a keyframe and a transition competing
        // for `opacity` — which is a fight the transition loses silently.
        mbpageout: "mbfadeout var(--duration-page) ease both",
        // A tab panel arriving. Same keyframe as `mbfade`, but pinned to the
        // duration the outgoing panel fades at, so the two halves of a tab
        // change are one movement rather than two of different lengths.
        mbtab: "mbfade var(--duration-base) ease both",
        mbnl: "mbnl .35s ease both",
      },
    },
  },
  plugins: [typography, animate],
};

export default config;
