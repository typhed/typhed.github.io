import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { autoDetectMapping, bollinger, buildDataset, ema, macd, parseCsv, rsi, sma } from "../src"

function loadText(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8")
}

interface Expected {
  sma20: Array<{ time: number; value: number }>
  ema20: Array<{ time: number; value: number }>
  bollinger20: Array<{ time: number; middle: number; upper: number; lower: number }>
  rsi14: Array<{ time: number; value: number }>
  macd: Array<{ time: number; macd: number; signal: number; histogram: number }>
}

const table = parseCsv(loadText("base_1m.csv"))
const dataset = buildDataset(table, autoDetectMapping(table.headers))
const expected = JSON.parse(loadText("expected_indicators.json")) as Expected

describe("indicators vs pandas golden fixtures", () => {
  it("SMA(20) matches pandas rolling mean", () => {
    const got = sma(dataset.candles, 20)
    expect(got).toHaveLength(expected.sma20.length)
    got.forEach((point, i) => {
      expect(point.time).toBe(expected.sma20[i]!.time)
      expect(point.value).toBeCloseTo(expected.sma20[i]!.value, 6)
    })
  })

  it("EMA(20) matches pandas ewm(adjust=false)", () => {
    const got = ema(dataset.candles, 20)
    expect(got).toHaveLength(expected.ema20.length)
    got.forEach((point, i) => {
      expect(point.time).toBe(expected.ema20[i]!.time)
      expect(point.value).toBeCloseTo(expected.ema20[i]!.value, 6)
    })
  })

  it("Bollinger(20, 2) matches pandas rolling mean/std", () => {
    const got = bollinger(dataset.candles, 20, 2)
    expect(got).toHaveLength(expected.bollinger20.length)
    got.forEach((point, i) => {
      const ref = expected.bollinger20[i]!
      expect(point.time).toBe(ref.time)
      expect(point.middle).toBeCloseTo(ref.middle, 6)
      expect(point.upper).toBeCloseTo(ref.upper, 6)
      expect(point.lower).toBeCloseTo(ref.lower, 6)
    })
  })

  it("RSI(14) matches the Wilder reference", () => {
    const got = rsi(dataset.candles, 14)
    expect(got).toHaveLength(expected.rsi14.length)
    got.forEach((point, i) => {
      expect(point.time).toBe(expected.rsi14[i]!.time)
      expect(point.value).toBeCloseTo(expected.rsi14[i]!.value, 6)
    })
  })

  it("MACD(12, 26, 9) matches the pandas ewm reference", () => {
    const got = macd(dataset.candles, 12, 26, 9)
    expect(got).toHaveLength(expected.macd.length)
    got.forEach((point, i) => {
      const ref = expected.macd[i]!
      expect(point.time).toBe(ref.time)
      expect(point.macd).toBeCloseTo(ref.macd, 6)
      expect(point.signal).toBeCloseTo(ref.signal, 6)
      expect(point.histogram).toBeCloseTo(ref.histogram, 6)
    })
  })
})
