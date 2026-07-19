import { mulberry32, normalSampler } from "./rng";
import { historicalCVar, historicalVar } from "./risk";
import { mean, stdev } from "./stats";

/**
 * Data-driven Monte Carlo engine (v2). Unlike `monteCarloDrawdown`, which
 * simulates from hand-typed win/loss parameters, every mode here simulates
 * from the uploaded series' own log returns:
 *
 *   - "iid": resample the log returns with replacement. Distribution-free
 *     and transparent, but destroys serial dependence (vol clustering).
 *   - "gbm": fit drift and sigma to the log returns and simulate normal
 *     increments. Closed-form moments make it the unit-test anchor: with
 *     drift = mean log return, E[log W_H] = drift*H and Var = sigma^2*H.
 *
 * The engine is chunk-driven so a worker can post progress and stay
 * cancellable, and deterministic: same seed + same params = same result,
 * regardless of chunk sizes (the RNG stream lives in the simulation
 * closure). Antithetic pairing (Z, -Z) applies to parametric modes only -
 * resampling modes have no Z to mirror, so the flag is ignored there.
 */

export type DataDrivenMode = "iid" | "gbm";

export interface SimulateInput {
  /** Log returns of the uploaded series, one per bar. */
  logReturns: readonly number[];
  mode: DataDrivenMode;
  /** Steps (bars) to simulate forward. */
  horizon: number;
  /** Number of simulated paths. */
  paths: number;
  /** RNG seed (default 1). Same seed + same params = same result. */
  seed?: number;
  /** Pair each Z path with -Z (parametric modes only; default false). */
  antithetic?: boolean;
  /** Starting wealth, e.g. the last close (default 1). */
  startValue?: number;
  /** Fraction of start value that counts as ruin (default 0.5). */
  ruinFraction?: number;
  /** Wealth multiple that counts as "target reached" (optional). */
  targetMultiple?: number;
  /** Full equity paths to keep for spaghetti display (default 0). */
  samplePaths?: number;
  /** Also return the raw terminal-wealth array (default false). */
  collectTerminals?: boolean;
}

export interface SimulationSummary {
  mode: DataDrivenMode;
  paths: number;
  horizon: number;
  seed: number;
  antithetic: boolean;
  startValue: number;
  /** Fitted per-step drift (mean log return) and sigma of the input. */
  drift: number;
  sigma: number;
  terminal: {
    p05: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
    mean: number;
    /** Fraction of paths ending below the start value. */
    probLoss: number;
    /** Fraction of paths reaching the target multiple (null if unset). */
    probTarget: number | null;
  };
  /** Horizon VaR/CVaR at 95%, positive loss fractions of start value. */
  horizonVar95: number;
  horizonCvar95: number;
  maxDrawdown: { median: number; p95: number; worst: number };
  /** Fraction of steps spent below the running peak, per path. */
  timeUnderWater: { median: number; p95: number };
  /** Fraction of paths that touched the ruin level at any point. */
  ruinProbability: number;
  /** Per-step wealth percentile bands for the fan chart. */
  fanPercentiles: readonly number[];
  /** fan[i][t] = wealth at step t for fanPercentiles[i]; length horizon+1. */
  fan: number[][];
  /** Paths actually sampled for the fan bands (memory-bounded). */
  fanSampleSize: number;
  samplePaths: number[][];
  /** Raw terminal wealth per path (present when collectTerminals). */
  terminals?: Float64Array;
}

export interface Simulation {
  /** Total paths this run will produce. */
  readonly total: number;
  /** Paths completed so far. */
  readonly done: number;
  /** Run up to `count` more paths; returns paths completed so far. */
  runChunk(count: number): number;
  /** Finish (runs any remainder) and compute the summary. */
  finalize(): SimulationSummary;
}

export const FAN_PERCENTILES = [0.05, 0.25, 0.5, 0.75, 0.95] as const;

/**
 * Fan bands are computed from a bounded sample of path columns, so 100k-path
 * runs stay inside a fixed memory budget while terminal statistics still use
 * every path (documented design; see the research doc's worker section).
 */
const FAN_SAMPLE_LIMIT = 2000;

/** All percentiles of one unsorted sample, sorting it once. */
function quantilesOf(values: Float64Array, qs: readonly number[]): number[] {
  const sorted = Float64Array.from(values).sort();
  const n = sorted.length;
  return qs.map((q) => {
    if (n === 0) return Number.NaN;
    if (n === 1) return sorted[0]!;
    const pos = (n - 1) * q;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
  });
}

