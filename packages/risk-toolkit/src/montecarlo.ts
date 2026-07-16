import { mulberry32 } from "./rng";
import { quantile } from "./stats";

export interface MonteCarloInput {
  startEquity: number;
  trials: number;
  tradesPerTrial: number;
  /** Probability a trade wins, 0..1. */
  winRate: number;
  /** Fractional return of a winning trade, e.g. 0.02 for +2%. */
  winReturn: number;
  /** Fractional return of a losing trade, e.g. -0.01 for -1%. */
  lossReturn: number;
  /** Equity fraction that counts as ruin (default 0.5 = down 50%). */
  ruinFraction?: number;
  /** Seed for reproducibility (default 1). */
  seed?: number;
  /** How many full equity paths to return for plotting (default 0). */
  samplePaths?: number;
}

export interface MonteCarloResult {
  trials: number;
  finalEquity: {
    p05: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
    mean: number;
  };
  maxDrawdown: { median: number; p95: number; worst: number };
  /** Fraction of trials that touched the ruin level at any point. */
  ruinProbability: number;
  /** A handful of equity paths for plotting (empty unless requested). */
  paths: number[][];
}

/**
 * Monte Carlo of an equity curve under fixed per-trade win/loss returns.
 * Answers "will this sizing scheme blow up my account?" by reporting the
 * distribution of final equity, the drawdown distribution, and the probability
 * of touching a ruin level. Seeded, so results are reproducible.
 */
export function monteCarloDrawdown(input: MonteCarloInput): MonteCarloResult {
  const {
    startEquity,
    trials,
    tradesPerTrial,
    winRate,
    winReturn,
    lossReturn,
  } = input;
  const ruinFraction = input.ruinFraction ?? 0.5;
  const samplePaths = input.samplePaths ?? 0;
  const rand = mulberry32(input.seed ?? 1);
  const ruinLevel = startEquity * ruinFraction;

  const finals: number[] = new Array(trials);
  const maxDrawdowns: number[] = new Array(trials);
  const paths: number[][] = [];
  let ruined = 0;

  for (let trial = 0; trial < trials; trial += 1) {
    let equity = startEquity;
    let peak = startEquity;
    let maxDd = 0;
    let hitRuin = false;
    const path = trial < samplePaths ? [startEquity] : null;

    for (let k = 0; k < tradesPerTrial; k += 1) {
      const r = rand() < winRate ? winReturn : lossReturn;
      equity *= 1 + r;
      if (equity > peak) peak = equity;
      const dd = peak > 0 ? (peak - equity) / peak : 0;
      if (dd > maxDd) maxDd = dd;
      if (!hitRuin && equity <= ruinLevel) hitRuin = true;
      path?.push(equity);
    }

    if (hitRuin) ruined += 1;
    finals[trial] = equity;
    maxDrawdowns[trial] = maxDd;
    if (path) paths.push(path);
  }

  return {
    trials,
    finalEquity: {
      p05: quantile(finals, 0.05),
      p25: quantile(finals, 0.25),
      p50: quantile(finals, 0.5),
      p75: quantile(finals, 0.75),
      p95: quantile(finals, 0.95),
      mean: finals.reduce((a, b) => a + b, 0) / trials,
    },
    maxDrawdown: {
      median: quantile(maxDrawdowns, 0.5),
      p95: quantile(maxDrawdowns, 0.95),
      worst: Math.max(...maxDrawdowns),
    },
    ruinProbability: ruined / trials,
    paths,
  };
}
