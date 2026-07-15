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

Goal: a deployable, styled, authenticated empty shell on the real domain, so every later phase lands on a
working pipeline.

Deliverables:

  - [ ] Turborepo scaffold: `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `packages/config-typescript`, `packages/config-tailwind`.
  - [ ] `apps/web` on Next.js 15 App Router with `output: "export"`, `trailingSlash: true`, `images.unoptimized: true`.
  - [ ] Copied token system: `globals.css` HSL table (dark default), Inter + Space Grotesk fonts, `cn()` primitives, theme toggle - no text-size control.
  - [ ] Shell: sticky backdrop-blur header and gradient footer matching the sibling sites.
  - [ ] Clerk client provider guarded on `CLERK_ENABLED`, whole-app auth gate (`<SignedIn>` / `<SignedOut>`).
  - [ ] Chat FAB placeholder, fixed bottom-right, opening an empty panel.
  - [ ] CI/CD: GitHub Actions to GH Pages, `public/CNAME`, `public/.nojekyll`, README.

Exit gate:

  - [ ] Validate: `pnpm --filter web build` produces `out/`; the shell renders and the auth gate blocks when signed out.
  - [ ] Optimize: `/simplify` on the diff.
  - [ ] Review: `/code-review` on the diff.
  - [ ] Security: quick pass on the Clerk wiring.
  - [ ] Accuracy: not applicable this phase.
  - [ ] Commit: mandatory, no co-author trailer.

## Phase 1 - Core Data Pipeline and Chart

Goal: upload to accurate candles on screen.

Deliverables:

  - [ ] `@typhed/chart-engine` package: parse (PapaParse CSV, SheetJS XLSX) in a Web Worker.
  - [ ] Column-mapping step with auto-detect and explicit user confirmation.
  - [ ] Validation: OHLC invariants, strictly increasing unique timestamps, non-negative volume; violations reported, never silently repaired.
  - [ ] Aggregation: resample base timeframe to higher candles (open=first, high=max, low=min, close=last, volume=sum) on explicit boundaries.
  - [ ] `lightweight-charts@5` price pane plus volume histogram sub-pane, timeframe switcher.
  - [ ] Data Integrity panel: rows parsed, rows flagged, timezone assumed, aggregation boundary used.
  - [ ] Golden-file tests: pandas/numpy fixtures asserted against the TS core in vitest.

Exit gate:

  - [ ] Validate: `/verify` drives upload to 5m / 1h / 1D; candle counts and values match the pandas reference.
  - [ ] Optimize: `/simplify` on the diff.
  - [ ] Review: `/code-review` on the diff.
  - [ ] Security: quick pass on file parsing (untrusted input).
  - [ ] Accuracy: golden-file tests green in CI; cross-check one dataset against TradingView.
  - [ ] Commit: mandatory, no co-author trailer.

## Phase 2 - Indicator Framework

Goal: toggleable overlays and oscillators.

Deliverables:

  - [ ] Pure indicator functions in `chart-engine`: SMA, EMA, Bollinger Bands (overlays); RSI, MACD (sub-panes).
  - [ ] Show/hide indicator panel wired to series visibility.
  - [ ] Golden-file fixtures for every indicator.

Exit gate:

  - [ ] Validate: `/verify` toggles each indicator on and off against a known dataset.
  - [ ] Optimize: `/simplify` on the diff.
  - [ ] Review: `/code-review` on the diff.
  - [ ] Security: quick pass.
  - [ ] Accuracy: indicator golden-file tests green in CI.
  - [ ] Commit: mandatory, no co-author trailer.

## Phase 3 - Funds-Management Flagship Trio

Goal: the differentiated "how much quantity" tools that TradingView lacks.

Deliverables:

  - [ ] `@typhed/risk-toolkit` package (pure TS, seedable, deterministic).
  - [ ] Risk-based position sizer: fixed-fractional plus ATR-normalized.
  - [ ] Portfolio correlation and risk dashboard: correlation heatmap, portfolio volatility, historical VaR/CVaR.
  - [ ] Monte Carlo drawdown / risk-of-ruin simulator, seeded.
  - [ ] Each tool carries an entitlement slug from day one.

Exit gate:

  - [ ] Validate: `/verify` runs each tool against a known dataset and hand-checked expected outputs.
  - [ ] Optimize: `/simplify` on the diff.
  - [ ] Review: `/code-review` on the diff.
  - [ ] Security: quick pass.
  - [ ] Accuracy: risk-math golden-file tests green in CI.
  - [ ] Commit: mandatory, no co-author trailer.

## Phase 4 - Entitlement System

Goal: per-user tiered access with manual approval.

Deliverables:

  - [ ] `useEntitlements()` reading `user.publicMetadata.entitlements` / `tier`.
  - [ ] `<Entitled feature="…">` gate rendering an unlock state for locked tools.
  - [ ] Manual-approval flow documented (Clerk Dashboard edit); optional local admin script using the Clerk backend API.
  - [ ] Free vs paid split applied to existing tools via slugs.
  - [ ] Saved work in IndexedDB with JSON export/import.

Exit gate:

  - [ ] Validate: `/verify` confirms a paid tool locks and unlocks as a test entitlement is toggled.
  - [ ] Optimize: `/simplify` on the diff.
  - [ ] Review: `/code-review` on the diff.
  - [ ] Security: **mandatory** `/security-review` on the entitlement and storage surface.
  - [ ] Accuracy: not applicable this phase.
  - [ ] Commit: mandatory, no co-author trailer.

## Phase 5 - Python Advanced Lane and Hard Gate

Goal: the analytics where Python genuinely wins, plus real protection for high-value paid tools.

Deliverables:

  - [ ] `analytics-python` sources executed in a lazily loaded Pyodide runtime (numpy/pandas/scipy).
  - [ ] Risk-parity / equal-risk-contribution allocator, parametric VaR, efficient frontier.
  - [ ] Per-tool serverless verification (Cloudflare Worker or Vercel Edge) that checks the Clerk JWT and entitlement server-side for genuinely protected paid tools.

Exit gate:

  - [ ] Validate: `/verify` runs each Python tool client-side; the hard-gated tool refuses without a valid entitlement.
  - [ ] Optimize: `/simplify` on the diff.
  - [ ] Review: `/code-review` on the diff.
  - [ ] Security: **mandatory** `/security-review` on the serverless gate and JWT verification.
  - [ ] Accuracy: Python-lane outputs cross-checked against offline reference computations.
  - [ ] Commit: mandatory, no co-author trailer.

## Phase 6 - AI Chat

Goal: wire the placeholder chat FAB to real AI features and prompts.

Deliverables:

  - [ ] Chat panel wired to the AI backend (design deferred until this phase).
  - [ ] Prompt and analysis surfaces defined with the rest of the toolkit.

Exit gate:

  - [ ] Validate: `/verify` exercises a real chat round-trip.
  - [ ] Optimize: `/simplify` on the diff.
  - [ ] Review: `/code-review` on the diff.
  - [ ] Security: **mandatory** `/security-review` on any new external calls and secret handling.
  - [ ] Accuracy: not applicable this phase.
  - [ ] Commit: mandatory, no co-author trailer.

</div>
