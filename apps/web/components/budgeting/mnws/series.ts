/**
 * The three MNWS buckets as a shared, single-source palette + label set, used
 * by the rule explainer, the KPI panel, the split bars and the charts so every
 * surface colours needs / wants / savings identically. Savings is the hero, so
 * it also gets emphasised as the brand-adjacent green elsewhere; needs/wants use
 * fixed, theme-stable hues distinct from the cyan/indigo brand accent.
 */

export type SeriesKey = "needs" | "wants" | "savings";

export interface SeriesMeta {
  key: SeriesKey;
  label: string;
  /** CSS colour for SVG fills / strokes (theme-stable, works in light + dark). */
  color: string;
  /** Tailwind text-colour class for inline figures. */
  textClass: string;
}

// Hues validated with the dataviz palette checker (light + dark surfaces):
// amber-600 / violet-500 / emerald-600 all pass lightness, chroma, CVD
// separation and contrast in both modes.
export const SERIES: Record<SeriesKey, SeriesMeta> = {
  needs: { key: "needs", label: "Needs", color: "#d97706", textClass: "text-amber-600 dark:text-amber-500" },
  wants: { key: "wants", label: "Wants", color: "#8b5cf6", textClass: "text-violet-500" },
  savings: { key: "savings", label: "Savings", color: "#059669", textClass: "text-emerald-600 dark:text-emerald-500" },
};

/** Fixed render order: needs, wants, savings (left→right, bottom→top in stacks). */
export const SERIES_ORDER: readonly SeriesKey[] = ["needs", "wants", "savings"];

/** Colour for the two corpus lines: nominal cash saved vs invested corpus. */
export const CORPUS_COLORS = {
  cash: SERIES.savings.color,
  invested: "hsl(var(--brand))",
} as const;
