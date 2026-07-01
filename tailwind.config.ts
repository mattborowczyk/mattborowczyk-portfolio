import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        // Single design breakpoint from the handoff (860px).
        nav: "860px",
      },
      fontFamily: {
        // Cormorant Garamond — display, headlines, numerals.
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        // IBM Plex Mono — spec data, labels, eyebrows, meta.
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        // Helvetica Neue Bold — UI, nav, CTAs, product names (system stack).
        sans: ["'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        // ── Brand palette (locked design tokens) ──────────────────
        bone: "#f2eee4", // page background
        card: "#ede9df", // card / raised surface
        band: "#eae6db", // muted band / spec block
        ink: "#1c1916", // near-black — text, buttons
        gold: "#b08d4f", // champagne gold accent
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
      keyframes: {
        // Prototype keyframes: mbfade (opacity) + mbnl (slide-in).
        mbfade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        mbnl: {
          from: { opacity: "0", transform: "translateX(10px)" },
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
