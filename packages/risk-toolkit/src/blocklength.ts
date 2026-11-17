/**
 * Automatic block-length selection for block bootstraps: the Politis-White
 * (2004) selector with the Patton-Politis-White (2009) correction, in which
 * the stationary-bootstrap constant is D_SB = 2 * g(0)^2. Ported from the
 * arch library's `optimal_block_length` (the reference implementation the
 * research doc names), verified against it line by line on 2026-07-20:
 *
 *   - lag window: kn = max(5, log10(n)); m_max = ceil(sqrt(n)) + kn;
 *     critical value cv = 2 * sqrt(log10(n) / n); opt_m is the first lag
 *     followed by kn consecutive insignificant autocorrelations, and
 *     m = min(2 * max(opt_m, 1), m_max) (m_max when none qualifies)
 *   - flat-top kernel lambda(k/m) = 1 for k/m <= 1/2, else 2 * (1 - k/m)
 *   - g = sum over k of 2 * lambda * k * acv[k];
 *     g0 = acv[0] + sum of 2 * lambda * acv[k]  (the long-run variance)
 *   - B_SB = (2 * g^2 / (2 * g0^2))^(1/3) * n^(1/3), capped at
 *     b_max = ceil(min(3 * sqrt(n), n / 3))
 *
 * Sanity anchor (verified analytically): for AR(1) with rho = 0.7 the
 * theoretical optimum is ~1.9606 * n^(1/3), i.e. ~11.5 at n = 200 and
 * ~18.2 at n = 800 - the published examples.
 */

export interface BlockLengthEstimate {
  /** Optimal expected block length for the stationary bootstrap. */
  stationary: number
  /** Optimal block length for the circular block bootstrap. */
  circular: number
  /** The lag-window parameter m the estimate used. */
  m: number
}

export function optimalBlockLength(series: readonly number[]): BlockLengthEstimate {
  const n = series.length
  if (n < 20) {
    // Too short for the lag-window machinery; fall back to sqrt-length.
    const fallback = Math.max(1, Math.round(Math.sqrt(Math.max(1, n))))
    return { stationary: fallback, circular: fallback, m: 0 }
  }

  const seriesMean = series.reduce((a, b) => a + b, 0) / n
  const eps = series.map((x) => x - seriesMean)

  const bMax = Math.ceil(Math.min(3 * Math.sqrt(n), n / 3))
  const kn = Math.max(5, Math.floor(Math.log10(n)))
  const mMax = Math.ceil(Math.sqrt(n)) + kn
  const cv = 2 * Math.sqrt(Math.log10(n) / n)

  const acv = new Float64Array(mMax + 1)
  const absAcorr = new Float64Array(mMax + 1)
  let optM: number | null = null

  for (let i = 0; i <= mMax; i += 1) {
    let v1 = 0
    for (let t = i + 1; t < n; t += 1) v1 += eps[t]! * eps[t]!
    let v2 = 0
    for (let t = 0; t < n - i - 1; t += 1) v2 += eps[t]! * eps[t]!
    let cross = 0
    for (let t = i; t < n; t += 1) cross += eps[t]! * eps[t - i]!
    acv[i] = cross / n
    absAcorr[i] = v1 > 0 && v2 > 0 ? Math.abs(cross) / Math.sqrt(v1 * v2) : 0

    if (i >= kn && optM === null) {
      let allBelow = true
      for (let k = i - kn; k < i; k += 1) {
        if (absAcorr[k]! >= cv) {
          allBelow = false
          break
        }
      }
      if (allBelow) optM = i - kn
    }
  }

  const m = Math.min(optM !== null ? 2 * Math.max(optM, 1) : mMax, mMax)

  let g = 0
  let g0 = acv[0]!
  for (let k = 1; k <= m; k += 1) {
    const ratio = k / m
    const lam = ratio <= 0.5 ? 1 : 2 * (1 - ratio)
    g += 2 * lam * k * acv[k]!
    g0 += 2 * lam * acv[k]!
  }

  const dSb = 2 * g0 * g0
  const dCb = (4 / 3) * g0 * g0
  const nCbrt = Math.cbrt(n)
  const rawSb = dSb > 0 ? Math.cbrt((2 * g * g) / dSb) * nCbrt : 1
  const rawCb = dCb > 0 ? Math.cbrt((2 * g * g) / dCb) * nCbrt : 1

  return {
    stationary: Math.min(Math.max(1, rawSb), bMax),
    circular: Math.min(Math.max(1, rawCb), bMax),
    m,
  }
}
