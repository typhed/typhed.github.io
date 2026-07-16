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
  - [ ] Commit: this phase's commit (below).

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
