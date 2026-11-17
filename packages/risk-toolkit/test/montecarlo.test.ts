import { describe, expect, it } from "vitest"

import { monteCarloDrawdown } from "../src"

const base = {
  startEquity: 100000,
  trials: 2000,
  tradesPerTrial: 100,
  winRate: 0.55,
  winReturn: 0.02,
  lossReturn: -0.01,
  seed: 42,
} as const

describe("monteCarloDrawdown", () => {
  it("is deterministic for a given seed", () => {
    const a = monteCarloDrawdown(base)
    const b = monteCarloDrawdown(base)
    expect(a.finalEquity).toEqual(b.finalEquity)
    expect(a.ruinProbability).toBe(b.ruinProbability)
    expect(a.maxDrawdown).toEqual(b.maxDrawdown)
  })

  it("returns ordered percentiles and a valid probability", () => {
    const r = monteCarloDrawdown(base)
    const { p05, p25, p50, p75, p95 } = r.finalEquity
    expect(p05).toBeLessThanOrEqual(p25)
    expect(p25).toBeLessThanOrEqual(p50)
    expect(p50).toBeLessThanOrEqual(p75)
    expect(p75).toBeLessThanOrEqual(p95)
    expect(r.ruinProbability).toBeGreaterThanOrEqual(0)
    expect(r.ruinProbability).toBeLessThanOrEqual(1)
  })

  it("never ruins and grows monotonically when every trade wins", () => {
    const r = monteCarloDrawdown({
      ...base,
      trials: 50,
      tradesPerTrial: 10,
      winRate: 1,
    })
    const expectedFinal = 100000 * 1.02 ** 10
    expect(r.finalEquity.p50).toBeCloseTo(expectedFinal, 4)
    expect(r.maxDrawdown.worst).toBe(0)
    expect(r.ruinProbability).toBe(0)
  })

  it("returns the requested number of sample paths", () => {
    const r = monteCarloDrawdown({ ...base, trials: 100, samplePaths: 5 })
    expect(r.paths).toHaveLength(5)
    expect(r.paths[0]).toHaveLength(base.tradesPerTrial + 1)
  })
})
