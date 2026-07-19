import { describe, expect, it } from "vitest";

import {
  createSimulation,
  logReturns as toLogReturns,
  mean,
  mulberry32,
  normalSampler,
  simulate,
  stdev,
} from "../src";

/**
 * Deterministic synthetic daily log returns: N(0.0004, 0.01)-ish via the
 * toolkit's own seeded sampler, so every test sees the same input series.
 */
function syntheticReturns(n: number, seed = 99): number[] {
  const normal = normalSampler(mulberry32(seed));
  return Array.from({ length: n }, () => 0.0004 + 0.01 * normal());
}

const RETURNS = syntheticReturns(500);

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
    } as const;

    const whole = simulate(input);
    const chunked = createSimulation(input);
    while (chunked.done < chunked.total) chunked.runChunk(7);
    const viaChunks = chunked.finalize();

    expect(viaChunks.terminal).toEqual(whole.terminal);
    expect(viaChunks.maxDrawdown).toEqual(whole.maxDrawdown);
    expect(viaChunks.fan).toEqual(whole.fan);
    expect(viaChunks.samplePaths).toEqual(whole.samplePaths);
  });

  it("matches GBM closed-form moments of terminal log wealth", () => {
    const drift = mean(RETURNS);
    const sigma = stdev(RETURNS, 1);
    const horizon = 100;
    const paths = 20000;

    const summary = simulate({
      logReturns: RETURNS,
      mode: "gbm",
      horizon,
      paths,
      seed: 7,
      collectTerminals: true,
    });

    const logTerminals = Array.from(summary.terminals!, (w) => Math.log(w));
    const logMean = mean(logTerminals);
    const logVariance = stdev(logTerminals, 1) ** 2;

    // E[log W_H] = drift*H, Var = sigma^2*H; 4-standard-error tolerances.
    const meanTolerance = (4 * sigma * Math.sqrt(horizon)) / Math.sqrt(paths);
    expect(Math.abs(logMean - drift * horizon)).toBeLessThan(meanTolerance);
    const varTolerance = 4 * Math.sqrt(2 / (paths - 1)) * sigma ** 2 * horizon;
    expect(Math.abs(logVariance - sigma ** 2 * horizon)).toBeLessThan(
      varTolerance,
    );
  });

  it("iid bootstrap converges to the sample mean log return", () => {
    const horizon = 50;
    const paths = 10000;
    const summary = simulate({
      logReturns: RETURNS,
      mode: "iid",
      horizon,
      paths,
      seed: 11,
      collectTerminals: true,
    });

    const perStep =
      mean(Array.from(summary.terminals!, (w) => Math.log(w))) / horizon;
    const sigma = stdev(RETURNS, 1);
    const tolerance = (4 * sigma) / Math.sqrt(paths * horizon);
    expect(Math.abs(perStep - mean(RETURNS))).toBeLessThan(tolerance);
  });

  it("antithetic pairing reduces the variance of the terminal-mean estimator", () => {
    const config = {
      logReturns: RETURNS,
      mode: "gbm",
      horizon: 50,
      paths: 4000,
    } as const;

    const meansPlain: number[] = [];
    const meansAntithetic: number[] = [];
    for (let seed = 1; seed <= 10; seed += 1) {
      meansPlain.push(simulate({ ...config, seed }).terminal.mean);
      meansAntithetic.push(
        simulate({ ...config, seed, antithetic: true }).terminal.mean,
      );
    }

    const varianceOf = (xs: number[]) => stdev(xs, 1) ** 2;
    expect(varianceOf(meansAntithetic)).toBeLessThan(varianceOf(meansPlain));
  });

  it("reports coherent metrics: ordered percentiles, valid probabilities, fan shape", () => {
    const horizon = 30;
    const summary = simulate({
      logReturns: RETURNS,
      mode: "iid",
      horizon,
      paths: 2000,
      seed: 5,
      startValue: 1000,
      targetMultiple: 1.1,
      samplePaths: 8,
    });

    const { p05, p25, p50, p75, p95, probLoss, probTarget } = summary.terminal;
    expect(p05).toBeLessThanOrEqual(p25);
    expect(p25).toBeLessThanOrEqual(p50);
    expect(p50).toBeLessThanOrEqual(p75);
    expect(p75).toBeLessThanOrEqual(p95);
    expect(probLoss).toBeGreaterThanOrEqual(0);
    expect(probLoss).toBeLessThanOrEqual(1);
    expect(probTarget).not.toBeNull();
    expect(probTarget!).toBeGreaterThanOrEqual(0);
    expect(probTarget!).toBeLessThanOrEqual(1);

    expect(summary.fan).toHaveLength(5);
    for (const band of summary.fan) expect(band).toHaveLength(horizon + 1);
    // Every band starts at the start value and stays ordered per step.
    for (const band of summary.fan) expect(band[0]).toBe(1000);
    for (let t = 0; t <= horizon; t += 1) {
      for (let i = 1; i < summary.fan.length; i += 1) {
        expect(summary.fan[i]![t]!).toBeGreaterThanOrEqual(
          summary.fan[i - 1]![t]!,
        );
      }
    }

    expect(summary.samplePaths).toHaveLength(8);
    expect(summary.samplePaths[0]).toHaveLength(horizon + 1);
    expect(summary.horizonVar95).toBeGreaterThanOrEqual(-summary.terminal.p95);
    expect(summary.timeUnderWater.median).toBeGreaterThanOrEqual(0);
    expect(summary.timeUnderWater.median).toBeLessThanOrEqual(1);
  });

  it("computes log returns from prices for the real pipeline", () => {
    // Sanity-check the toolkit pipeline the UI will use: prices -> log
    // returns -> simulate.
    const prices = [100, 101, 100.5, 102, 103, 101.5, 104];
    const rs = toLogReturns(prices);
    const summary = simulate({
      logReturns: rs,
      mode: "iid",
      horizon: 5,
      paths: 100,
      seed: 3,
      startValue: prices[prices.length - 1]!,
    });
    expect(summary.startValue).toBe(104);
    expect(summary.terminal.p50).toBeGreaterThan(0);
  });

  it("golden seeds: same seed + same params = same published numbers", () => {
    const gbm = simulate({
      logReturns: RETURNS,
      mode: "gbm",
      horizon: 20,
      paths: 1000,
      seed: 42,
    });
    const iid = simulate({
      logReturns: RETURNS,
      mode: "iid",
      horizon: 20,
      paths: 1000,
      seed: 42,
    });

    // Captured from the engine at MC1; a change here is a contract break.
    expect(gbm.terminal.p50).toMatchInlineSnapshot(`1.0196809886031337`);
    expect(gbm.maxDrawdown.median).toMatchInlineSnapshot(`0.03201816145304112`);
    expect(iid.terminal.p50).toMatchInlineSnapshot(`1.0167265258808418`);
    expect(iid.maxDrawdown.median).toMatchInlineSnapshot(`0.0323603540438482`);
  });
});
