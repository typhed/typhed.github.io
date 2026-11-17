import { optimalBlockLength } from "./blocklength"
import { mulberry32, normalSampler } from "./rng"
import { historicalCVar, historicalVar } from "./risk"
import { mean, stdev } from "./stats"

/**
 * Data-driven Monte Carlo engine (v2). Unlike `monteCarloDrawdown`, which
 * simulates from hand-typed win/loss parameters, every mode here simulates
 * from the uploaded series' own log returns:
 *
 *   - "iid": resample the log returns with replacement. Distribution-free
 *     and transparent, but destroys serial dependence (vol clustering).
 *   - "block": Politis-Romano stationary bootstrap - geometric block
 *     lengths, circular wrap - preserving short-range dependence. The
 *     expected block length defaults to the Patton-Politis-White automatic
 *     selector (`optimalBlockLength`), overridable by the user.
 *   - "gbm": fit drift and sigma to the log returns and simulate normal
 *     increments. Closed-form moments make it the unit-test anchor: with
 *     drift = mean log return, E[log W_H] = drift*H and Var = sigma^2*H.
 *   - "studentT": fat-tail variant of "gbm" - Student-t innovations with
 *     integer nu moment-matched to the sample excess kurtosis
 *     (nu ~ 4 + 6/kurtosis, clamped to [3, 50]; the cap keeps the
 *     nu-squared-normals chi-square sampler affordable and is documented
 *     in the tool's method note), standardized to unit variance by
 *     sqrt((nu-2)/nu) so the GBM moment contract still holds.
 *
 * The engine is chunk-driven so a worker can post progress and stay
 * cancellable, and deterministic: same seed + same params = same result,
 * regardless of chunk sizes (the RNG stream lives in the simulation
 * closure). Antithetic pairing (innovation, -innovation) applies to the
 * parametric modes only - resampling modes have nothing to mirror, so the
 * flag is ignored there.
 */

export type DataDrivenMode = "iid" | "block" | "gbm" | "studentT"

/** Clamp bounds for the moment-matched Student-t degrees of freedom. */
const NU_MIN = 3
const NU_MAX = 50

/**
 * Moment-matched integer Student-t degrees of freedom: the excess kurtosis
 * of t_nu is 6/(nu-4), so nu ~ 4 + 6/kurtosis. Non-positive sample excess
 * kurtosis (tails no fatter than normal) maps to the NU_MAX cap, where t
 * is practically indistinguishable from normal.
 */
function fitNu(logReturns: readonly number[]): number {
  const m = mean(logReturns)
  let m2 = 0
  let m4 = 0
  for (const x of logReturns) {
    const d = x - m
    const d2 = d * d
    m2 += d2
    m4 += d2 * d2
  }
  m2 /= logReturns.length
  m4 /= logReturns.length
  const excess = m2 > 0 ? m4 / (m2 * m2) - 3 : 0
  if (excess <= 0) return NU_MAX
  return Math.min(NU_MAX, Math.max(NU_MIN, Math.round(4 + 6 / excess)))
}

export interface SimulateInput {
  /** Log returns of the uploaded series, one per bar. */
  logReturns: readonly number[]
  mode: DataDrivenMode
  /** Steps (bars) to simulate forward. */
  horizon: number
  /** Number of simulated paths. */
  paths: number
  /** RNG seed (default 1). Same seed + same params = same result. */
  seed?: number
  /** Pair each innovation path with its negation (parametric modes only). */
  antithetic?: boolean
  /**
   * Expected block length for "block" mode. Defaults to the automatic
   * Patton-Politis-White estimate; ignored by every other mode.
   */
  blockLength?: number
  /** Starting wealth, e.g. the last close (default 1). */
  startValue?: number
  /** Fraction of start value that counts as ruin (default 0.5). */
  ruinFraction?: number
  /** Wealth multiple that counts as "target reached" (optional). */
  targetMultiple?: number
  /** Full equity paths to keep for spaghetti display (default 0). */
  samplePaths?: number
  /**
   * Also return the raw per-path arrays (terminal wealth and max drawdown)
   * for distribution displays (default false).
   */
  collectTerminals?: boolean
}

