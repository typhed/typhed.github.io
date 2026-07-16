# -*- encoding: utf-8 -*-

"""
Golden Fixture Generator For The Chart Engine

Generates a deterministic base 1-minute OHLCV series and the expected
higher-timeframe aggregations, using pandas ``resample`` as an independent
reference implementation. The TypeScript ``aggregate`` function is asserted
against these fixtures by the vitest suite, so a divergence in bucketing or
reduction logic fails the build.

The reference uses ``origin="epoch"``, ``closed="left"`` and ``label="left"``,
which matches the engine's epoch-aligned, left-closed, left-labelled buckets.
Prices are rounded to 2 decimals and volume is an integer, so first / max /
min / last / sum are exact and the cross-language comparison is not clouded by
floating-point noise.

:NOTE: Run with the Anaconda interpreter that has pandas and numpy, e.g.
    ``C:/Users/<user>/anaconda3/python.exe scripts/gen_fixtures.py``.
"""

import json
import pathlib
import datetime as dt

import numpy as np
import pandas as pd

FIXTURE_DIR : pathlib.Path = pathlib.Path(__file__).resolve().parent.parent / "test" / "fixtures"

START : dt.datetime = dt.datetime(2024, 1, 1, 0, 0, 0, tzinfo = dt.timezone.utc)
BASE_MINUTES : int = 1500
RANDOM_SEED : int = 20240101

# Contiguous minute indices removed to create gaps (a full missing hour plus a
# short break), so empty higher-timeframe buckets and partial buckets are both
# exercised.
GAP_RANGES : list = [(600, 660), (900, 905)]

# Engine timeframe id -> pandas offset alias.
TIMEFRAMES : dict = {
    "5m" : "5min",
    "15m" : "15min",
    "1h" : "1h",
    "4h" : "4h",
    "1D" : "1D",
}


def build_base() -> pd.DataFrame:
    """
    Build the deterministic base 1-minute OHLCV frame.

    A seeded random walk produces close prices; open is the previous close.
    High and low are derived from the rounded open / close so that the OHLC
    invariants (``high >= max(open, close)``, ``low <= min(open, close)``)
    always hold after rounding. Configured gap ranges are then removed.

    :rtype:   pandas.DataFrame
    :returns: Frame indexed by a UTC ``DatetimeIndex`` with open, high, low,
        close and volume columns.
    """

    rng = np.random.default_rng(RANDOM_SEED)

    times = [START + dt.timedelta(minutes = idx) for idx in range(BASE_MINUTES)]
    steps = rng.normal(loc = 0.0, scale = 0.5, size = BASE_MINUTES)

    close_price = 100.0
    records : list = []
    for idx in range(BASE_MINUTES):
        open_price = close_price
        close_price = max(1.0, open_price + steps[idx])

        open_round = round(open_price, 2)
        close_round = round(close_price, 2)
        high = round(max(open_round, close_round) + abs(rng.normal(0.0, 0.2)), 2)
        low = round(min(open_round, close_round) - abs(rng.normal(0.0, 0.2)), 2)
        volume = int(rng.integers(100, 10000))

        records.append(
            {
                "time" : times[idx],
                "open" : open_round,
                "high" : high,
                "low" : low,
                "close" : close_round,
                "volume" : volume,
            }
        )

    frame = pd.DataFrame.from_records(records).set_index("time")

    keep = np.ones(len(frame), dtype = bool)
    for start, end in GAP_RANGES:
        keep[start : end] = False

    return frame.loc[keep]


def aggregate_reference(frame : pd.DataFrame, alias : str) -> list:
    """
    Aggregate the base frame to a higher timeframe via pandas ``resample``.

    Empty buckets (all-NaN) are dropped so the output holds only populated
    candles, matching the engine which emits nothing for a gap.

    :type  frame: pandas.DataFrame
    :param frame: Base 1-minute frame indexed by a UTC ``DatetimeIndex``.

    :type  alias: str
    :param alias: Pandas offset alias, e.g. ``"5min"`` or ``"1D"``.

    :rtype:   list
    :returns: List of candle dicts with epoch-second ``time`` and OHLCV values.
    """

    resampled = frame.resample(
        alias, origin = "epoch", closed = "left", label = "left"
    ).agg(
        {
            "open" : "first",
            "high" : "max",
            "low" : "min",
            "close" : "last",
            "volume" : "sum",
        }
    )

    resampled = resampled.dropna(subset = ["open"])

    candles : list = []
    for timestamp, row in resampled.iterrows():
        candles.append(
            {
                "time" : int(timestamp.timestamp()),
                "open" : round(float(row["open"]), 2),
                "high" : round(float(row["high"]), 2),
                "low" : round(float(row["low"]), 2),
                "close" : round(float(row["close"]), 2),
                "volume" : int(row["volume"]),
            }
        )
    return candles


