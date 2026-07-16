import { describe, expect, it } from "vitest";

import { atrPositionSize, fixedFractionalSize } from "../src";

describe("fixedFractionalSize", () => {
  it("sizes from the risk budget and stop distance", () => {
    const result = fixedFractionalSize({
      accountEquity: 100000,
      riskPercent: 1,
      entry: 50,
      stop: 48,
    });
    expect(result.riskAmount).toBe(1000);
    expect(result.riskPerUnit).toBe(2);
    expect(result.quantity).toBe(500);
    expect(result.positionValue).toBe(25000);
    expect(result.positionPercent).toBeCloseTo(25, 10);
  });

  it("floors to whole units", () => {
    const result = fixedFractionalSize({
      accountEquity: 10000,
      riskPercent: 1,
      entry: 100,
      stop: 97,
    });
    // riskAmount 100 / riskPerUnit 3 = 33.33 -> 33
    expect(result.quantity).toBe(33);
  });

  it("returns zero quantity when the stop equals entry", () => {
    const result = fixedFractionalSize({
      accountEquity: 100000,
      riskPercent: 1,
      entry: 50,
      stop: 50,
    });
    expect(result.quantity).toBe(0);
  });
});

describe("atrPositionSize", () => {
  it("places a long stop below entry and sizes to the ATR risk", () => {
    const result = atrPositionSize({
      accountEquity: 100000,
      riskPercent: 1,
      entry: 100,
      atr: 2,
      atrMultiple: 2,
      direction: "long",
    });
    expect(result.riskPerUnit).toBe(4);
    expect(result.stop).toBe(96);
    expect(result.quantity).toBe(250);
  });

  it("places a short stop above entry", () => {
    const result = atrPositionSize({
      accountEquity: 100000,
      riskPercent: 1,
      entry: 100,
      atr: 2,
      atrMultiple: 2,
      direction: "short",
    });
    expect(result.stop).toBe(104);
    expect(result.quantity).toBe(250);
  });
});