export interface SimulationSummary {
  mode: DataDrivenMode
  paths: number
  horizon: number
  seed: number
  antithetic: boolean
  startValue: number
  /** Fitted per-step drift (mean log return) and sigma of the input. */
  drift: number
  sigma: number
  /** Expected block length used ("block" mode; null otherwise). */
  blockLength: number | null
  /** Student-t degrees of freedom used ("studentT" mode; null otherwise). */
  nu: number | null
  terminal: {
    p05: number
    p25: number
    p50: number
    p75: number
    p95: number
    mean: number
    /** Fraction of paths ending below the start value. */
    probLoss: number
    /** Fraction of paths reaching the target multiple (null if unset). */
    probTarget: number | null
  }
  /** Horizon VaR/CVaR at 95%, positive loss fractions of start value. */
  horizonVar95: number
  horizonCvar95: number
  maxDrawdown: { median: number; p95: number; worst: number }
  /** Fraction of steps spent below the running peak, per path. */
  timeUnderWater: { median: number; p95: number }
  /** Fraction of paths that touched the ruin level at any point. */
  ruinProbability: number
  /** Per-step wealth percentile bands for the fan chart. */
  fanPercentiles: readonly number[]
  /** fan[i][t] = wealth at step t for fanPercentiles[i]; length horizon+1. */
  fan: number[][]
  /** Paths actually sampled for the fan bands (memory-bounded). */
  fanSampleSize: number
  samplePaths: number[][]
  /** Raw terminal wealth per path (present when collectTerminals). */
  terminals?: Float64Array
  /** Raw max drawdown per path (present when collectTerminals). */
  maxDrawdowns?: Float64Array
}

export interface Simulation {
  /** Total paths this run will produce. */
  readonly total: number
  /** Paths completed so far. */
  readonly done: number
  /** Run up to `count` more paths; returns paths completed so far. */
  runChunk(count: number): number
  /** Finish (runs any remainder) and compute the summary. */
  finalize(): SimulationSummary
}

export const FAN_PERCENTILES = [0.05, 0.25, 0.5, 0.75, 0.95] as const

/**
 * Fan bands are computed from a bounded sample of path columns, so 100k-path
 * runs stay inside a fixed memory budget while terminal statistics still use
 * every path (documented design; see the research doc's worker section).
 */
const FAN_SAMPLE_LIMIT = 2000

/** All percentiles of one unsorted sample, sorting it once. */
function quantilesOf(values: Float64Array, qs: readonly number[]): number[] {
  const sorted = Float64Array.from(values).sort()
  const n = sorted.length
  return qs.map((q) => {
    if (n === 0) return Number.NaN
    if (n === 1) return sorted[0]!
    const pos = (n - 1) * q
    const lo = Math.floor(pos)
    const hi = Math.ceil(pos)
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo)
  })
}

