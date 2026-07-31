"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for failures in the root layout itself. It replaces the
 * whole document, so it must render its own <html>/<body> and cannot use the
 * design tokens from globals.css (the layout that loads them is what failed) —
 * hence the inline styles, which are deliberate rather than an oversight.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Same rule as app/error.tsx: full detail in development, only the
    // correlating digest in production.
    if (process.env.NODE_ENV === "production") {
      if (error.digest) console.error(`[global] digest: ${error.digest}`);
    } else {
      console.error("[global]", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background: "#f2eee4",
          color: "#1c1916",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ margin: "0 auto", maxWidth: "34rem", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 500, margin: "0 0 1rem" }}>
            Something went wrong.
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.7, opacity: 0.75 }}>
            The site failed to load. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              background: "#1c1916",
              color: "#f2eee4",
              font: "inherit",
              fontSize: "0.8125rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
