"use client"

import * as React from "react"

import { fmtInr, fmtInrShort, fmtPercent } from "@/lib/format"
import { niceScale } from "@/lib/ipo/analytics"
import { useElementWidth } from "@/lib/use-element-width"
import type { FinancialYearRow, MnwsResult, MonthRow } from "@/lib/budgeting/mnws/engine"
import { ToolCard } from "@/components/tools/controls"
import { CORPUS_COLORS, SERIES, SERIES_ORDER } from "./series"
import { SeriesLegend } from "./mnws-visuals"

const HEIGHT = 300
const PAD = { top: 16, right: 52, bottom: 28, left: 56 }

/** Indices at each January (and the first month) - the x-axis year gridlines. */
function yearTicks(months: MonthRow[]): number[] {
  const ticks: number[] = []
  months.forEach((m, i) => {
    const prev = months[i - 1]
    if (i === 0 || !prev || m.year !== prev.year) ticks.push(i)
  })
  return ticks
}

/**
 * Year ticks thinned to a minimum pixel gap. Later ticks win, so the extra
 * start-month tick is dropped when it crowds the first January label, and
 * crowded January labels thin out on narrow viewports.
 */
function visibleYearTicks(months: MonthRow[], x: (i: number) => number, minGap = 34): number[] {
  const all = yearTicks(months)
  const kept: number[] = []
  for (let j = all.length - 1; j >= 0; j--) {
    const idx = all[j]!
    if (kept.length === 0 || x(kept[0]!) - x(idx) >= minGap) kept.unshift(idx)
  }
  return kept
}

/** A dot swatch + label legend row, used where SeriesLegend's keys don't apply. */
function Legend({
  items,
}: {
  items: ReadonlyArray<{ color: string; label: string; dashed?: boolean }>
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
      {items.map((item) => (
        <span key={item.label} className="text-muted-foreground inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0 w-4 shrink-0 rounded-full"
            style={{
              borderTop: `${item.dashed ? "2px dashed" : "3px solid"} ${item.color}`,
            }}
          />
          {item.label}
        </span>
      ))}
    </div>
  )
}

/** Arrow-left/right step and Escape-clear a hover index; returns true if handled. */
function stepHover(
  key: string,
  lastIdx: number,
  setHover: React.Dispatch<React.SetStateAction<number | null>>,
): boolean {
  if (key === "ArrowRight" || key === "ArrowLeft") {
    setHover((prev) => {
      const base = prev ?? lastIdx
      return Math.max(0, Math.min(lastIdx, base + (key === "ArrowRight" ? 1 : -1)))
    })
    return true
  }
  if (key === "Escape") {
    setHover(null)
    return true
  }
  return false
}

/**
 * Shared crosshair-scrub interaction for the point-indexed charts (corpus,
 * drift): pointer move maps x → nearest index, arrow keys step, Escape/blur
 * clears. Returns the hovered index and the props to spread on the <svg>.
 */
function useScrubHover(n: number, xLeft: number, iw: number) {
  const [hover, setHover] = React.useState<number | null>(null)
  const lastIdx = n - 1
  const handlers = {
    tabIndex: 0,
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      if (n <= 1) return setHover(0)
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = (e.clientX - rect.left - xLeft) / (iw || 1)
      setHover(Math.max(0, Math.min(lastIdx, Math.round(ratio * (n - 1)))))
    },
    onPointerLeave: () => setHover(null),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (stepHover(e.key, lastIdx, setHover)) e.preventDefault()
    },
    onFocus: () => setHover((prev) => prev ?? lastIdx),
    onBlur: () => setHover(null),
  }
  return { hover, handlers }
}

/* ------------------------------- Corpus ------------------------------- */