export function createSimulation(input: SimulateInput): Simulation {
  const { logReturns, mode, horizon, paths } = input
  if (logReturns.length < 2) {
    throw new Error("Monte Carlo needs at least 2 log returns to fit.")
  }
  if (!Number.isInteger(horizon) || horizon < 1) {
    throw new Error(`horizon must be a positive integer, got ${horizon}.`)
  }
  if (!Number.isInteger(paths) || paths < 1) {
    throw new Error(`paths must be a positive integer, got ${paths}.`)
  }

  const seed = input.seed ?? 1
  const startValue = input.startValue ?? 1
  const ruinFraction = input.ruinFraction ?? 0.5
  const targetMultiple = input.targetMultiple
  const sampleCount = input.samplePaths ?? 0
  const parametric = mode === "gbm" || mode === "studentT"
  const antithetic = (input.antithetic ?? false) && parametric

  const drift = mean(logReturns)
  const sigma = stdev(logReturns, 1)

  const rand = mulberry32(seed)
  const nextNormal = normalSampler(rand)
  const n = logReturns.length
  const ruinLevel = startValue * ruinFraction
  const targetLevel = targetMultiple === undefined ? null : startValue * targetMultiple

  // "block" mode: expected block length (auto unless overridden) and the
  // per-step probability of starting a fresh block (geometric lengths).
  const blockLength =
    mode === "block"
      ? Math.max(1, input.blockLength ?? optimalBlockLength(logReturns).stationary)
      : null
  const newBlockProb = blockLength === null ? 0 : 1 / blockLength

  // "studentT" mode: integer nu moment-matched to the sample kurtosis, and
  // the sqrt((nu-2)/nu) factor that standardizes t to unit variance.
  const nu = mode === "studentT" ? fitNu(logReturns) : null
  const tScale = nu === null ? 1 : Math.sqrt((nu - 2) / nu)

  const finals = new Float64Array(paths)
  const maxDrawdowns = new Float64Array(paths)
  const underwaterFractions = new Float64Array(paths)
  const spaghetti: number[][] = []
  let ruined = 0
  let reachedTarget = 0

  const fanSampleSize = Math.min(paths, FAN_SAMPLE_LIMIT)
  // fanColumns[t] holds wealth at step t for the first fanSampleSize paths.
  const fanColumns: Float64Array[] = Array.from(
    { length: horizon + 1 },
    () => new Float64Array(fanSampleSize),
  )

  // Antithetic state: the innovation vector of the previous path, negated.
  let pendingInnovations: Float64Array | null = null
  const innovationBuffer = antithetic ? new Float64Array(horizon) : null

  let done = 0

  /** One standardized Student-t innovation (unit variance). */
  function nextStudentT(): number {
    const z = nextNormal()
    // Integer-nu chi-square as a sum of squared normals (the documented
    // sampling scheme; NU_MAX keeps it affordable).
    let chi2 = 0
    for (let j = 0; j < nu!; j += 1) {
      const zj = nextNormal()
      chi2 += zj * zj
    }
    return (z / Math.sqrt(chi2 / nu!)) * tScale
  }

  function nextParametricReturn(step: number, negate: boolean): number {
    let innovation: number
    if (negate) {
      innovation = -pendingInnovations![step]!
    } else {
      innovation = mode === "gbm" ? nextNormal() : nextStudentT()
      if (innovationBuffer) innovationBuffer[step] = innovation
    }
    return drift + sigma * innovation
  }

  function runPath(index: number): void {
    const negate = antithetic && pendingInnovations !== null
    let wealth = startValue
    let peak = startValue
    let maxDd = 0
    let underwaterSteps = 0
    let hitRuin = false
    let hitTarget = false
    const keepPath = index < sampleCount ? [startValue] : null
    const fanColumn = index < fanSampleSize
    if (fanColumn) fanColumns[0]![index] = startValue

    // "block" mode read position: a fresh block starts at step 0 and then
    // with probability 1/blockLength; continuation wraps circularly
    // (Politis-Romano stationary bootstrap).
    let blockIndex = -1

    for (let step = 0; step < horizon; step += 1) {
      let stepReturn: number
      if (parametric) {
        stepReturn = nextParametricReturn(step, negate)
      } else if (mode === "block") {
        if (blockIndex < 0 || rand() < newBlockProb) {
          blockIndex = Math.floor(rand() * n)
        } else {
          blockIndex = (blockIndex + 1) % n
        }
        stepReturn = logReturns[blockIndex]!
      } else {
        // iid bootstrap: resample one observed log return.
        stepReturn = logReturns[Math.floor(rand() * n)]!
      }
      wealth *= Math.exp(stepReturn)
      if (wealth > peak) peak = wealth
      else underwaterSteps += 1
      const dd = peak > 0 ? (peak - wealth) / peak : 0
      if (dd > maxDd) maxDd = dd
      if (!hitRuin && wealth <= ruinLevel) hitRuin = true
      if (targetLevel !== null && !hitTarget && wealth >= targetLevel) {
        hitTarget = true
      }
      keepPath?.push(wealth)
      if (fanColumn) fanColumns[step + 1]![index] = wealth
    }

    finals[index] = wealth
    maxDrawdowns[index] = maxDd
    underwaterFractions[index] = underwaterSteps / horizon
    if (hitRuin) ruined += 1
    if (hitTarget) reachedTarget += 1
    if (keepPath) spaghetti.push(keepPath)

    if (antithetic) {
      pendingInnovations = negate ? null : Float64Array.from(innovationBuffer!)
    }
  }

  return {
    total: paths,
    get done() {
      return done
    },
    runChunk(count: number): number {
      const end = Math.min(paths, done + Math.max(1, count))
      for (; done < end; done += 1) runPath(done)
      return done
    },
    finalize(): SimulationSummary {
      this.runChunk(paths - done)

      const [p05, p25, p50, p75, p95] = quantilesOf(finals, [0.05, 0.25, 0.5, 0.75, 0.95])
      const [ddMedian, ddP95] = quantilesOf(maxDrawdowns, [0.5, 0.95])
      const [tuwMedian, tuwP95] = quantilesOf(underwaterFractions, [0.5, 0.95])

      let sum = 0
      let below = 0
      let worstDd = 0
      for (let i = 0; i < paths; i += 1) {
        sum += finals[i]!
        if (finals[i]! < startValue) below += 1
        if (maxDrawdowns[i]! > worstDd) worstDd = maxDrawdowns[i]!
      }

      const terminalReturns = Array.from(finals, (w) => w / startValue - 1)

      const fan = FAN_PERCENTILES.map(() => new Array<number>(horizon + 1))
      for (let step = 0; step <= horizon; step += 1) {
        const bands = quantilesOf(fanColumns[step]!, FAN_PERCENTILES)
        for (let i = 0; i < FAN_PERCENTILES.length; i += 1) {
          fan[i]![step] = bands[i]!
        }
      }

      return {
        mode,
        paths,
        horizon,
        seed,
        antithetic,
        startValue,
        drift,
        sigma,
        blockLength,
        nu,
        terminal: {
          p05: p05!,
          p25: p25!,
          p50: p50!,
          p75: p75!,
          p95: p95!,
          mean: sum / paths,
          probLoss: below / paths,
          probTarget: targetLevel === null ? null : reachedTarget / paths,
        },
        horizonVar95: historicalVar(terminalReturns, 0.95),
        horizonCvar95: historicalCVar(terminalReturns, 0.95),
        maxDrawdown: { median: ddMedian!, p95: ddP95!, worst: worstDd },
        timeUnderWater: { median: tuwMedian!, p95: tuwP95! },
        ruinProbability: ruined / paths,
        fanPercentiles: FAN_PERCENTILES,
        fan,
        fanSampleSize,
        samplePaths: spaghetti,
        ...(input.collectTerminals ? { terminals: finals, maxDrawdowns } : {}),
      }
    },
  }
}

/** Convenience wrapper: run every path at once and summarise. */
export function simulate(input: SimulateInput): SimulationSummary {
  return createSimulation(input).finalize()
}

/**
 * Map a trade R-multiple list to per-trade log returns at a given risk
 * fraction: r = log(1 + f*R), with the growth factor floored at 1e-6 so a
 * worse-than-total-loss trade caps at -100% instead of producing NaN.
 * Feeding the result to "iid" mode turns the engine into a trade-sequence
 * bootstrap: each simulated step is one resampled trade.
 */
export function tradeLogReturns(rMultiples: readonly number[], riskFraction: number): number[] {
  if (!(riskFraction > 0)) {
    throw new Error(`riskFraction must be positive, got ${riskFraction}.`)
  }
  return rMultiples.map((r) => Math.log(Math.max(1e-6, 1 + riskFraction * r)))
}