def indicator_reference(frame : pd.DataFrame) -> dict:
    """
    Compute the reference indicator series on the base close price.

    SMA, EMA, Bollinger and MACD use pandas ``rolling`` / ``ewm`` (independent
    of the TypeScript code). RSI uses Wilder's method with an SMA seed, which
    the engine mirrors, so the fixture guards the transcription of that formula.

    :type  frame: pandas.DataFrame
    :param frame: Base 1-minute frame indexed by a UTC ``DatetimeIndex``.

    :rtype:   dict
    :returns: Mapping of indicator id to a list of point dicts.
    """

    close = frame["close"]
    times = [int(ts.timestamp()) for ts in frame.index]

    def points(series : pd.Series) -> list:
        out : list = []
        for idx, value in enumerate(series.to_numpy()):
            if np.isnan(value):
                continue
            out.append({"time" : times[idx], "value" : round(float(value), 8)})
        return out

    sma_20 = close.rolling(20).mean()
    ema_20 = close.ewm(span = 20, adjust = False).mean()

    middle = close.rolling(20).mean()
    std = close.rolling(20).std(ddof = 0)
    bollinger_20 : list = []
    for idx in range(len(close)):
        mid = middle.iloc[idx]
        dev = std.iloc[idx]
        if np.isnan(mid) or np.isnan(dev):
            continue
        bollinger_20.append(
            {
                "time" : times[idx],
                "middle" : round(float(mid), 8),
                "upper" : round(float(mid + 2 * dev), 8),
                "lower" : round(float(mid - 2 * dev), 8),
            }
        )

    rsi_14 = wilder_rsi(close, 14, times)

    ema_fast = close.ewm(span = 12, adjust = False).mean()
    ema_slow = close.ewm(span = 26, adjust = False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span = 9, adjust = False).mean()
    macd_points : list = []
    for idx in range(len(close)):
        macd_points.append(
            {
                "time" : times[idx],
                "macd" : round(float(macd_line.iloc[idx]), 8),
                "signal" : round(float(signal_line.iloc[idx]), 8),
                "histogram" : round(
                    float(macd_line.iloc[idx] - signal_line.iloc[idx]), 8
                ),
            }
        )

    return {
        "sma20" : points(sma_20),
        "ema20" : points(ema_20),
        "bollinger20" : bollinger_20,
        "rsi14" : rsi_14,
        "macd" : macd_points,
    }


def wilder_rsi(close : pd.Series, period : int, times : list) -> list:
    """
    Wilder's RSI with an SMA seed for the first average gain and loss.

    :type  close: pandas.Series
    :param close: Close price series.

    :type  period: int
    :param period: Look-back period, e.g. 14.

    :type  times: list
    :param times: Epoch-second timestamps aligned to ``close`` by position.

    :rtype:   list
    :returns: List of ``{"time", "value"}`` points from index ``period`` on.
    """

    values = close.to_numpy()
    changes = np.diff(values)

    gains = np.where(changes > 0, changes, 0.0)
    losses = np.where(changes < 0, -changes, 0.0)

    avg_gain = float(gains[:period].mean())
    avg_loss = float(losses[:period].mean())

    out : list = []

    def rsi_value(gain : float, loss : float) -> float:
        if loss == 0:
            return 50.0 if gain == 0 else 100.0
        return 100.0 - 100.0 / (1.0 + gain / loss)

    out.append({"time" : times[period], "value" : round(rsi_value(avg_gain, avg_loss), 8)})

    for idx in range(period + 1, len(values)):
        gain = gains[idx - 1]
        loss = losses[idx - 1]
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period
        out.append(
            {"time" : times[idx], "value" : round(rsi_value(avg_gain, avg_loss), 8)}
        )
    return out


def main() -> None:
    """
    Generate the base CSV and one expected-JSON file per timeframe, plus a
    ``meta.json`` describing the fixture set.
    """

    FIXTURE_DIR.mkdir(parents = True, exist_ok = True)
    frame = build_base()

    csv_frame = frame.reset_index()
    csv_frame["time"] = csv_frame["time"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    csv_frame.to_csv(FIXTURE_DIR / "base_1m.csv", index = False)

    written : list = []
    for tf_id, alias in TIMEFRAMES.items():
        candles = aggregate_reference(frame, alias)
        path = FIXTURE_DIR / f"expected_{tf_id}.json"
        with open(path, "w", encoding = "utf-8") as handle:
            json.dump(candles, handle, indent = 2)
        written.append({"id" : tf_id, "alias" : alias, "candles" : len(candles)})

    indicators = indicator_reference(frame)
    with open(FIXTURE_DIR / "expected_indicators.json", "w", encoding = "utf-8") as handle:
        json.dump(indicators, handle, indent = 2)

    meta = {
        "base_interval_seconds" : 60,
        "assumed_timezone" : "UTC",
        "base_rows" : int(len(frame)),
        "timeframes" : written,
        "indicators" : {key : len(value) for key, value in indicators.items()},
    }
    with open(FIXTURE_DIR / "meta.json", "w", encoding = "utf-8") as handle:
        json.dump(meta, handle, indent = 2)

    print(f"Wrote fixtures to {FIXTURE_DIR}")
    print(f"Base rows: {len(frame)}")
    for item in written:
        print(f"  {item['id']:>3} -> {item['candles']} candles")


if __name__ == "__main__":
    main()
