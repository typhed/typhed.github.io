import { mean } from "./stats";

/**
 * Covariance matrix of several assets' return series. Each inner array is one
 * asset's returns; all must be the same length and time-aligned.
 */
export function covarianceMatrix(
  assetReturns: readonly (readonly number[])[],
  ddof = 1,
): number[][] {
  const k = assetReturns.length;
  const means = assetReturns.map((r) => mean(r));
  const n = k > 0 ? assetReturns[0]!.length : 0;

  const cov: number[][] = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let i = 0; i < k; i += 1) {
    for (let j = i; j < k; j += 1) {
      let sum = 0;
      for (let t = 0; t < n; t += 1) {
        sum +=
          (assetReturns[i]![t]! - means[i]!) * (assetReturns[j]![t]! - means[j]!);
      }
      const value = sum / (n - ddof);
      cov[i]![j] = value;
      cov[j]![i] = value;
    }
  }
  return cov;
}

/** Correlation matrix derived from the covariance matrix. */
export function correlationMatrix(
  assetReturns: readonly (readonly number[])[],
): number[][] {
  const cov = covarianceMatrix(assetReturns);
  const k = cov.length;
  const sd = cov.map((row, i) => Math.sqrt(row[i]!));

  const corr: number[][] = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let i = 0; i < k; i += 1) {
    for (let j = 0; j < k; j += 1) {
      const denom = sd[i]! * sd[j]!;
      corr[i]![j] = denom === 0 ? 0 : cov[i]![j]! / denom;
    }
  }
  return corr;
}

/** Portfolio variance = wᵀ Σ w. */
export function portfolioVariance(
  weights: readonly number[],
  cov: readonly (readonly number[])[],
): number {
  const k = weights.length;
  let total = 0;
  for (let i = 0; i < k; i += 1) {
    for (let j = 0; j < k; j += 1) {
      total += weights[i]! * weights[j]! * cov[i]![j]!;
    }
  }
  return total;
}

export function portfolioVolatility(
  weights: readonly number[],
  cov: readonly (readonly number[])[],
): number {
  return Math.sqrt(portfolioVariance(weights, cov));
}

/**
 * Diversification ratio: the weighted average of individual volatilities
 * divided by the portfolio volatility. 1 means no diversification benefit;
 * higher is better.
 */
export function diversificationRatio(
  weights: readonly number[],
  cov: readonly (readonly number[])[],
): number {
  const k = weights.length;
  let weightedVol = 0;
  for (let i = 0; i < k; i += 1) {
    weightedVol += weights[i]! * Math.sqrt(cov[i]![i]!);
  }
  const portVol = portfolioVolatility(weights, cov);
  return portVol === 0 ? 0 : weightedVol / portVol;
}
