import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * ESLint 9 flat config.
 *
 * `eslint-config-next` is still eslintrc-format only, so it comes in through
 * FlatCompat. It already bundles the react, react-hooks, jsx-a11y and import
 * plugins, which is why no separate style config (airbnb or otherwise) is
 * pulled in — those are archived for ESLint 9 and would mostly duplicate this.
 *
 * Rules are the non-type-checked set: fast enough to run on every commit and
 * in CI without a full TypeScript program. `tsc --noEmit` runs alongside it in
 * CI and is what actually guards types.
 */
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  {
    ignores: [
      ".next/**",
      "dist/**",
      "node_modules/**",
      "next-env.d.ts",
      "*.tsbuildinfo",
    ],
  },

  ...compat.extends("next/core-web-vitals"),
  ...tseslint.configs.recommended,

  {
    rules: {
      // Unused args are common in typed callbacks and Netlify/Next handler
      // signatures; allow the conventional underscore opt-out.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
    },
  },
];

export default config;