/** Cash saved vs invested corpus over time - the hero savings chart. */
function CorpusChart({ months, annualReturnPct }: { months: MonthRow[]; annualReturnPct: number }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()

  const n = months.length
  const maxVal = months.reduce((max, m) => Math.max(max, m.investedCumulative, m.cashCumulative), 0)
  const scale = React.useMemo(
    () => niceScale(0, maxVal, { includeZero: true, maxTicks: 5 }),
    [maxVal],
  )

  const iw = Math.max(0, width - PAD.left - PAD.right)
  const ih = HEIGHT - PAD.top - PAD.bottom
  const span = scale.hi - scale.lo || 1
  const x = (i: number) => PAD.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const y = (v: number) => PAD.top + (1 - (v - scale.lo) / span) * ih
  const { hover, handlers } = useScrubHover(n, PAD.left, iw)

  const investedLine = months
    .map((m, i) => `${x(i).toFixed(1)},${y(m.investedCumulative).toFixed(1)}`)
    .join(" ")
  const cashLine = months
    .map((m, i) => `${x(i).toFixed(1)},${y(m.cashCumulative).toFixed(1)}`)
    .join(" ")
  const baseY = y(scale.lo)
  const investedArea = `${x(0).toFixed(1)},${baseY.toFixed(1)} ${investedLine} ${x(n - 1).toFixed(1)},${baseY.toFixed(1)}`
  const lastIdx = n - 1
  const bonusMonths = months.map((m, i) => ({ m, i })).filter(({ m }) => m.bonusInflow > 0)
  const ticks = visibleYearTicks(months, x)
  const hovered = hover !== null ? months[hover] : undefined

  return (
    <div ref={ref} className="relative" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Savings corpus from ${months[0]!.label} to ${months[lastIdx]!.label}: cash saved ${fmtInr(months[lastIdx]!.cashCumulative, 0)}, invested corpus ${fmtInr(months[lastIdx]!.investedCumulative, 0)} at ${annualReturnPct}% a year.`}
          className="focus-visible:ring-ring touch-none rounded-md outline-none focus-visible:ring-2"
          {...handlers}
        >
          <defs>
            <linearGradient id="mnws-corpus-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CORPUS_COLORS.invested} stopOpacity={0.22} />
              <stop offset="100%" stopColor={CORPUS_COLORS.invested} stopOpacity={0} />
            </linearGradient>
          </defs>

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
                className="text-muted-foreground fill-current text-[11px] tabular-nums"
              >
                {fmtInrShort(tick)}
              </text>
            </g>
          ))}

          {ticks.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="text-muted-foreground fill-current text-[11px]"
            >
              {months[i]!.year}
            </text>
          ))}

          <polygon points={investedArea} fill="url(#mnws-corpus-fill)" />
          <polyline
            points={cashLine}
            fill="none"
            stroke={CORPUS_COLORS.cash}
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={investedLine}
            fill="none"
            stroke={CORPUS_COLORS.invested}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {bonusMonths.map(({ m, i }) => (
            <circle
              key={m.key}
              cx={x(i)}
              cy={y(m.investedCumulative)}
              r={4}
              fill={CORPUS_COLORS.invested}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              <title>{`${m.label}: ${fmtInr(m.bonusInflow, 0)} windfall`}</title>
            </circle>
          ))}

          {hover !== null && hovered && (
            <>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={PAD.top + ih}
                stroke="currentColor"
                className="text-muted-foreground"
                strokeOpacity={0.4}
              />
              <circle
                cx={x(hover)}
                cy={y(hovered.investedCumulative)}
                r={4.5}
                fill={CORPUS_COLORS.invested}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
              <circle
                cx={x(hover)}
                cy={y(hovered.cashCumulative)}
                r={4.5}
                fill={CORPUS_COLORS.cash}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            </>
          )}
        </svg>
      )}

      {hover !== null && hovered && width > 0 && (
        <div
          className="border-border bg-popover pointer-events-none absolute -translate-x-1/2 rounded-md border px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: Math.min(Math.max(x(hover), 70), width - 70), top: 8 }}
        >
          <div className="text-popover-foreground font-semibold">{hovered.label}</div>
          <div className="text-popover-foreground mt-0.5 flex items-center gap-1.5 tabular-nums">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CORPUS_COLORS.invested }}
            />
            Corpus {fmtInr(hovered.investedCumulative, 0)}
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5 tabular-nums">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CORPUS_COLORS.cash }}
            />
            Cash {fmtInr(hovered.cashCumulative, 0)}
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------- Drift -------------------------------- */

/** A 100 %-stacked area of the recurring needs/wants/savings rates over time. */
function DriftChart({ months }: { months: MonthRow[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()

  const n = months.length
  const iw = Math.max(0, width - PAD.left - PAD.right)
  const ih = HEIGHT - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const y = (v: number) => PAD.top + (1 - v) * ih // v is a 0..1 fraction
  const { hover, handlers } = useScrubHover(n, PAD.left, iw)

  // Cumulative upper boundary per bucket (needs at bottom, savings on top).
  const upper = (m: MonthRow, key: (typeof SERIES_ORDER)[number]) =>
    key === "needs"
      ? m.needsRate
      : key === "wants"
        ? m.needsRate + m.wantsRate
        : m.needsRate + m.wantsRate + m.savingsRate
  const lower = (m: MonthRow, key: (typeof SERIES_ORDER)[number]) =>
    key === "needs" ? 0 : key === "wants" ? m.needsRate : m.needsRate + m.wantsRate

  const bandPath = (key: (typeof SERIES_ORDER)[number]) => {
    const top = months.map((m, i) => `${x(i).toFixed(1)},${y(upper(m, key)).toFixed(1)}`).join(" ")
    const bottom = months
      .map((m, i) => ({ m, i }))
      .reverse()
      .map(({ m, i }) => `${x(i).toFixed(1)},${y(lower(m, key)).toFixed(1)}`)
      .join(" ")
    return `${top} ${bottom}`
  }

  // The two internal boundaries (needs|wants, wants|savings) as gap strokes.
  const boundary = (fn: (m: MonthRow) => number) =>
    months.map((m, i) => `${x(i).toFixed(1)},${y(fn(m)).toFixed(1)}`).join(" ")

  const gridlines = [0, 0.25, 0.5, 0.75, 1]
  const ticks = visibleYearTicks(months, x)
  const lastIdx = n - 1
  const hovered = hover !== null ? months[hover] : undefined

  return (
    <div ref={ref} className="relative" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Recurring allocation shares over time. At ${months[lastIdx]!.label}: needs ${fmtPercent(months[lastIdx]!.needsRate, 0)}, wants ${fmtPercent(months[lastIdx]!.wantsRate, 0)}, savings ${fmtPercent(months[lastIdx]!.savingsRate, 0)}.`}
          className="focus-visible:ring-ring touch-none rounded-md outline-none focus-visible:ring-2"
          {...handlers}
        >
          {gridlines.map((g) => (
            <text
              key={g}
              x={PAD.left - 8}
              y={y(g)}
              dy="0.32em"
              textAnchor="end"
              className="text-muted-foreground fill-current text-[11px] tabular-nums"
            >
              {Math.round(g * 100)}%
            </text>
          ))}

          {SERIES_ORDER.map((key) => (
            <polygon key={key} points={bandPath(key)} fill={SERIES[key].color} fillOpacity={0.9} />
          ))}

          {/* 2px surface-gap strokes between the stacked bands. */}
          <polyline
            points={boundary((m) => m.needsRate)}
            fill="none"
            stroke="hsl(var(--card))"
            strokeWidth={2}
          />
          <polyline
            points={boundary((m) => m.needsRate + m.wantsRate)}
            fill="none"
            stroke="hsl(var(--card))"
            strokeWidth={2}
          />

          {ticks.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="text-muted-foreground fill-current text-[11px]"
            >
              {months[i]!.year}
            </text>
          ))}

          {hover !== null && hovered && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + ih}
              stroke="hsl(var(--foreground))"
              strokeOpacity={0.5}
            />
          )}
        </svg>
      )}

      {hover !== null && hovered && width > 0 && (
        <div
          className="border-border bg-popover pointer-events-none absolute -translate-x-1/2 rounded-md border px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: Math.min(Math.max(x(hover), 78), width - 78), top: 8 }}
        >
          <div className="text-popover-foreground font-semibold">{hovered.label}</div>
          {SERIES_ORDER.map((key) => (
            <div
              key={key}
              className="text-popover-foreground mt-0.5 flex items-center gap-1.5 tabular-nums"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: SERIES[key].color }}
              />
              {SERIES[key].label} {fmtPercent(hovered[`${key}Rate` as const], 1)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------- Annual ------------------------------- */

const A_PAD = { top: 16, right: 16, bottom: 28, left: 56 }

/** Stacked bars of each financial year's savings: salary savings + windfalls. */
function AnnualChart({ years }: { years: FinancialYearRow[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [hover, setHover] = React.useState<number | null>(null)

  const n = years.length
  const maxVal = years.reduce((max, a) => Math.max(max, a.totalSavings), 0)
  const scale = React.useMemo(
    () => niceScale(0, maxVal, { includeZero: true, maxTicks: 5 }),
    [maxVal],
  )

  const iw = Math.max(0, width - A_PAD.left - A_PAD.right)
  const ih = HEIGHT - A_PAD.top - A_PAD.bottom
  const span = scale.hi - scale.lo || 1
  const y = (v: number) => A_PAD.top + (1 - (v - scale.lo) / span) * ih
  const slot = n > 0 ? iw / n : iw
  const barW = Math.min(48, slot * 0.62)
  const cx = (i: number) => A_PAD.left + slot * (i + 0.5)

  const items = [
    {
      key: "salary" as const,
      label: "Salary savings",
      color: SERIES.savings.color,
    },
    {
      key: "bonus" as const,
      label: "Bonus savings",
      color: CORPUS_COLORS.invested,
    },
  ]

  return (
    <div ref={ref} className="relative" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          tabIndex={0}
          aria-label={`Savings added each financial year from ${years[0]?.label} to ${years[n - 1]?.label}.`}
          className="focus-visible:ring-ring rounded-md outline-none focus-visible:ring-2"
          onKeyDown={(e) => {
            if (stepHover(e.key, n - 1, setHover)) e.preventDefault()
          }}
          onFocus={() => setHover((prev) => prev ?? n - 1)}
          onBlur={() => setHover(null)}
        >
          {scale.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={A_PAD.left}
                x2={width - A_PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="currentColor"
                className="text-border"
              />
              <text
                x={A_PAD.left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="text-muted-foreground fill-current text-[11px] tabular-nums"
              >
                {fmtInrShort(tick)}
              </text>
            </g>
          ))}

          {years.map((a, i) => {
            const salaryTop = y(a.salarySavings)
            const totalTop = y(a.totalSavings)
            const base = y(scale.lo)
            const x0 = cx(i) - barW / 2
            const isHover = hover === i
            return (
              <g
                key={a.startYear}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover((prev) => (prev === i ? null : prev))}
              >
                {/* Salary savings (bottom segment). */}
                <rect
                  x={x0}
                  y={salaryTop}
                  width={barW}
                  height={Math.max(0, base - salaryTop)}
                  rx={3}
                  fill={SERIES.savings.color}
                  fillOpacity={isHover ? 1 : 0.9}
                />
                {/* Bonus savings (top segment), 2px surface gap below it. */}
                {a.bonusSavings > 0 && (
                  <rect
                    x={x0}
                    y={totalTop}
                    width={barW}
                    height={Math.max(0, salaryTop - totalTop - 2)}
                    rx={3}
                    fill={CORPUS_COLORS.invested}
                    fillOpacity={isHover ? 1 : 0.9}
                  />
                )}
                <text
                  x={cx(i)}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="text-muted-foreground fill-current text-[11px]"
                >
                  {a.shortLabel}
                </text>
              </g>
            )
          })}
        </svg>
      )}

      {hover !== null && years[hover] && width > 0 && (
        <div
          className="border-border bg-popover pointer-events-none absolute -translate-x-1/2 rounded-md border px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: Math.min(Math.max(cx(hover), 80), width - 80),
            top: 8,
          }}
        >
          <div className="text-popover-foreground font-semibold">{years[hover]!.label}</div>
          <div className="text-popover-foreground mt-0.5 flex items-center gap-1.5 tabular-nums">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: SERIES.savings.color }}
            />
            Salary {fmtInr(years[hover]!.salarySavings, 0)}
          </div>
          {years[hover]!.bonusSavings > 0 && (
            <div className="text-popover-foreground flex items-center gap-1.5 tabular-nums">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CORPUS_COLORS.invested }}
              />
              Bonus {fmtInr(years[hover]!.bonusSavings, 0)}
            </div>
          )}
          <div className="border-border text-muted-foreground mt-0.5 border-t pt-0.5 tabular-nums">
            Total {fmtInr(years[hover]!.totalSavings, 0)}
          </div>
        </div>
      )}

      <Legend items={items} />
    </div>
  )
}