export function createSimulation(input: SimulateInput): Simulation {
  const { logReturns, mode, horizon, paths } = input;
  if (logReturns.length < 2) {
    throw new Error("Monte Carlo needs at least 2 log returns to fit.");
  }
  if (!Number.isInteger(horizon) || horizon < 1) {
    throw new Error(`horizon must be a positive integer, got ${horizon}.`);
  }
  if (!Number.isInteger(paths) || paths < 1) {
    throw new Error(`paths must be a positive integer, got ${paths}.`);
  }

  const seed = input.seed ?? 1;
  const startValue = input.startValue ?? 1;
  const ruinFraction = input.ruinFraction ?? 0.5;
  const targetMultiple = input.targetMultiple;
  const sampleCount = input.samplePaths ?? 0;
  const antithetic = (input.antithetic ?? false) && mode === "gbm";

  const drift = mean(logReturns);
  const sigma = stdev(logReturns, 1);

  const rand = mulberry32(seed);
  const nextNormal = normalSampler(rand);
  const n = logReturns.length;
  const ruinLevel = startValue * ruinFraction;
  const targetLevel =
    targetMultiple === undefined ? null : startValue * targetMultiple;

  const finals = new Float64Array(paths);
  const maxDrawdowns = new Float64Array(paths);
  const underwaterFractions = new Float64Array(paths);
  const spaghetti: number[][] = [];
  let ruined = 0;
  let reachedTarget = 0;

  const fanSampleSize = Math.min(paths, FAN_SAMPLE_LIMIT);
  // fanColumns[t] holds wealth at step t for the first fanSampleSize paths.
  const fanColumns: Float64Array[] = Array.from(
    { length: horizon + 1 },
    () => new Float64Array(fanSampleSize),
  );

  // Antithetic state: the Z vector of the previous path, to be negated.
  let pendingZ: Float64Array | null = null;
  const zBuffer = antithetic ? new Float64Array(horizon) : null;

  let done = 0;

  function nextStepReturn(step: number, negate: boolean): number {
    if (mode === "gbm") {
      let z: number;
      if (negate) {
        z = -pendingZ![step]!;
      } else {
        z = nextNormal();
        if (zBuffer) zBuffer[step] = z;
      }
      return drift + sigma * z;
    }
    // iid bootstrap: resample one observed log return.
    return logReturns[Math.floor(rand() * n)]!;
  }

  function runPath(index: number): void {
    const negate = antithetic && pendingZ !== null;
    let wealth = startValue;
    let peak = startValue;
    let maxDd = 0;
    let underwaterSteps = 0;
    let hitRuin = false;
    let hitTarget = false;
    const keepPath = index < sampleCount ? [startValue] : null;
    const fanColumn = index < fanSampleSize;
    if (fanColumn) fanColumns[0]![index] = startValue;

    for (let step = 0; step < horizon; step += 1) {
      wealth *= Math.exp(nextStepReturn(step, negate));
      if (wealth > peak) peak = wealth;
      else underwaterSteps += 1;
      const dd = peak > 0 ? (peak - wealth) / peak : 0;
      if (dd > maxDd) maxDd = dd;
      if (!hitRuin && wealth <= ruinLevel) hitRuin = true;
      if (targetLevel !== null && !hitTarget && wealth >= targetLevel) {
        hitTarget = true;
      }
      keepPath?.push(wealth);
      if (fanColumn) fanColumns[step + 1]![index] = wealth;
    }

    finals[index] = wealth;
    maxDrawdowns[index] = maxDd;
    underwaterFractions[index] = underwaterSteps / horizon;
    if (hitRuin) ruined += 1;
    if (hitTarget) reachedTarget += 1;
    if (keepPath) spaghetti.push(keepPath);

    if (antithetic) {
      pendingZ = negate ? null : Float64Array.from(zBuffer!);
    }
  }

  return {
    total: paths,
    get done() {
      return done;
    },
    runChunk(count: number): number {
      const end = Math.min(paths, done + Math.max(1, count));
      for (; done < end; done += 1) runPath(done);
      return done;
    },
    finalize(): SimulationSummary {
      this.runChunk(paths - done);

      const [p05, p25, p50, p75, p95] = quantilesOf(finals, [
        0.05, 0.25, 0.5, 0.75, 0.95,
      ]);
      const [ddMedian, ddP95] = quantilesOf(maxDrawdowns, [0.5, 0.95]);
      const [tuwMedian, tuwP95] = quantilesOf(underwaterFractions, [0.5, 0.95]);

      let sum = 0;
      let below = 0;
      let worstDd = 0;
      for (let i = 0; i < paths; i += 1) {
        sum += finals[i]!;
        if (finals[i]! < startValue) below += 1;
        if (maxDrawdowns[i]! > worstDd) worstDd = maxDrawdowns[i]!;
      }

      const terminalReturns = Array.from(
        finals,
        (w) => w / startValue - 1,
      );

      const fan = FAN_PERCENTILES.map(() => new Array<number>(horizon + 1));
      for (let step = 0; step <= horizon; step += 1) {
        const bands = quantilesOf(fanColumns[step]!, FAN_PERCENTILES);
        for (let i = 0; i < FAN_PERCENTILES.length; i += 1) {
          fan[i]![step] = bands[i]!;
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
        ...(input.collectTerminals ? { terminals: finals } : {}),
      };
    },
  };
}

/** Convenience wrapper: run every path at once and summarise. */
export function simulate(input: SimulateInput): SimulationSummary {
  return createSimulation(input).finalize();
}
