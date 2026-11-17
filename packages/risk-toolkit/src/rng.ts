/**
 * Deterministic pseudo-random generators. Monte Carlo runs must be reproducible
 * so the same inputs always give the same risk numbers - a requirement for a
 * decision-support tool.
 */

/** mulberry32: a small, fast, seedable uniform [0, 1) generator. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return function next(): number {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Standard-normal sampler (Box-Muller) driven by a uniform generator. */
export function normalSampler(uniform: () => number): () => number {
  return function next(): number {
    let u = 0
    let v = 0
    while (u === 0) u = uniform()
    while (v === 0) v = uniform()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
}
