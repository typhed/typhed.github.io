import { describe, expect, it } from "vitest"

import {
  createSimulation,
  logReturns as toLogReturns,
  mean,
  mulberry32,
  normalSampler,
  optimalBlockLength,
  simulate,
  stdev,
  tradeLogReturns,
} from "../src"

/**
 * Deterministic synthetic daily log returns: N(0.0004, 0.01)-ish via the
 * toolkit's own seeded sampler, so every test sees the same input series.
 */
function syntheticReturns(n: number, seed = 99): number[] {
  const normal = normalSampler(mulberry32(seed))
  return Array.from({ length: n }, () => 0.0004 + 0.01 * normal())
}

const RETURNS = syntheticReturns(500)

describe("simulate (data-driven Monte Carlo)", () => {
  it("is deterministic for a given seed and invariant to chunk size", () => {
    const input = {
      logReturns: RETURNS,
      mode: "gbm",
      horizon: 40,
      paths: 500,
      seed: 42,
      antithetic: true,
      samplePaths: 3,
    } as const

    const whole = simulate(input)
    const chunked = createSimulation(input)
    while (chunked.done < chunked.total) chunked.runChunk(7)
    const viaChunks = chunked.finalize()

    expect(viaChunks.terminal).toEqual(whole.terminal)
    expect(viaChunks.maxDrawdown).toEqual(whole.maxDrawdown)
    expect(viaChunks.fan).toEqual(whole.fan)
    expect(viaChunks.samplePaths).toEqual(whole.samplePaths)
  })

  it("matches GBM closed-form moments of terminal log wealth", () => {
    const drift = mean(RETURNS)
    const sigma = stdev(RETURNS, 1)
    const horizon = 100
    const paths = 20000

    const summary = simulate({
      logReturns: RETURNS,
      mode: "gbm",
      horizon,
      paths,
      seed: 7,
      collectTerminals: true,
    })

    const logTerminals = Array.from(summary.terminals!, (w) => Math.log(w))
    const logMean = mean(logTerminals)
    const logVariance = stdev(logTerminals, 1) ** 2

    // E[log W_H] = drift*H, Var = sigma^2*H; 4-standard-error tolerances.
    const meanTolerance = (4 * sigma * Math.sqrt(horizon)) / Math.sqrt(paths)
    expect(Math.abs(logMean - drift * horizon)).toBeLessThan(meanTolerance)
    const varTolerance = 4 * Math.sqrt(2 / (paths - 1)) * sigma ** 2 * horizon
    expect(Math.abs(logVariance - sigma ** 2 * horizon)).toBeLessThan(varTolerance)
  })

  it("iid bootstrap converges to the sample mean log return", () => {
    const horizon = 50
    const paths = 10000
    const summary = simulate({
      logReturns: RETURNS,
      mode: "iid",
      horizon,
      paths,
      seed: 11,
      collectTerminals: true,
    })

    const perStep = mean(Array.from(summary.terminals!, (w) => Math.log(w))) / horizon
    const sigma = stdev(RETURNS, 1)
    const tolerance = (4 * sigma) / Math.sqrt(paths * horizon)
    expect(Math.abs(perStep - mean(RETURNS))).toBeLessThan(tolerance)
  })

  it("antithetic pairing reduces the variance of the terminal-mean estimator", () => {
    const config = {
      logReturns: RETURNS,
      mode: "gbm",
      horizon: 50,
      paths: 4000,
    } as const

    const meansPlain: number[] = []
    const meansAntithetic: number[] = []
    for (let seed = 1; seed <= 10; seed += 1) {
      meansPlain.push(simulate({ ...config, seed }).terminal.mean)
      meansAntithetic.push(simulate({ ...config, seed, antithetic: true }).terminal.mean)
    }

    const varianceOf = (xs: number[]) => stdev(xs, 1) ** 2
    expect(varianceOf(meansAntithetic)).toBeLessThan(varianceOf(meansPlain))
  })

  it("reports coherent metrics: ordered percentiles, valid probabilities, fan shape", () => {
    const horizon = 30
    const summary = simulate({
      logReturns: RETURNS,
      mode: "iid",
      horizon,
      paths: 2000,
      seed: 5,
      startValue: 1000,
      targetMultiple: 1.1,
      samplePaths: 8,
    })

    const { p05, p25, p50, p75, p95, probLoss, probTarget } = summary.terminal
    expect(p05).toBeLessThanOrEqual(p25)
    expect(p25).toBeLessThanOrEqual(p50)
    expect(p50).toBeLessThanOrEqual(p75)
    expect(p75).toBeLessThanOrEqual(p95)
    expect(probLoss).toBeGreaterThanOrEqual(0)
    expect(probLoss).toBeLessThanOrEqual(1)
    expect(probTarget).not.toBeNull()
    expect(probTarget!).toBeGreaterThanOrEqual(0)
    expect(probTarget!).toBeLessThanOrEqual(1)

    expect(summary.fan).toHaveLength(5)
    for (const band of summary.fan) expect(band).toHaveLength(horizon + 1)
    // Every band starts at the start value and stays ordered per step.
    for (const band of summary.fan) expect(band[0]).toBe(1000)
    for (let t = 0; t <= horizon; t += 1) {
      for (let i = 1; i < summary.fan.length; i += 1) {
        expect(summary.fan[i]![t]!).toBeGreaterThanOrEqual(summary.fan[i - 1]![t]!)
      }
    }

    expect(summary.samplePaths).toHaveLength(8)
    expect(summary.samplePaths[0]).toHaveLength(horizon + 1)
    expect(summary.horizonVar95).toBeGreaterThanOrEqual(-summary.terminal.p95)
    expect(summary.timeUnderWater.median).toBeGreaterThanOrEqual(0)
    expect(summary.timeUnderWater.median).toBeLessThanOrEqual(1)
  })

  it("computes log returns from prices for the real pipeline", () => {
    // Sanity-check the toolkit pipeline the UI will use: prices -> log
    // returns -> simulate.
    const prices = [100, 101, 100.5, 102, 103, 101.5, 104]
    const rs = toLogReturns(prices)
    const summary = simulate({
      logReturns: rs,
      mode: "iid",
      horizon: 5,
      paths: 100,
      seed: 3,
      startValue: prices[prices.length - 1]!,
    })
    expect(summary.startValue).toBe(104)
    expect(summary.terminal.p50).toBeGreaterThan(0)
  })

  it("golden seeds: same seed + same params = same published numbers", () => {
    const gbm = simulate({
      logReturns: RETURNS,
      mode: "gbm",
      horizon: 20,
      paths: 1000,
      seed: 42,
    })
    const iid = simulate({
      logReturns: RETURNS,
      mode: "iid",
      horizon: 20,
      paths: 1000,
      seed: 42,
    })

    // Captured from the engine at MC1; a change here is a contract break.
    expect(gbm.terminal.p50).toMatchInlineSnapshot(`1.0196809886031337`)
    expect(gbm.maxDrawdown.median).toMatchInlineSnapshot(`0.03201816145304112`)
    expect(iid.terminal.p50).toMatchInlineSnapshot(`1.0167265258808418`)
    expect(iid.maxDrawdown.median).toMatchInlineSnapshot(`0.0323603540438482`)
  })
})

