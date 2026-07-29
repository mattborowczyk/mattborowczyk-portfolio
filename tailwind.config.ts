import type { Config } from "tailwindcss";

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
      },
      maxWidth: {
        "shell-xs": "var(--shell-xs)",
        "shell-sm": "var(--shell-sm)",
        "shell-md": "var(--shell-md)",
        "shell-lg": "var(--shell-lg)",
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
        card: "var(--card)", // card / raised surface
        band: "var(--band)", // muted band / spec block
        ink: {
          DEFAULT: "var(--ink)", // near-black — text, buttons
          faint: "var(--ink-faint)", // marks drawn on a placeholder tone
          fainter: "var(--ink-fainter)",
          ghost: "var(--ink-ghost)",
        },
        gold: "var(--gold)", // champagne gold accent
        // Hairline rules — usable as border-*, bg-* or text-*.
        hairline: {
          DEFAULT: "var(--hairline)",
          md: "var(--hairline-md)",
          strong: "var(--hairline-strong)",
        },
        body: {
          DEFAULT: "#3a372f", // body text
          soft: "#4a463d", // secondary
          muted: "#6a655b", // muted
        },
        label: {
          DEFAULT: "#8a857b",
          light: "#9a948a",
          lighter: "#a39d91",
          lightest: "#b3aea3",
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
      },
      keyframes: {
        // Prototype keyframes: mbfade (opacity) + mbnl (slide-in).
        mbfade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        mbnl: {
          from: { opacity: "0", transform: "translateX(0.625rem)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        mbfade: "mbfade .4s ease both",
        mbnl: "mbnl .35s ease both",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
};

export default config;
