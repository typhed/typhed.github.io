"use client";

import * as React from "react";

/**
 * The copyright year. The static export bakes the build year into the HTML;
 * this updates to the visitor's current year after mount so the footer never
 * goes stale in January. `suppressHydrationWarning` covers the one moment
 * the two can legitimately differ.
 */
export function CopyrightYear() {
  const [year, setYear] = React.useState(() => new Date().getFullYear());

  React.useEffect(() => setYear(new Date().getFullYear()), []);

  return <span suppressHydrationWarning>{year}</span>;
}
