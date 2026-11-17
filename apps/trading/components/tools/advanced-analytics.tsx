"use client"

import * as React from "react"
import { Loader2, Play } from "lucide-react"
import type { Candle } from "@typhed/chart-engine"
import { simpleReturns } from "@typhed/risk-toolkit"

import { runAdvancedStats, type AdvancedStats } from "@/lib/pyodide"
import { fmtNumber, fmtPercent } from "@/lib/format"
import { StatTile, ToolCard } from "@/components/tools/controls"
import { Button } from "@typhed/ui/components/ui/button"

/**
 * Advanced higher-moment analytics run in the browser with numpy via Pyodide.
 * This is the Python lane: where the numpy ecosystem earns its weight over a
 * hand-rolled TS implementation.
 */
export function AdvancedAnalytics({ candles }: { candles: readonly Candle[] }) {
  const [running, setRunning] = React.useState(false)
  const [status, setStatus] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<AdvancedStats | null>(null)

  async function run() {
    setRunning(true)
    setError(null)
    try {
      const returns = simpleReturns(candles.map((c) => c.close))
      if (returns.length < 3) throw new Error("Not enough bars to analyse.")
      const stats = await runAdvancedStats(returns, 0.95, setStatus)
      // analytics.py signals a degenerate series (e.g. constant prices) with an
      // `error` sentinel instead of the statistics - surface it, don't render
      // blank tiles with a bogus "Normality rejected" verdict.
      if (stats.error) {
        throw new Error("The return series has no variation to analyse.")
      }
      setResult(stats)
    } catch (e) {
      setError(e instanceof Error ? e.message : "The Python analysis failed.")
    } finally {
      setRunning(false)
      setStatus(null)
    }
  }

  const normal = result ? result.jb_pvalue >= 0.05 : false

  return (
    <ToolCard
      title="Advanced analytics (Python)"
      description="Higher-moment risk computed with numpy in your browser via Pyodide. The first run downloads the Python runtime (~10 MB) and caches it."
    >
      <Button variant="brand" onClick={run} disabled={running}>
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {running ? (status ?? "Working") : "Run in Python"}
      </Button>

      {error && <p className="text-destructive mt-3 text-sm">{error}</p>}

      {result && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatTile label="Skewness" value={fmtNumber(result.skewness, 3)} />
          <StatTile label="Excess kurtosis" value={fmtNumber(result.excess_kurtosis, 3)} />
          <StatTile
            label="Jarque-Bera"
            value={fmtNumber(result.jarque_bera, 1)}
            note={`p ${fmtNumber(result.jb_pvalue, 4)}`}
          />
          <StatTile
            label="Normality"
            value={normal ? "not rejected" : "rejected"}
            tone={normal ? "positive" : "negative"}
            note="at 5%"
          />
          <StatTile
            label="Historical VaR 95%"
            value={fmtPercent(result.historical_var)}
            tone="negative"
          />
          <StatTile
            label="Gaussian VaR 95%"
            value={fmtPercent(result.gaussian_var)}
            tone="negative"
          />
          <StatTile
            label="Cornish-Fisher VaR 95%"
            value={fmtPercent(result.cornish_fisher_var)}
            tone="negative"
            note="skew / tail adjusted"
          />
        </div>
      )}

      <p className="text-muted-foreground mt-4 text-xs">
        Only the Python runtime is downloaded, from a CDN. Your data is computed locally in
        WebAssembly and never leaves the browser.
      </p>
    </ToolCard>
  )
}
