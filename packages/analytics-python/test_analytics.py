# -*- encoding: utf-8 -*-

"""
Reference Test For The In-Browser Analytics Module

Validates ``apps/web/public/py/analytics.py`` (the exact file Pyodide runs in
the browser) against scipy and closed-form results, using the Anaconda
interpreter. This is the accuracy oracle for the Phase 5 Python lane.

:NOTE: Run with the Anaconda interpreter that has numpy and scipy, e.g.
    ``C:/Users/<user>/anaconda3/python.exe packages/analytics-python/test_analytics.py``.
"""

import importlib.util
import pathlib

import numpy as np
from scipy import stats

ANALYTICS_PATH : pathlib.Path = (
    pathlib.Path(__file__).resolve().parents[2] / "apps" / "web" / "public" / "py" / "analytics.py"
)


def load_analytics():
    """Load the browser analytics module from its source file."""

    spec = importlib.util.spec_from_file_location("analytics", ANALYTICS_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_advanced_stats(analytics) -> None:
    """Assert higher moments, Jarque-Bera and VaR match scipy / numpy."""

    rng = np.random.default_rng(0)
    returns = rng.standard_normal(500) * 0.01 + 0.0004
    result = analytics.advanced_stats(list(returns), 0.95)

    assert abs(result["skewness"] - float(stats.skew(returns, bias = True))) < 1e-9
    assert abs(result["excess_kurtosis"] - float(stats.kurtosis(returns, fisher = True, bias = True))) < 1e-9

    jb_stat, _ = stats.jarque_bera(returns)
    assert abs(result["jarque_bera"] - float(jb_stat)) < 1e-6
    assert abs(result["historical_var"] - (-float(np.quantile(returns, 0.05)))) < 1e-12


def test_min_variance(analytics) -> None:
    """Assert min-variance weights sum to one and beat equal weight."""

    cov = np.array([[0.04, 0.01, 0.0], [0.01, 0.09, 0.02], [0.0, 0.02, 0.16]])
    weights = np.array(analytics.min_variance_weights(cov.tolist()))
    equal = np.ones(3) / 3

    assert abs(weights.sum() - 1.0) < 1e-9
    assert (weights @ cov @ weights) <= (equal @ cov @ equal) + 1e-12


def test_risk_parity(analytics) -> None:
    """Assert risk-parity weights give near-equal risk contributions."""

    cov = np.array([[0.04, 0.01, 0.0], [0.01, 0.09, 0.02], [0.0, 0.02, 0.16]])
    weights = np.array(analytics.risk_parity_weights(cov.tolist()))
    portfolio_vol = np.sqrt(weights @ cov @ weights)
    contribution = weights * (cov @ weights) / portfolio_vol

    assert abs(weights.sum() - 1.0) < 1e-9
    assert float(contribution.max() - contribution.min()) < 1e-4


def main() -> None:
    """Run every check and report the outcome."""

    analytics = load_analytics()
    test_advanced_stats(analytics)
    test_min_variance(analytics)
    test_risk_parity(analytics)
    print("analytics.py reference tests PASS")


if __name__ == "__main__":
    main()
