"use client"

import * as React from "react"

import { Button } from "@typhed/ui/components/ui/button"

/**
 * Route-level error boundary: a render/runtime crash inside a page shows a
 * recoverable message instead of white-screening the whole static export.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Client-side only; there is no server to report to. Keep the console
    // record so a user bug report can include the reason.
    console.error(error)
  }, [error])

  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        The page hit an unexpected error while rendering. Your data lives in this browser and is not
        lost - try again, and if it keeps failing, reset the affected tool&apos;s data.
      </p>
      <Button variant="brand" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
