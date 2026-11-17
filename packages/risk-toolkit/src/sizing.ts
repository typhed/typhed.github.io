/**
 * Position sizing - the "how much quantity" question. Every sizer answers it
 * from a fixed risk budget, so the loss if the stop is hit is bounded to a
 * known fraction of the account.
 */

export type Direction = "long" | "short"

export interface SizingResult {
  /** Whole units to trade (floored - you cannot buy a fraction of a share). */
  quantity: number
  /** Loss per unit if the stop is hit. */
  riskPerUnit: number
  /** Cash at risk (accountEquity * riskPercent). */
  riskAmount: number
  /** Notional value of the position at entry. */
  positionValue: number
  /** Position value as a percentage of the account. */
  positionPercent: number
}

export interface FixedFractionalInput {
  accountEquity: number
  /** Percent of the account to risk on this trade, e.g. 1 for 1%. */
  riskPercent: number
  entry: number
  stop: number
}

/**
 * Fixed-fractional sizing: risk a fixed percentage of the account, with the
 * per-unit risk defined by the distance from entry to stop.
 */
export function fixedFractionalSize(input: FixedFractionalInput): SizingResult {
  const riskAmount = input.accountEquity * (input.riskPercent / 100)
  const riskPerUnit = Math.abs(input.entry - input.stop)
  return sizeFromRisk(riskAmount, riskPerUnit, input.entry, input.accountEquity)
}

export interface AtrSizingInput {
  accountEquity: number
  riskPercent: number
  entry: number
  atr: number
  /** Stop distance in ATR multiples (e.g. 2 = a 2-ATR stop). */
  atrMultiple: number
  direction: Direction
}

export interface AtrSizingResult extends SizingResult {
  /** The stop implied by the ATR distance and direction. */
  stop: number
}

/**
 * Volatility-normalised sizing: the stop is placed `atrMultiple` ATRs away, so
 * every position carries the same volatility-scaled risk regardless of price.
 */
export function atrPositionSize(input: AtrSizingInput): AtrSizingResult {
  const riskPerUnit = input.atr * input.atrMultiple
  const stop = input.direction === "long" ? input.entry - riskPerUnit : input.entry + riskPerUnit
  const riskAmount = input.accountEquity * (input.riskPercent / 100)
  const base = sizeFromRisk(riskAmount, riskPerUnit, input.entry, input.accountEquity)
  return { ...base, stop }
}

function sizeFromRisk(
  riskAmount: number,
  riskPerUnit: number,
  entry: number,
  accountEquity: number,
): SizingResult {
  const quantity = riskPerUnit > 0 ? Math.floor(riskAmount / riskPerUnit) : 0
  const positionValue = quantity * entry
  return {
    quantity,
    riskPerUnit,
    riskAmount,
    positionValue,
    positionPercent: accountEquity > 0 ? (positionValue / accountEquity) * 100 : 0,
  }
}
