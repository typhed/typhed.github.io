"use client"

import * as React from "react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { cn } from "@typhed/ui/lib/utils"
import { fmtCompact, fmtNumber, fmtPercent, signTone } from "@/lib/format"
import { niceScale, valueRange, type FinancialDerived } from "@/lib/ipo/analytics"
import { useElementWidth } from "@/lib/use-element-width"
import { ChartEmptyState, StatTile, ToolCard } from "@/components/tools/controls"

type MetricKey = "totalAssets" | "grossRevenue" | "pat"
type GrowthKey = "assetGrowth" | "revenueGrowth" | "patGrowth"

const METRICS: ReadonlyArray<{
  key: MetricKey
  growthKey: GrowthKey
  label: string
  short: string
}> = [
  { key: "totalAssets", growthKey: "assetGrowth", label: "Total Assets", short: "Assets" },
  { key: "grossRevenue", growthKey: "revenueGrowth", label: "Gross Revenue", short: "Revenue" },
  { key: "pat", growthKey: "patGrowth", label: "PAT", short: "PAT" },
]

const HEIGHT = 300
const PAD = { top: 16, right: 16, bottom: 40, left: 52 }

/** Ordinal single-hue ramp (validated): oldest -> newest, light-end >= 2:1 on surface. */
function rampOpacity(index: number, count: number): number {
  if (count <= 1) return 1
  return 0.6 + 0.4 * (index / (count - 1))
}

export function IpoFinancials({
  derived,
  unitLabel,
  className,
}: {
  derived: FinancialDerived[]
  unitLabel: string
  className?: string
}) {
  const unit = unitLabel ? `₹ ${unitLabel}` : "₹"
  const latest = derived.length > 0 ? derived[derived.length - 1]! : null

  return (
    <ToolCard
      title="Company Reported Financials"
      description={`Reported figures in ${unit}.`}
      className={className}
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {derived.map((row, i) => (
          <span
            key={row.id}
            className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundColor: "hsl(var(--brand))",
                opacity: rampOpacity(i, derived.length),
              }}
              aria-hidden
            />
            {row.period}
          </span>
        ))}
      </div>

      <FinancialsChart derived={derived} />

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-xs">
          <caption className="sr-only">
            Reported financials in {unit} with year-over-year change
          </caption>
          <thead>
            <tr className="border-border text-muted-foreground border-b">
              <th scope="col" className="py-2 pr-2 text-left font-medium">
                Metric ({unit})
              </th>
              {derived.map((row) => (
                <th
                  key={row.id}
                  scope="col"
                  className="py-2 pl-2 text-right font-medium tabular-nums"
                >
                  {row.period}
                </th>
              ))}
              <th scope="col" className="py-2 pl-2 text-right font-medium">
                YoY
              </th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => {
              const yoy = latest ? latest[metric.growthKey] : NaN
              const hasYoy = Number.isFinite(yoy)
              const up = yoy >= 0
              const Arrow = !hasYoy ? Minus : up ? ArrowUpRight : ArrowDownRight
              return (
                <tr key={metric.key} className="border-border/60 border-b">
                  <th scope="row" className="whitespace-nowrap py-2 pr-2 text-left font-medium">
                    {metric.label}
                  </th>
                  {derived.map((row) => (
                    <td
                      key={row.id}
                      className="whitespace-nowrap py-2 pl-2 text-right tabular-nums"
                    >
                      ₹{fmtNumber(row[metric.key], 2)}
                    </td>
                  ))}
                  <td
                    className={cn(
                      "py-2 pl-2 text-right tabular-nums",
                      !hasYoy ? "text-muted-foreground" : up ? "text-success" : "text-destructive",
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Arrow className="size-3.5" aria-hidden />
                      {hasYoy ? fmtPercent(Math.abs(yoy), 1) : "-"}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {latest && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatTile
            label={`PAT margin (${latest.period})`}
            value={fmtPercent(latest.patMargin, 1)}
            tone="brand"
          />
          <StatTile
            label="Revenue growth (YoY)"
            value={fmtPercent(latest.revenueGrowth, 1)}
            tone={signTone(latest.revenueGrowth)}
          />
          <StatTile
            label="PAT growth (YoY)"
            value={fmtPercent(latest.patGrowth, 1)}
            tone={signTone(latest.patGrowth)}
          />
        </div>
      )}
    </ToolCard>
  )
}

/** Grouped-bar SVG: 3 metric groups x N fiscal years, ordinal brand ramp. */
function FinancialsChart({ derived }: { derived: FinancialDerived[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const nYears = derived.length

  const scale = React.useMemo(() => {
    const { min, max } = valueRange(METRICS.flatMap((m) => derived.map((row) => row[m.key])))
    return niceScale(min, max, { includeZero: true, maxTicks: 4 })
  }, [derived])

  if (nYears === 0) {
    return <ChartEmptyState message="No financial rows yet." />
  }

  const iw = Math.max(0, width - PAD.left - PAD.right)
  const ih = HEIGHT - PAD.top - PAD.bottom
  const span = scale.hi - scale.lo || 1
  const y = (v: number) => PAD.top + (1 - (v - scale.lo) / span) * ih
  const zeroY = y(0)

  const groupW = iw / METRICS.length
  const barW = Math.min(24, (groupW * 0.62) / nYears)
  const gap = 2
  const clusterW = nYears * barW + (nYears - 1) * gap

  return (
    <div ref={ref} style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Total assets, gross revenue and PAT across ${derived.map((r) => r.period).join(", ")}.`}
        >
          {scale.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="currentColor"
                className="text-border"
              />
              <text
                x={PAD.left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                fill="currentColor"
                className="text-muted-foreground text-[11px] tabular-nums"
              >
                {fmtCompact(tick)}
              </text>
            </g>
          ))}

          {METRICS.map((metric, gi) => {
            const gx = PAD.left + gi * groupW
            const startX = gx + (groupW - clusterW) / 2
            return (
              <g key={metric.key}>
                {derived.map((row, yi) => {
                  const value = row[metric.key]
                  const bx = startX + yi * (barW + gap)
                  const vy = y(value)
                  const positive = value >= 0
                  const topY = positive ? vy : zeroY
                  const h = Math.abs(vy - zeroY)
                  return (
                    <path
                      key={row.id}
                      d={barPath(bx, topY, barW, h, 4, positive)}
                      fill="hsl(var(--brand))"
                      fillOpacity={rampOpacity(yi, nYears)}
                    />
                  )
                })}
                <text
                  x={gx + groupW / 2}
                  y={HEIGHT - 14}
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-muted-foreground text-[10px]"
                >
                  {metric.short}
                </text>
              </g>
            )
          })}

          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={zeroY}
            y2={zeroY}
            stroke="currentColor"
            className="text-border"
          />
        </svg>
      )}
    </div>
  )
}

/** A bar with its data-end (away from the baseline) rounded; the baseline stays square. */
function barPath(
  x: number,
  topY: number,
  w: number,
  h: number,
  r: number,
  roundTop: boolean,
): string {
  const rr = Math.max(0, Math.min(r, w / 2, h))
  if (roundTop) {
    return `M${x},${topY + h} L${x},${topY + rr} Q${x},${topY} ${x + rr},${topY} L${x + w - rr},${topY} Q${x + w},${topY} ${x + w},${topY + rr} L${x + w},${topY + h} Z`
  }
  return `M${x},${topY} L${x + w},${topY} L${x + w},${topY + h - rr} Q${x + w},${topY + h} ${x + w - rr},${topY + h} L${x + rr},${topY + h} Q${x},${topY + h} ${x},${topY + h - rr} Z`
}
