<div align = "center">

# trading.typhed.com - Initial Phase Plan

</div>

<div align = "justify">

This is the execution roadmap for `trading.typhed.com`, the third leg of the TyPhed project. It is a
client-side chart-analysis and funds-management platform: users upload their own historic OHLCV data
(CSV or XLSX), the platform renders a fluid TradingView-style chart as the data substrate, and the
differentiated value sits in a quantity, sizing, and portfolio-risk toolkit inspired by the institutional
lane (Bloomberg Terminal, BlackRock Aladdin) rather than TradingView's price-signal features. The full
architecture rationale lives in the approved architecture plan; this document tracks the phases and their
exit gates.

The platform is a Turborepo monorepo (pnpm + Turbo), Next.js 15 App Router statically exported to GitHub
Pages, sharing the parent Clerk application and the indigo/cyan token system of the sibling sites. There
is no server at request time - the accuracy-critical core runs in TypeScript, and Python arrives later as
a lazy-loaded in-browser Pyodide lane for advanced analytics only.

## How To Use This Plan

  * Phases run in order. A phase does not begin until the previous phase has cleared its exit gate.
  * Every phase ends with the same exit gate: validate, optimize, review, security, accuracy, commit.
  * The commit is mandatory and closes the phase. Commit messages follow the `git-commiter` skill shape
    (emoji glyph prefix, optional Conventional Commit type/scope, imperative summary, short body paragraph
    then `-` bullets), with **no `Co-authored-by` trailer** for this project - a deliberate override of
    both the skill and the environment default, to be reassessed later.

## Phase 0 - Foundation and Deployment

**Status: DONE** - commit `47d9c0e ✨🚧 feat(scaffold): scaffold trading.typhed.com monorepo and shell`.

Goal: a deployable, styled, authenticated empty shell on the real domain, so every later phase lands on a
working pipeline.