/** Seeded AR(1) log returns with visible serial dependence. */
function ar1Returns(n: number, rho: number, seed: number): number[] {
  const normal = normalSampler(mulberry32(seed))
  const out: number[] = new Array(n)
  let x = 0
  for (let i = 0; i < n; i += 1) {
    x = rho * x + 0.005 * normal()
    out[i] = x
  }
  return out
}

/** Fat-tailed seeded returns: occasional 4x shocks lift the kurtosis. */
function fatTailReturns(n: number, seed: number): number[] {
  const rand = mulberry32(seed)
  const normal = normalSampler(rand)
  return Array.from({ length: n }, () => {
    const shock = rand() < 0.08 ? 4 : 1
    return 0.0004 + 0.008 * shock * normal()
  })
}

function lag1Autocorr(xs: readonly number[]): number {
  const m = mean(xs)
  let num = 0
  let den = 0
  for (let i = 0; i < xs.length; i += 1) {
    const d = xs[i]! - m
    den += d * d
    if (i > 0) num += d * (xs[i - 1]! - m)
  }
  return den === 0 ? 0 : num / den
}

describe("tradeLogReturns (trade-sequence bootstrap transform)", () => {
  it("maps R-multiples through log(1 + f*R) and floors total loss", () => {
    const rs = [2, -1, 0.5, -150]
    const mapped = tradeLogReturns(rs, 0.01)
    expect(mapped[0]).toBeCloseTo(Math.log(1.02), 12)
    expect(mapped[1]).toBeCloseTo(Math.log(0.99), 12)
    expect(mapped[2]).toBeCloseTo(Math.log(1.005), 12)
    // -150R at 1% risk = -150% -> floored at total loss, never NaN.
    expect(mapped[3]).toBe(Math.log(1e-6))
    expect(Number.isFinite(mapped[3]!)).toBe(true)
  })

  it("rejects a non-positive risk fraction", () => {
    expect(() => tradeLogReturns([1, -1], 0)).toThrow(/riskFraction/)
  })

  it("drives the iid engine as a deterministic trade-sequence bootstrap", () => {
    const rs = [2.1, -1, -1, 0.4, 3.2, -0.5, -1, 1.1, -1, 0.9, 2.4, -0.8]
    const summary = simulate({
      logReturns: tradeLogReturns(rs, 0.01),
      mode: "iid",
      horizon: 100,
      paths: 5000,
      seed: 42,
      startValue: 100000,
      collectTerminals: true,
    })

    // Per-step mean log return converges to the list's own mean.
    const expected = mean(tradeLogReturns(rs, 0.01))
    const perStep = mean(Array.from(summary.terminals!, (w) => Math.log(w / 100000))) / 100
    expect(Math.abs(perStep - expected)).toBeLessThan(5e-4)

    // Golden seed for the trade mode.
    expect(summary.terminal.p50).toMatchInlineSnapshot(`147352.99011377792`)
  })
})

