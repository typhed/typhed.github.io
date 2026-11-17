"use client"

import * as React from "react"
import type { Candle } from "@typhed/chart-engine"
import {
  annualizedVolatility,
  historicalCVar,
  historicalVar,
  maxDrawdown,
  mean,
  parametricVar,
  simpleReturns,
  stdev,
} from "@typhed/risk-toolkit"

import { fmtNumber, fmtPercent } from "@/lib/format"
import { StatTile, ToolCard } from "@/components/tools/controls"

/**
 * Single-instrument risk summary of the currently displayed series. Portfolio
 * correlation / risk-parity across several instruments arrive with multi-asset
 * upload; the maths already lives in @typhed/risk-toolkit.
 */
export function RiskDashboard({
  candles,
  periodsPerYear,
  timeframeLabel,
}: {
  candles: readonly Candle[]
  periodsPerYear: number
  timeframeLabel: string
}) {
  const stats = React.useMemo(() => {
    const closes = candles.map((c) => c.close)
    const returns = simpleReturns(closes)
    if (returns.length < 2) return null
    return {
      periodMean: mean(returns),
      periodVol: stdev(returns, 1),
      annualVol: annualizedVolatility(returns, periodsPerYear),
      var95: historicalVar(returns, 0.95),
      cvar95: historicalCVar(returns, 0.95),
      var99: historicalVar(returns, 0.99),
      paramVar95: parametricVar(returns, 0.95),
      maxDd: maxDrawdown(closes).maxDrawdown,
      samples: returns.length,
    }
  }, [candles, periodsPerYear])

  if (!stats) {
    return (
      <ToolCard title="Risk summary">
        <p className="text-muted-foreground text-sm">
          Not enough bars on this timeframe to compute risk statistics.
        </p>
      </ToolCard>
    )
  }

  return (
    <ToolCard
      title="Risk summary"
      description={`Computed on ${fmtNumber(stats.samples, 0)} ${timeframeLabel} returns. Annualised figures assume ${fmtNumber(Math.round(periodsPerYear), 0)} periods per year.`}
    >
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Volatility (per bar)" value={fmtPercent(stats.periodVol)} />
        <StatTile
          label="Volatility (annualised)"
          value={fmtPercent(stats.annualVol)}
          tone="brand"
        />
        <StatTile label="Max drawdown" value={fmtPercent(stats.maxDd)} tone="negative" />
        <StatTile label="Avg return (per bar)" value={fmtPercent(stats.periodMean, 3)} />
        <StatTile
          label="Historical VaR 95%"
          value={fmtPercent(stats.var95)}
          tone="negative"
          note="1-bar loss"
        />
        <StatTile
          label="Expected shortfall 95%"
          value={fmtPercent(stats.cvar95)}
          tone="negative"
          note="mean tail loss"
        />
        <StatTile label="Historical VaR 99%" value={fmtPercent(stats.var99)} tone="negative" />
        <StatTile
          label="Parametric VaR 95%"
          value={fmtPercent(stats.paramVar95)}
          tone="negative"
          note="Gaussian"
        />
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        VaR is the loss not expected to be exceeded at the stated confidence over one bar. These are
        estimates from your data - not a guarantee.
      </p>
    </ToolCard>
  )
}