Deliverables:

  - [x] Turborepo scaffold: `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `packages/config-typescript`, `packages/config-tailwind`.
  - [x] `apps/web` on Next.js 15 App Router with `output: "export"`, `trailingSlash: true`, `images.unoptimized: true`.
  - [x] Copied token system: `globals.css` HSL table (dark default), Inter + Space Grotesk fonts, `cn()` primitives, theme toggle - no text-size control.
  - [x] Shell: sticky backdrop-blur header and gradient footer matching the sibling sites.
  - [x] Clerk client provider guarded on `CLERK_ENABLED`, whole-app auth gate via `useAuth` (the `@clerk/react` SDK does not export `<SignedIn>` / `<SignedOut>`).
  - [x] Chat FAB placeholder, fixed bottom-right, opening an empty panel.
  - [x] CI/CD: GitHub Actions to GH Pages, `public/CNAME`, `public/.nojekyll`, README.

Exit gate:

  - [x] Validate: `pnpm --filter web build` produces `out/`; verified with auth OFF and with a dummy Clerk key.
  - [x] Optimize: reviewed the diff and applied cleanups.
  - [x] Review: `/code-review` on the diff - 5 low-severity findings, 4 fixed.
  - [x] Security: quick pass on the Clerk wiring.
  - [x] Accuracy: not applicable this phase.
  - [x] Commit: `47d9c0e`, no co-author trailer.

## Phase 1 - Core Data Pipeline and Chart

**Status: DONE** - `@typhed/chart-engine` + web chart integration, 26 vitest tests green including 5
golden-fixture cross-checks against pandas.

Goal: upload to accurate candles on screen.

Deliverables:

  - [x] `@typhed/chart-engine` package: parse (PapaParse CSV, SheetJS XLSX). Parsing is synchronous in the engine; a Web Worker can wrap it later for very large files.
  - [x] Column-mapping step with auto-detect and explicit user confirmation.
  - [x] Validation: OHLC invariants, strictly increasing unique timestamps, non-negative volume; violations reported, never silently repaired.
  - [x] Aggregation: resample base timeframe to higher candles (open=first, high=max, low=min, close=last, volume=sum) on explicit epoch-aligned boundaries (weekly anchored to Monday UTC).
  - [x] `lightweight-charts@5` price pane plus volume histogram sub-pane, timeframe switcher.
  - [x] Data Integrity panel: rows parsed / charted, duplicates, gaps, timezone (UTC), base interval.
  - [x] Golden-file tests: pandas/numpy fixtures asserted against the TS core in vitest.

Exit gate:

  - [x] Validate: build + static export clean; aggregation values proven against the pandas reference by the golden vitest suite (same function feeds the chart). Manual browser smoke test recommended.
  - [x] Optimize: reviewed the diff; pure functions isolated in the package.
  - [x] Review: self-review pass on the pipeline and chart wiring.
  - [ ] Security: parsing untrusted files - `xlsx@0.18.5` (SheetJS npm) carries known advisories; blast radius is the user's own client-side session, flagged as a follow-up to pin the patched CDN build.
  - [x] Accuracy: 26 golden/unit tests green. TradingView cross-check pending (needs the user's TV).
  - [x] Commit: `d54627e`, no co-author trailer.

## Phase 2 - Indicator Framework

**Status: DONE** - 5 indicators with pandas golden tests (31 total tests green), show/hide panel wired.

Goal: toggleable overlays and oscillators.

Deliverables:

  - [x] Pure indicator functions in `chart-engine`: SMA, EMA, Bollinger Bands (overlays); RSI, MACD (sub-panes).
  - [x] Show/hide indicator panel; toggling adds / removes the series and its pane.
  - [x] Golden-file fixtures for every indicator (pandas ewm/rolling + Wilder RSI).

Exit gate:

  - [x] Validate: build + export clean; ChartView renders overlays on the price pane and RSI/MACD in sub-panes.
  - [x] Optimize: indicator maths kept as pure functions in the package.
  - [x] Review: self-review of indicator formulas and pane management.
  - [x] Security: quick pass - no new surface (client-side compute only).
  - [x] Accuracy: 5 indicator golden tests green (SMA/EMA/Bollinger/RSI/MACD vs pandas).
  - [x] Commit: `dbff667`, no co-author trailer.

## Phase 3 - Funds-Management Flagship Trio

**Status: DONE** - `@typhed/risk-toolkit` with 14 numpy/scipy golden + determinism tests, plus three web
tools (sizer, risk dashboard, Monte Carlo).

Goal: the differentiated "how much quantity" tools that TradingView lacks.

Deliverables:

  - [x] `@typhed/risk-toolkit` package (pure TS, seedable, deterministic).
  - [x] Risk-based position sizer: fixed-fractional plus ATR-normalized.
  - [x] Risk dashboard: volatility, historical/parametric VaR, CVaR, max drawdown. Portfolio correlation / covariance / risk-parity maths are implemented and tested in the package; the multi-asset UI (heatmap) lands with multi-file upload.
  - [x] Monte Carlo drawdown / risk-of-ruin simulator, seeded, with a sample-path fan.
  - [ ] Entitlement slug per tool - added in Phase 4 (the entitlement system).

Exit gate:

  - [x] Validate: build + export clean; tools render and recompute live from inputs / uploaded data.
  - [x] Optimize: all risk maths isolated as pure functions in the package.
  - [x] Review: self-review of sizing, VaR/CVaR, portfolio and Monte Carlo logic.
  - [x] Security: quick pass - client-side compute only, no new external surface.
  - [x] Accuracy: 14 golden/determinism tests green (numpy/scipy reference + seeded Monte Carlo).
  - [x] Commit: `4fa7c18`, no co-author trailer.

## Phase 4 - Entitlement System

**Status: DONE** - `useEntitlements` + `<Entitled>` gate driven by Clerk `publicMetadata`, a feature
catalogue with free/pro tiers, Monte Carlo gated as the first Pro tool, and IndexedDB saved analyses.

Goal: per-user tiered access with manual approval.

Deliverables:

  - [x] `useEntitlements()` reading `user.publicMetadata.entitlements` / `tier`.
  - [x] `<Entitled feature="…">` gate rendering an unlock state for locked tools.
  - [x] Manual-approval flow documented in `lib/entitlements.ts` (set `publicMetadata` in the Clerk Dashboard; a local backend-API script can batch it later).
  - [x] Free vs paid split via a `FEATURES` catalogue - flip a tier with no tool code change; Monte Carlo shipped as the first Pro-gated tool.
  - [x] Saved work in IndexedDB with JSON export / import.

Exit gate:

  - [x] Validate: build + export clean; with Clerk off everyone is free so Monte Carlo shows its locked state.
  - [x] Optimize: entitlement logic centralised in one hook + catalogue.
  - [x] Review: self-review of the gate, hook, and storage.
  - [x] Security: automated `/security-review` could not run (no git remote in this local repo); a manual review was done - soft-gate documented, `publicMetadata` not user-writable, import is prototype-pollution-safe, no XSS, no secrets/network.
  - [x] Accuracy: not applicable this phase.
  - [x] Commit: `f63a285`, no co-author trailer.

## Phase 5 - Python Advanced Lane and Hard Gate

**Status: DONE** - Pyodide loads numpy in-browser and runs `analytics.py` (validated against scipy);
Advanced analytics shipped as a Pro tool; serverless hard-gate documented.

Goal: the analytics where Python genuinely wins, plus real protection for high-value paid tools.

Deliverables:

  - [x] `apps/web/public/py/analytics.py` executed in a lazily loaded Pyodide runtime. numpy only (deliberate - keeps the WASM download small; the JB p-value uses the chi-square(2) closed form so scipy is not needed at runtime).
  - [x] Advanced higher-moment analytics wired (skewness, excess kurtosis, Jarque-Bera + p-value, Cornish-Fisher modified VaR) - the Python-lane demo that TradingView lacks.
  - [x] Risk-parity / equal-risk-contribution and minimum-variance weights implemented and tested in `analytics.py`; the multi-asset portfolio UI (and efficient frontier) lands with multi-file upload.
  - [x] Per-tool serverless verification documented as a reference (`serverless/verify-entitlement.ts` + README) - checks the Clerk JWT and entitlement server-side; not yet deployed.

Exit gate:

  - [x] Validate: build + export clean; `analytics.py` is exported to `out/py/` and fetched at runtime; the Advanced tool is Pro-gated.
  - [x] Optimize: analytics kept numpy-only; a single lazy runtime shared across runs.
  - [x] Review: self-review of the loader, tool, and Python module.
  - [x] Security: automated `/security-review` could not run (no git remote); manual review - runtime pinned to v0.26.4, data computed locally in WASM (never sent to the CDN), no code-eval of user input, serverless stub fails closed. Residual: CDN supply-chain (pin done; SRI / self-host is a follow-up).
  - [x] Accuracy: `packages/analytics-python/test_analytics.py` PASS under Anaconda (skew/kurtosis/JB vs scipy; min-variance beats equal weight; risk-parity contributions near-equal).
  - [x] Commit: `40d13b9`, no co-author trailer.

## Phase 6 - AI Chat

**Status: DONE (shell)** - the FAB opens a working chat UI (thread + input + send) wired for a future
model; the AI backend itself is intentionally deferred per the brief.

Goal: wire the placeholder chat FAB to real AI features and prompts.

Deliverables:

  - [x] Chat panel UI shell (`ChatPanel`) wired to the FAB: message thread, input, send, autoscroll. A `placeholderReply` stands in for the model - swap it for a streaming call when the backend lands.
  - [~] Prompt and analysis surfaces: the surface exists; connecting it to a model (and to the loaded data/tools) is the deferred backend work.

Exit gate:

  - [x] Validate: build + export clean; the chat opens, accepts input, and responds (placeholder).
  - [x] Optimize: self-contained client component, no dead state.
  - [x] Review: self-review of the chat shell.
  - [x] Security: no external calls or secrets yet (placeholder is local). When a real model is wired, `/security-review` on the API call, key handling, and prompt-injection surface is required.
  - [x] Accuracy: not applicable this phase.
  - [ ] Commit: this phase's commit (below).

</div>
