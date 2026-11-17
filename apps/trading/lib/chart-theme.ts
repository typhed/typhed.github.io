/** Colour set for the lightweight-charts canvas, resolved per theme. */
export interface ChartColors {
  background: string
  textColor: string
  grid: string
  border: string
  up: string
  down: string
  upFill: string
  downFill: string
}

/**
 * Chart colours for the current theme. Candles use the conventional green/red
 * so direction reads the standard way; volume bars reuse the same hues at
 * lower opacity. The canvas background is transparent so the card behind it
 * shows through in both themes.
 */
export function chartColors(isDark: boolean): ChartColors {
  if (isDark) {
    return {
      background: "transparent",
      textColor: "#94a3b8",
      grid: "rgba(148, 163, 184, 0.10)",
      border: "rgba(148, 163, 184, 0.20)",
      up: "#26a69a",
      down: "#ef5350",
      upFill: "rgba(38, 166, 154, 0.45)",
      downFill: "rgba(239, 83, 80, 0.45)",
    }
  }
  return {
    background: "transparent",
    textColor: "#475569",
    grid: "rgba(100, 116, 139, 0.12)",
    border: "rgba(100, 116, 139, 0.25)",
    up: "#0f9d8f",
    down: "#e0524f",
    upFill: "rgba(15, 157, 143, 0.4)",
    downFill: "rgba(224, 82, 79, 0.4)",
  }
}