describe("simulate (block bootstrap and Student-t modes)", () => {
  const AR_RETURNS = ar1Returns(2000, 0.7, 17)
  const FAT_RETURNS = fatTailReturns(2000, 23)

  it("block mode preserves serial dependence that iid destroys", () => {
    const config = {
      logReturns: AR_RETURNS,
      horizon: 4000,
      paths: 1,
      seed: 9,
      samplePaths: 1,
    } as const

    const stepReturnsOf = (path: number[]): number[] => {
      const out: number[] = []
      for (let i = 1; i < path.length; i += 1) {
        out.push(Math.log(path[i]! / path[i - 1]!))
      }
      return out
    }

    const block = simulate({ ...config, mode: "block", blockLength: 20 })
    const iid = simulate({ ...config, mode: "iid" })

    const blockAcf = lag1Autocorr(stepReturnsOf(block.samplePaths[0]!))
    const iidAcf = lag1Autocorr(stepReturnsOf(iid.samplePaths[0]!))

    expect(blockAcf).toBeGreaterThan(0.4)
    expect(Math.abs(iidAcf)).toBeLessThan(0.1)
  })

  it("defaults the block length to the automatic estimate and honours overrides", () => {
    const auto = simulate({
      logReturns: AR_RETURNS,
      mode: "block",
      horizon: 5,
      paths: 10,
      seed: 2,
    })
    expect(auto.blockLength).toBeCloseTo(optimalBlockLength(AR_RETURNS).stationary, 10)

    const overridden = simulate({
      logReturns: AR_RETURNS,
      mode: "block",
      horizon: 5,
      paths: 10,
      seed: 2,
      blockLength: 7,
    })
    expect(overridden.blockLength).toBe(7)
  })

  it("fits an integer nu from kurtosis and keeps unit-variance innovations", () => {
    const drift = mean(FAT_RETURNS)
    const sigma = stdev(FAT_RETURNS, 1)
    const horizon = 50
    const paths = 20000

    const summary = simulate({
      logReturns: FAT_RETURNS,
      mode: "studentT",
      horizon,
      paths,
      seed: 13,
      collectTerminals: true,
    })

    expect(summary.nu).not.toBeNull()
    expect(Number.isInteger(summary.nu!)).toBe(true)
    expect(summary.nu!).toBeGreaterThanOrEqual(3)
    expect(summary.nu!).toBeLessThan(50)

    // Standardization contract: same first two moments as the GBM anchor.
    const logTerminals = Array.from(summary.terminals!, (w) => Math.log(w))
    const logMean = mean(logTerminals)
    const logVariance = stdev(logTerminals, 1) ** 2
    const meanTolerance = (6 * sigma * Math.sqrt(horizon)) / Math.sqrt(paths)
    expect(Math.abs(logMean - drift * horizon)).toBeLessThan(meanTolerance)
    expect(Math.abs(logVariance - sigma ** 2 * horizon)).toBeLessThan(0.15 * sigma ** 2 * horizon)
  })

  it("stays deterministic and chunk-invariant in the new modes", () => {
    for (const mode of ["block", "studentT"] as const) {
      const input = {
        logReturns: FAT_RETURNS,
        mode,
        horizon: 30,
        paths: 300,
        seed: 6,
        antithetic: mode === "studentT",
      } as const
      const whole = simulate(input)
      const chunked = createSimulation(input)
      while (chunked.done < chunked.total) chunked.runChunk(11)
      const viaChunks = chunked.finalize()
      expect(viaChunks.terminal).toEqual(whole.terminal)
      expect(viaChunks.maxDrawdown).toEqual(whole.maxDrawdown)
    }
  })

  it("golden seeds for the new modes", () => {
    const block = simulate({
      logReturns: AR_RETURNS,
      mode: "block",
      horizon: 20,
      paths: 1000,
      seed: 42,
      blockLength: 10,
    })
    const studentT = simulate({
      logReturns: FAT_RETURNS,
      mode: "studentT",
      horizon: 20,
      paths: 1000,
      seed: 42,
    })

    // Captured at MC2; a change here is a contract break.
    expect(block.terminal.p50).toMatchInlineSnapshot(`1.0131308499128626`)
    expect(block.maxDrawdown.median).toMatchInlineSnapshot(`0.03166046369657616`)
    expect(studentT.nu).toMatchInlineSnapshot(`5`)
    expect(studentT.terminal.p50).toMatchInlineSnapshot(`1.0054552733598325`)
    expect(studentT.maxDrawdown.median).toMatchInlineSnapshot(`0.042849960521986405`)
  })
})
