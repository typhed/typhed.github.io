import type { Candle } from "../types";

export type IntegritySeverity = "error" | "warning";

export interface IntegrityIssue {
  severity: IntegritySeverity;
  code: string;
  message: string;
  /** Index into the input candle array, when the issue is row-specific. */
  row?: number;
}

export interface ValidationResult {
  /** Candles sorted ascending with duplicate timestamps removed. */
  candles: Candle[];
  issues: IntegrityIssue[];
  /** True when no `error`-severity issue was found. */
  ok: boolean;
  stats: {
    inputRows: number;
    outputRows: number;
    duplicatesDropped: number;
    reordered: boolean;
    hasVolume: boolean;
  };
}

/**
 * Validate and normalise candles before charting. This is decision-grade data,
 * so violations are reported rather than silently repaired. The function does
 * sort ascending and drop exact-duplicate timestamps (keeping the last), since
 * aggregation requires a strictly increasing series; both actions are counted
 * and surfaced so the user knows they happened.
 *
 * OHLC invariants checked per bar:
 *   high >= max(open, close), low <= min(open, close), high >= low,
 *   all values finite, volume (if present) >= 0.
 */
export function validateCandles(input: readonly Candle[]): ValidationResult {
  const issues: IntegrityIssue[] = [];
  const hasVolume = input.some((c) => c.volume !== null);

  // Detect whether the input arrived out of order before we sort it.
  let reordered = false;
  for (let i = 1; i < input.length; i += 1) {
    if (input[i]!.time < input[i - 1]!.time) {
      reordered = true;
      break;
    }
  }

  const sorted = [...input].sort((a, b) => a.time - b.time);

  // Drop exact-duplicate timestamps, keeping the last occurrence.
  const deduped: Candle[] = [];
  let duplicatesDropped = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    const bar = sorted[i]!;
    const next = sorted[i + 1];
    if (next && next.time === bar.time) {
      duplicatesDropped += 1;
      continue;
    }
    deduped.push(bar);
  }

  if (reordered) {
    issues.push({
      severity: "warning",
      code: "reordered",
      message: "Rows were not in chronological order and have been sorted.",
    });
  }
  if (duplicatesDropped > 0) {
    issues.push({
      severity: "warning",
      code: "duplicate_timestamps",
      message: `${duplicatesDropped} duplicate timestamp${
        duplicatesDropped === 1 ? "" : "s"
      } dropped (kept the last of each).`,
    });
  }

  deduped.forEach((bar, index) => {
    for (const [name, value] of [
      ["open", bar.open],
      ["high", bar.high],
      ["low", bar.low],
      ["close", bar.close],
    ] as const) {
      if (!Number.isFinite(value)) {
        issues.push({
          severity: "error",
          code: "non_finite",
          row: index,
          message: `Row ${index}: ${name} is not a finite number.`,
        });
      }
    }

    if (bar.high < bar.low) {
      issues.push({
        severity: "error",
        code: "high_below_low",
        row: index,
        message: `Row ${index}: high (${bar.high}) is below low (${bar.low}).`,
      });
    }
    if (bar.high < Math.max(bar.open, bar.close)) {
      issues.push({
        severity: "error",
        code: "high_below_body",
        row: index,
        message: `Row ${index}: high (${bar.high}) is below open/close.`,
      });
    }
    if (bar.low > Math.min(bar.open, bar.close)) {
      issues.push({
        severity: "error",
        code: "low_above_body",
        row: index,
        message: `Row ${index}: low (${bar.low}) is above open/close.`,
      });
    }
    if (bar.volume !== null && bar.volume < 0) {
      issues.push({
        severity: "error",
        code: "negative_volume",
        row: index,
        message: `Row ${index}: volume (${bar.volume}) is negative.`,
      });
    }
  });

  return {
    candles: deduped,
    issues,
    ok: !issues.some((i) => i.severity === "error"),
    stats: {
      inputRows: input.length,
      outputRows: deduped.length,
      duplicatesDropped,
      reordered,
      hasVolume,
    },
  };
}
