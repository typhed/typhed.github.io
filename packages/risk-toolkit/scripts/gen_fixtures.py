# -*- encoding: utf-8 -*-

"""
Golden Fixture Generator For The Risk Toolkit

Generates two correlated price series and the expected risk statistics computed
with numpy and scipy - an independent reference for the TypeScript risk toolkit.
The vitest suite reads the same prices, recomputes each statistic, and asserts a
match, so a divergence in a formula (returns, volatility, VaR, covariance,
drawdown) fails the build.

:NOTE: Run with the Anaconda interpreter that has numpy and scipy, e.g.
    ``C:/Users/<user>/anaconda3/python.exe scripts/gen_fixtures.py``.
"""

import json
import pathlib

import numpy as np
from scipy.stats import norm

FIXTURE_DIR : pathlib.Path = pathlib.Path(__file__).resolve().parent.parent / "test" / "fixtures"

RANDOM_SEED : int = 7
SAMPLES : int = 300
PERIODS_PER_YEAR : int = 252
CONFIDENCE : float = 0.95


def build_prices() -> tuple:
    """
    Build two correlated price series from a bivariate-normal return process.

    :rtype:   tuple
    :returns: ``(prices_a, prices_b)`` as numpy arrays of length ``SAMPLES + 1``.
    """

    rng = np.random.default_rng(RANDOM_SEED)
    cov = np.array([[0.0004, 0.00018], [0.00018, 0.0009]])
    returns = rng.multivariate_normal(mean = [0.0005, 0.0003], cov = cov, size = SAMPLES)

    prices_a = 100.0 * np.concatenate([[1.0], np.cumprod(1.0 + returns[:, 0])])
    prices_b = 100.0 * np.concatenate([[1.0], np.cumprod(1.0 + returns[:, 1])])
    return prices_a, prices_b


def simple_returns(prices : np.ndarray) -> np.ndarray:
    """Arithmetic period returns from a price series."""

    return prices[1:] / prices[:-1] - 1.0


def max_drawdown(series : np.ndarray) -> float:
    """Maximum peak-to-trough drop of a series as a positive fraction."""

    peak = np.maximum.accumulate(series)
    drawdown = (peak - series) / peak
    return float(np.max(drawdown))


def main() -> None:
    """
    Write the price CSV and the expected-statistics JSON.
    """

    FIXTURE_DIR.mkdir(parents = True, exist_ok = True)
    prices_a, prices_b = build_prices()

    with open(FIXTURE_DIR / "prices.csv", "w", encoding = "utf-8") as handle:
        handle.write("price_a,price_b\n")
        for value_a, value_b in zip(prices_a, prices_b):
            handle.write(f"{value_a:.10f},{value_b:.10f}\n")

    returns_a = simple_returns(prices_a)
    returns_b = simple_returns(prices_b)
    alpha = 1.0 - CONFIDENCE

    var_q = float(np.quantile(returns_a, alpha))
    tail = returns_a[returns_a <= var_q]
    z = float(norm.ppf(alpha))

    cov = np.cov(returns_a, returns_b, ddof = 1)
    corr = np.corrcoef(returns_a, returns_b)
    weights = np.array([0.5, 0.5])
    port_var = float(weights @ cov @ weights)
    port_vol = float(np.sqrt(port_var))
    weighted_vol = float(weights[0] * np.sqrt(cov[0, 0]) + weights[1] * np.sqrt(cov[1, 1]))

    expected = {
        "periods_per_year" : PERIODS_PER_YEAR,
        "confidence" : CONFIDENCE,
        "mean_a" : round(float(np.mean(returns_a)), 12),
        "std_a" : round(float(np.std(returns_a, ddof = 1)), 12),
        "annualized_vol_a" : round(float(np.std(returns_a, ddof = 1) * np.sqrt(PERIODS_PER_YEAR)), 12),
        "hist_var_95_a" : round(-var_q, 12),
        "hist_cvar_95_a" : round(-float(tail.mean()), 12),
        "parametric_var_95_a" : round(-(float(np.mean(returns_a)) + z * float(np.std(returns_a, ddof = 1))), 12),
        "max_drawdown_a" : round(max_drawdown(prices_a), 12),
        "correlation_ab" : round(float(corr[0, 1]), 12),
        "covariance" : [[round(float(cov[i, j]), 14) for j in range(2)] for i in range(2)],
        "portfolio_vol_5050" : round(port_vol, 12),
        "diversification_ratio_5050" : round(weighted_vol / port_vol, 12),
    }

    with open(FIXTURE_DIR / "expected_stats.json", "w", encoding = "utf-8") as handle:
        json.dump(expected, handle, indent = 2)

    print(f"Wrote fixtures to {FIXTURE_DIR}")
    print(f"Samples: {SAMPLES}  correlation(a, b): {expected['correlation_ab']:.4f}")


if __name__ == "__main__":
    main()
