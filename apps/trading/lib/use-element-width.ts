"use client";

/**
 * Track an element's rendered pixel width with a `ResizeObserver`.
 *
 * Used by the inline-SVG charts so they can render at their true pixel size
 * (1 user unit = 1 px). That keeps `preserveAspectRatio` from ever engaging, so
 * axis text stays crisp and circular markers stay round while the chart still
 * fills - and reflows with - its responsive container. Width is 0 until the
 * first measurement; callers should guard that frame.
 */

import * as React from "react";

export function useElementWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = React.useRef<T>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
