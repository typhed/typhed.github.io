import { describe, expect, it } from "vitest"
import type { Candle } from "@typhed/chart-engine"
import { ema } from "@typhed/chart-engine"
import { mulberry32, normalSampler } from "@typhed/risk-toolkit"

import { runSweep, touchFidelity, type SweepParams } from "../src"

function syntheticCandles(n: number, seed: number, drift = 0.0006): Candle[] {
  const normal = normalSampler(mulberry32(seed))
  const rand = mulberry32(seed + 1)
  const candles: Candle[] = []
  let close = 100
  for (let i = 0; i < n; i += 1) {
    const open = close * (1 + 0.002 * (rand() - 0.5))
    const next = close * Math.exp(drift + 0.012 * normal())
    const high = Math.max(open, next) * (1 + 0.004 * rand())
    const low = Math.min(open, next) * (1 - 0.004 * rand())
    candles.push({ time: 86400 * (i + 1), open, high, low, close: next, volume: null })
    close = next
  }
  return candles
}

const CANDLES = syntheticCandles(1200, 11)

const PERIODS = Array.from({ length: 21 }, (_, i) => i + 10) // 10..30

const BASE: SweepParams = {
  template: "pullback",
  emaPeriods: PERIODS,
  holdingCapBars: 10,
  roundTripCostBps: 20,
}

describe("runSweep", () => {
  it("returns one row per period with neighbor-smoothed scores", () => {
    const result = runSweep(CANDLES, BASE)
    expect(result.rows).toHaveLength(PERIODS.length)
    expect(result.rows.map((r) => r.emaPeriod)).toEqual(PERIODS)

    // Middle row: smoothed = mean of the five raw scores around it.
    const i = 10
    const around = result.rows.slice(i - 2, i + 3).map((r) => r.cell.score)
    const expected = around.reduce((a, b) => a + b, 0) / around.length
    expect(result.rows[i]!.smoothedScore).toBeCloseTo(expected, 10)
  })

  it("guard 1: an unreachable minimum sample suppresses the badge", () => {
    const result = runSweep(CANDLES, { ...BASE, minTrades: 10000 })
    expect(result.best).toBeNull()
    expect(result.rows.every((r) => r.cell.lowSample)).toBe(true)
  })

  it("guard 2: the badge goes to the best smoothed plateau, never a spike", () => {
    const result = runSweep(CANDLES, { ...BASE, minTrades: 10 })
    expect(result.best).not.toBeNull()
    const eligible = result.rows.filter((r) => !r.cell.lowSample)
    const maxSmoothed = Math.max(...eligible.map((r) => r.smoothedScore))
    expect(result.best!.smoothedScore).toBe(maxSmoothed)
  })

  it("guard 3: the degradation flag matches its definition on every cell", () => {
    const result = runSweep(CANDLES, BASE)
    for (const row of result.rows) {
      const { inSampleScore, outOfSampleScore, oosDegraded } = row.cell
      expect(oosDegraded).toBe(inSampleScore > 0 && outOfSampleScore < 0.5 * inSampleScore)
    }
  })

  it("sweeps holding caps and keeps the best cap per period", () => {
    const result = runSweep(CANDLES, {
      ...BASE,
      holdingCaps: [2, 5, 10, 20],
      minTrades: 10,
    })
    for (const row of result.rows) {
      expect([2, 5, 10, 20]).toContain(row.cell.holdingCapBars)
    }
  })

  it("is deterministic and reports progress once per period", () => {
    const ticks: number[] = []
    const a = runSweep(CANDLES, BASE, (done) => ticks.push(done))
    const b = runSweep(CANDLES, BASE)
    expect(ticks).toEqual(PERIODS.map((_, i) => i + 1))
    expect(a).toEqual(b)
  })
})

describe("touchFidelity", () => {
  it("is bounded and null when touches are too few", () => {
    const emaValues = ema(CANDLES, 20).map((p) => p.value)
    const fidelity = touchFidelity(CANDLES, emaValues, 10)
    expect(fidelity).not.toBeNull()
    expect(fidelity!).toBeGreaterThanOrEqual(0)
    expect(fidelity!).toBeLessThanOrEqual(1)

    const tiny = CANDLES.slice(0, 30)
    const tinyEma = ema(tiny, 20).map((p) => p.value)
    expect(touchFidelity(tiny, tinyEma, 10)).toBeNull()
  })
})