/* ------------------------------ Container ------------------------------ */

/** All MNWS charts, savings-first. Renders nothing until there is a timeline. */
export function MnwsCharts({ result }: { result: MnwsResult }) {
  if (!result.summary.hasData) return null

  return (
    <div className="space-y-6">
      <ToolCard
        title="Savings corpus growth"
        description="What disciplined saving builds: your nominal cash saved versus the same contributions invested and compounding."
      >
        <CorpusChart months={result.months} annualReturnPct={result.summary.annualReturnPct} />
        <Legend
          items={[
            {
              color: CORPUS_COLORS.invested,
              label: `Invested corpus @ ${result.summary.annualReturnPct}% p.a.`,
            },
            {
              color: CORPUS_COLORS.cash,
              label: "Cash saved (no returns)",
              dashed: true,
            },
          ]}
        />
      </ToolCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ToolCard
          title="Allocation drift"
          description="Your recurring split over time: needs shrink, savings climb, wants hold at 30 %."
        >
          <DriftChart months={result.months} />
          <SeriesLegend className="mt-3" />
        </ToolCard>

        <ToolCard
          title="Savings added each financial year"
          description="Contributions to the corpus per F.Y. (Apr–Mar), split into recurring salary savings and one-off windfalls."
        >
          <AnnualChart years={result.financialYears} />
        </ToolCard>
      </div>
    </div>
  )
}
