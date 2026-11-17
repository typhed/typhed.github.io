"use client";

/**
 * Root error boundary. It replaces the entire root layout when the layout
 * itself crashes, so it must render its own html/body and cannot rely on the
 * app's stylesheet - styles are inline by necessity.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#080c1c",
          color: "#e2e8f0",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: "28rem", fontSize: "0.875rem", color: "#94a3b8" }}>
          The app hit an unexpected error. Your data lives in this browser and is
          not lost.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#22d3ee",
            color: "#080c1c",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
