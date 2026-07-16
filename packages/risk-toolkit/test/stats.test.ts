import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  annualizedVolatility,
  correlationMatrix,
  covarianceMatrix,
  diversificationRatio,
  historicalCVar,
  historicalVar,
  maxDrawdown,
  mean,
  parametricVar,
  portfolioVolatility,
  simpleReturns,
  stdev,
} from "../src";

interface Expected {
  periods_per_year: number;
  confidence: number;
  mean_a: number;
  std_a: number;
  annualized_vol_a: number;
  hist_var_95_a: number;
  hist_cvar_95_a: number;
  parametric_var_95_a: number;
  max_drawdown_a: number;
  correlation_ab: number;
  covariance: number[][];
  portfolio_vol_5050: number;
  diversification_ratio_5050: number;
}

function loadPrices(): { a: number[]; b: number[] } {
  const text = readFileSync(new URL("./fixtures/prices.csv", import.meta.url), "utf8").trim();
  const lines = text.split(/\r?\n/).slice(1);
  const a: number[] = [];
  const b: number[] = [];
  for (const line of lines) {
    const [x, y] = line.split(",");
    a.push(Number(x));
    b.push(Number(y));
  }
  return { a, b };
}

const expected = JSON.parse(
  readFileSync(new URL("./fixtures/expected_stats.json", import.meta.url), "utf8"),
) as Expected;

const { a, b } = loadPrices();
const ra = simpleReturns(a);
const rb = simpleReturns(b);

describe("risk statistics vs numpy/scipy golden fixtures", () => {
  it("matches mean, sample stdev and annualised volatility", () => {
    expect(mean(ra)).toBeCloseTo(expected.mean_a, 10);
    expect(stdev(ra, 1)).toBeCloseTo(expected.std_a, 10);
    expect(annualizedVolatility(ra, expected.periods_per_year)).toBeCloseTo(
      expected.annualized_vol_a,
      10,
    );
  });

  it("matches historical VaR, CVaR and parametric VaR at 95%", () => {
    expect(historicalVar(ra, 0.95)).toBeCloseTo(expected.hist_var_95_a, 10);
    expect(historicalCVar(ra, 0.95)).toBeCloseTo(expected.hist_cvar_95_a, 10);
    expect(parametricVar(ra, 0.95)).toBeCloseTo(expected.parametric_var_95_a, 6);
  });

  it("matches maximum drawdown", () => {
    expect(maxDrawdown(a).maxDrawdown).toBeCloseTo(expected.max_drawdown_a, 10);
  });

  it("matches correlation and covariance", () => {
    const corr = correlationMatrix([ra, rb]);
    expect(corr[0]![1]).toBeCloseTo(expected.correlation_ab, 10);

    const cov = covarianceMatrix([ra, rb]);
    for (let i = 0; i < 2; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        expect(cov[i]![j]).toBeCloseTo(expected.covariance[i]![j]!, 12);
      }
    }
  });

  it("matches portfolio volatility and diversification ratio", () => {
    const cov = covarianceMatrix([ra, rb]);
    expect(portfolioVolatility([0.5, 0.5], cov)).toBeCloseTo(
      expected.portfolio_vol_5050,
      10,
    );
    expect(diversificationRatio([0.5, 0.5], cov)).toBeCloseTo(
      expected.diversification_ratio_5050,
      10,
    );
  });
});
