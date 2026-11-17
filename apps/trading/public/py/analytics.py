# -*- encoding: utf-8 -*-

"""
In-Browser Advanced Analytics (Pyodide Lane)

Runs inside Pyodide (numpy) in the user's browser - no server. It carries the
analytics where the numpy ecosystem earns its weight and that off-the-shelf
charts skip: higher moments, a normality test, and a Cornish-Fisher modified
VaR that adjusts for skew and fat tails. It also holds numpy portfolio helpers
(minimum-variance and risk-parity weights) ready for the multi-asset UI.

The uploaded data stays local: only the Python runtime is fetched from a CDN;
every computation happens in WebAssembly in the browser.

:NOTE: numpy only, deliberately - it keeps the WebAssembly download small. The
    Jarque-Bera p-value uses the closed form of the chi-square(2) survival
    function, ``exp(-JB / 2)``, so scipy is not required.
"""

import numpy as np

# Standard-normal quantiles for the supported confidence levels.
Z_SCORES : dict = {0.95 : -1.6448536269514722, 0.99 : -2.3263478740408408}


def advanced_stats(returns : list, confidence : float = 0.95) -> dict:
    """
    Compute higher-moment risk statistics for a single return series.

    Returns the sample skewness and excess kurtosis (Fisher-Pearson), the
    Jarque-Bera normality statistic with its p-value, the historical VaR, and a
    Cornish-Fisher modified VaR that inflates the tail for negative skew and
    excess kurtosis - a better tail estimate than the Gaussian VaR when returns
    are non-normal.

    :type  returns: list
    :param returns: Period returns as plain floats.

    :type  confidence: float
    :param confidence: VaR confidence level, ``0.95`` or ``0.99``.

    :rtype:   dict
    :returns: Mapping of statistic name to float value.
    """

    data = np.asarray(returns, dtype = float)
    n = int(data.size)
    if n < 3:
        return {"n" : n, "error" : 1.0}

    mean = float(np.mean(data))
    std = float(np.std(data, ddof = 1))
    std_pop = float(np.std(data, ddof = 0))

    if std_pop == 0:
        return {"n" : float(n), "mean" : mean, "std" : std, "error" : 1.0}

    skew = float(np.mean(((data - mean) / std_pop) ** 3))
    excess_kurt = float(np.mean(((data - mean) / std_pop) ** 4) - 3.0)

    jarque_bera = n / 6.0 * (skew ** 2 + (excess_kurt ** 2) / 4.0)
    jb_pvalue = float(np.exp(-jarque_bera / 2.0))

    alpha = 1.0 - confidence
    hist_var = -float(np.quantile(data, alpha))

    z = Z_SCORES.get(round(confidence, 2), -1.6448536269514722)
    z_cf = (
        z
        + (z ** 2 - 1.0) / 6.0 * skew
        + (z ** 3 - 3.0 * z) / 24.0 * excess_kurt
        - (2.0 * z ** 3 - 5.0 * z) / 36.0 * skew ** 2
    )
    cornish_fisher_var = -(mean + z_cf * std)
    gaussian_var = -(mean + z * std)

    return {
        "n" : float(n),
        "mean" : mean,
        "std" : std,
        "skewness" : skew,
        "excess_kurtosis" : excess_kurt,
        "jarque_bera" : float(jarque_bera),
        "jb_pvalue" : jb_pvalue,
        "historical_var" : hist_var,
        "gaussian_var" : gaussian_var,
        "cornish_fisher_var" : cornish_fisher_var,
    }


def min_variance_weights(cov : list) -> list:
    """
    Minimum-variance portfolio weights via the closed form
    ``w = Σ⁻¹ 1 / (1ᵀ Σ⁻¹ 1)``.

    :type  cov: list
    :param cov: Covariance matrix as a nested list.

    :rtype:   list
    :returns: Portfolio weights summing to one.
    """

    sigma = np.asarray(cov, dtype = float)
    ones = np.ones(sigma.shape[0])
    inv = np.linalg.inv(sigma)
    weights = inv @ ones
    weights = weights / float(ones @ inv @ ones)
    return [float(w) for w in weights]


def risk_parity_weights(cov : list, iterations : int = 20000, tol : float = 1e-10) -> list:
    """
    Equal-risk-contribution (risk-parity) weights via a fixed-point iteration
    on the marginal risk contributions - each asset ends up contributing the
    same share of portfolio risk.

    :type  cov: list
    :param cov: Covariance matrix as a nested list.

    :type  iterations: int
    :param iterations: Maximum iterations.

    :type  tol: float
    :param tol: Convergence tolerance on the weight update.

    :rtype:   list
    :returns: Long-only weights summing to one.
    """

    sigma = np.asarray(cov, dtype = float)
    n = sigma.shape[0]
    weights = np.ones(n) / n

    for _ in range(iterations):
        portfolio_vol = np.sqrt(weights @ sigma @ weights)
        marginal = sigma @ weights / portfolio_vol
        contribution = weights * marginal
        target = portfolio_vol / n
        updated = weights * target / contribution
        updated = np.clip(updated, 1e-15, None)
        updated = updated / updated.sum()
        if np.max(np.abs(updated - weights)) < tol:
            weights = updated
            break
        weights = updated

    return [float(w) for w in weights]
