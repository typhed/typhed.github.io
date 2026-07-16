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

    meta = {
        "base_interval_seconds" : 60,
        "assumed_timezone" : "UTC",
        "base_rows" : int(len(frame)),
        "timeframes" : written,
    }
    with open(FIXTURE_DIR / "meta.json", "w", encoding = "utf-8") as handle:
        json.dump(meta, handle, indent = 2)

    print(f"Wrote fixtures to {FIXTURE_DIR}")
    print(f"Base rows: {len(frame)}")
    for item in written:
        print(f"  {item['id']:>3} -> {item['candles']} candles")


if __name__ == "__main__":
    main()
