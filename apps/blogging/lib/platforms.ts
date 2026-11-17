/** Display names of the trading platforms a post's `links` frontmatter can name, by slug. */
const PLATFORM_LABELS: Record<string, string> = {
  tradingview: "TradingView",
  ninjatrader: "NinjaTrader",
  metatrader: "MetaTrader 4/5",
  thinkorswim: "Thinkorswim",
}

/** A platform's display name; an unknown slug is title-cased ("my-broker" → "My Broker"). */
export function platformLabel(slug: string): string {
  return (
    PLATFORM_LABELS[slug] ??
    slug
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  )
}
