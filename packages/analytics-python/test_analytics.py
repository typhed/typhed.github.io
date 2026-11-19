# -*- encoding: utf-8 -*-

"""
Reference Test For The In-Browser Analytics Module

Validates ``apps/trading/public/py/analytics.py`` (the exact file
Pyodide runs in the browser) against scipy and closed-form results,
using the Anaconda interpreter. This is the accuracy oracle for the
Phase 5 Python lane.

:NOTE: Run with the Anaconda interpreter that has numpy and scipy, e.g.
    ``C:/Users/<user>/anaconda3/python.exe`` with the script path
    ``packages/analytics-python/test_analytics.py``. ``pytest`` runs
    the same three checks.
"""

import importlib.util
import pathlib
import sys
import types

import numpy as np
from scipy import stats

ANALYTICS_PATH : pathlib.Path = (
    pathlib.Path(__file__).resolve().parents[2]
    / "apps" / "trading" / "public" / "py" / "analytics.py"
)


def load_analytics() -> types.ModuleType:
    """
    Load the browser analytics module from its source file.

    Bytecode writing is switched off first: a ``__pycache__`` beside
    the module would sit in the trading app's ``public/`` folder, and
    the next build would copy it into the static export.

    :rtype:   types.ModuleType
    :returns: The executed ``analytics`` module.
    """

    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("analytics", ANALYTICS_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_advanced_stats() -> None:
    """Assert higher moments, Jarque-Bera and VaR match scipy / numpy."""

    analytics = load_analytics()
    rng = np.random.default_rng(0)
    returns = rng.standard_normal(500) * 0.01 + 0.0004
    result = analytics.advanced_stats(list(returns), 0.95)
    kurtosis = stats.kurtosis(returns, fisher = True, bias = True)

    assert abs(result["skewness"] - float(stats.skew(returns, bias = True))) < 1e-9
    assert abs(result["excess_kurtosis"] - float(kurtosis)) < 1e-9

    jb_stat, _ = stats.jarque_bera(returns)
    assert abs(result["jarque_bera"] - float(jb_stat)) < 1e-6
    assert abs(result["historical_var"] - (-float(np.quantile(returns, 0.05)))) < 1e-12


def test_min_variance() -> None:
    """Assert min-variance weights sum to one and beat equal weight."""

    analytics = load_analytics()
    cov = np.array([[0.04, 0.01, 0.0], [0.01, 0.09, 0.02], [0.0, 0.02, 0.16]])
    weights = np.array(analytics.min_variance_weights(cov.tolist()))
    equal = np.ones(3) / 3

    assert abs(weights.sum() - 1.0) < 1e-9
    assert (weights @ cov @ weights) <= (equal @ cov @ equal) + 1e-12


def test_risk_parity() -> None:
    """Assert risk-parity weights give near-equal risk contributions."""

    analytics = load_analytics()
    cov = np.array([[0.04, 0.01, 0.0], [0.01, 0.09, 0.02], [0.0, 0.02, 0.16]])
    weights = np.array(analytics.risk_parity_weights(cov.tolist()))
    portfolio_vol = np.sqrt(weights @ cov @ weights)
    contribution = weights * (cov @ weights) / portfolio_vol

    assert abs(weights.sum() - 1.0) < 1e-9
    assert float(contribution.max() - contribution.min()) < 1e-4


def main() -> None:
    """Run every check and report the outcome."""

    test_advanced_stats()
    test_min_variance()
    test_risk_parity()
    print("analytics.py reference tests PASS")


if __name__ == "__main__":
    main()
