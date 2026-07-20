import { describe, expect, it } from "vitest";

import { mulberry32, normalSampler, optimalBlockLength } from "../src";

/** Seeded AR(1): x_t = rho * x_{t-1} + eps_t with unit-variance normals. */
function ar1Series(n: number, rho: number, seed: number): number[] {
  const normal = normalSampler(mulberry32(seed));
  const out: number[] = new Array(n);
  let x = 0;
  for (let i = 0; i < n; i += 1) {
    x = rho * x + normal();
    out[i] = x;
  }
  return out;
}

describe("optimalBlockLength (Patton-Politis-White)", () => {
  it("reproduces the published AR(1) examples from true autocovariances", () => {
    // The formula anchor: with the true AR(1) autocovariances (per unit
    // variance, no taper), G = 2*rho/(1-rho)^2 and g(0) = (1+rho)/(1-rho),
    // so B_SB = cbrt(G^2/g0^2) * cbrt(N). For rho = 0.7 that is
    // ~1.9606 * N^(1/3): ~11.5 at N = 200 and ~18.2 at N = 800 - the
    // published examples the research doc cites, re-derived exactly.
    const rho = 0.7;
    const G = (2 * rho) / (1 - rho) ** 2;
    const g0 = (1 + rho) / (1 - rho);
    const constant = Math.cbrt((G / g0) ** 2);

    expect(constant * Math.cbrt(200)).toBeCloseTo(11.47, 1);
    expect(constant * Math.cbrt(800)).toBeCloseTo(18.2, 1);
  });

  it("estimates near the theoretical optimum on simulated AR(1) data", () => {
    const n = 10000;
    const theoretical = 1.9606 * Math.cbrt(n); // ~42.2
    const estimate = optimalBlockLength(ar1Series(n, 0.7, 7)).stationary;
    expect(estimate).toBeGreaterThan(theoretical * 0.7);
    expect(estimate).toBeLessThan(theoretical * 1.3);
  });

  it("keeps the fixed stationary/circular ratio of the two D constants", () => {
    // b_cb / b_sb = cbrt(d_sb / d_cb) = cbrt(2 / (4/3)) = cbrt(1.5).
    const estimate = optimalBlockLength(ar1Series(4000, 0.5, 3));
    expect(estimate.circular / estimate.stationary).toBeCloseTo(
      Math.cbrt(1.5),
      6,
    );
  });

  it("chooses short blocks for white noise", () => {
    const normal = normalSampler(mulberry32(21));
    const noise = Array.from({ length: 5000 }, () => normal());
    expect(optimalBlockLength(noise).stationary).toBeLessThan(5);
  });

  it("falls back to sqrt-length for very short series", () => {
    const estimate = optimalBlockLength([1, 2, 1, 3, 2, 1, 2, 3, 1]);
    expect(estimate.stationary).toBe(3);
    expect(estimate.m).toBe(0);
  });
});
