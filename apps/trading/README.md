<div align = "center">

# TyPhed Trading

[![Next.js](https://img.shields.io/badge/Next.js-%2015-000000?style=plastic&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-%205-3178C6?style=plastic&logo=typescript)](https://www.typescriptlang.org)
[![Vitest](https://img.shields.io/badge/Vitest-%20tested-6E9F18?style=plastic&logo=vitest)](https://vitest.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-%20Workers-F38020?style=plastic&logo=cloudflareworkers)](https://workers.cloudflare.com)

</div>

<div align = "justify">

The third leg of the TyPhed project, served at `trading.typhed.com`. A client-side chart-analysis and funds-management
platform: upload your own historic market data (CSV or XLSX), render a fluid TradingView-style chart, and answer the
questions retail tools skip - **how much quantity, how much risk, how to allocate capital**. Everything runs in the
browser, so no market data ever leaves the device.

## 🧠 Why This Exists

TradingView already answers "at what price". This platform answers "how much quantity" - the institutional lane of
position sizing, portfolio risk, and capital allocation found in tools like the Bloomberg Terminal and BlackRock
Aladdin, plus one-off analyses that off-the-shelf charts do not offer.

## 🚀 Getting Started

From the repository root:

```shell
$ pnpm install
$ pnpm --filter trading dev
```

The app runs at `http://localhost:3001`. Authentication is off until `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in the
root `.env.local`, so the workspace is reachable straight away for local development. The left-hand menu lists the
workspace, the tools, and the budgeting planner; it starts expanded and remembers when you collapse it.

## 📦 Layout

```text
apps/trading/             the Next.js app: workspace, tools, budgeting
packages/chart-engine     CSV/XLSX parsing, column mapping, validation, timeframes, indicators
packages/risk-toolkit     statistics, position sizing, VaR/CVaR, portfolio maths, Monte Carlo
packages/backtest         EMA swing backtester and parameter sweep
packages/entitlement-gate server-side entitlement check (not deployed)
packages/analytics-python NumPy/SciPy reference test for public/py/analytics.py
```

## 🧪 Build And Verify

```shell
$ pnpm --filter trading build
$ pnpm --filter trading typecheck
$ pnpm test
```

`build` writes the static export to `apps/trading/out`, which the `typhed-trading` Cloudflare Worker serves. `pnpm test`
runs the Vitest suites of this app and its three packages.

## 🔒 Data And Privacy

Everything you upload or type stays in your browser: candles live in IndexedDB (`typhed-trading`), and the IPO and
budgeting datasets live in `localStorage` - in plaintext, as every site's browser storage is. Nothing is transmitted
anywhere. Two controls bound that storage: signing out erases all locally stored tool data automatically, and the
**Clear local data** button above the footer erases it on demand at any time. One honest limit: signing out from a
sibling `typhed.com` site while this site is closed cannot be observed here, so on a shared device prefer the button or
sign out from this site itself.

## ⚠️ Disclaimer

This platform is a decision-support tool, not investment advice. It can contain errors. Verify every figure
independently before it informs a real trade.

</div>
