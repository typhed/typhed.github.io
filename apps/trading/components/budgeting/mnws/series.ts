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
  /** Tinted KPI-card surface: a light shade of the bucket colour + border. */
  cardClass: string;
  /** The prominent amount chip: deeper-tone text and fill, blackish border. */
  chipClass: string;
}

// Hues validated with the dataviz palette checker (light + dark surfaces):
// amber-600 / violet-500 / emerald-600 all pass lightness, chroma, CVD
// separation and contrast in both modes.
export const SERIES: Record<SeriesKey, SeriesMeta> = {
  needs: {
    key: "needs",
    label: "Needs",
    color: "#d97706",
    textClass: "text-amber-600 dark:text-amber-500",
    cardClass: "border-amber-600/40 bg-amber-500/10",
    chipClass:
      "border-black/40 bg-amber-600/20 text-amber-700 dark:border-black/60 dark:text-amber-400",
  },
  wants: {
    key: "wants",
    label: "Wants",
    color: "#8b5cf6",
    textClass: "text-violet-500",
    cardClass: "border-violet-500/40 bg-violet-500/10",
    chipClass:
      "border-black/40 bg-violet-600/20 text-violet-700 dark:border-black/60 dark:text-violet-400",
  },
  savings: {
    key: "savings",
    label: "Savings",
    color: "#059669",
    textClass: "text-emerald-600 dark:text-emerald-500",
    cardClass: "border-emerald-600/40 bg-emerald-500/10",
    chipClass:
      "border-black/40 bg-emerald-600/20 text-emerald-700 dark:border-black/60 dark:text-emerald-400",
  },
};

/** Fixed render order: needs, wants, savings (left→right, bottom→top in stacks). */
export const SERIES_ORDER: readonly SeriesKey[] = ["needs", "wants", "savings"];

/** Colour for the two corpus lines: nominal cash saved vs invested corpus. */
export const CORPUS_COLORS = {
  cash: SERIES.savings.color,
  invested: "hsl(var(--brand))",
} as const;
