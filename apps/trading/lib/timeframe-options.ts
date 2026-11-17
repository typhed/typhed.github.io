import { canAggregate, TIMEFRAMES, type Timeframe } from "@typhed/chart-engine";

function formatInterval(seconds: number): string {
  if (seconds % 86400 === 0) return `${seconds / 86400}D`;
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}

/**
 * The dataset's own timeframe. If the inferred interval matches a known
 * timeframe it is reused; otherwise a synthetic base timeframe is created so an
 * unusual sampling interval still charts and aggregates correctly.
 */
export function baseTimeframe(intervalSeconds: number | null): Timeframe {
  if (intervalSeconds === null) return TIMEFRAMES[0]!;

  const known = TIMEFRAMES.find((tf) => tf.seconds === intervalSeconds);
  if (known) return known;

  const unit: Timeframe["unit"] =
    intervalSeconds >= 604800
      ? "week"
      : intervalSeconds >= 86400
        ? "day"
        : intervalSeconds >= 3600
          ? "hour"
          : "minute";

  return {
    id: formatInterval(intervalSeconds),
    label: formatInterval(intervalSeconds),
    seconds: intervalSeconds,
    unit,
  };
}

/**
 * Selectable timeframes for a dataset: the base itself plus every larger
 * timeframe that is a whole multiple of it (so buckets nest cleanly).
 */
export function timeframeOptions(base: Timeframe): Timeframe[] {
  const options: Timeframe[] = [base];
  for (const tf of TIMEFRAMES) {
    if (tf.id === base.id) continue;
    if (canAggregate(base, tf)) options.push(tf);
  }
  return options.sort((a, b) => a.seconds - b.seconds);
}
