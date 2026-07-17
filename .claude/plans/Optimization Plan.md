<div align = "center">

# trading.typhed.com - Optimization and Audit Plan

</div>

<div align = "justify">

This is the execution roadmap for the `optimize/code` branch: a full-codebase audit of every
mathematical operation, a line-by-line production-grade review, a dependency-vulnerability sweep, and
the fixes that follow - executed in phases with one commit per phase and **no co-author trailer**. The
audit combined a direct read of the accuracy-critical code with three parallel review agents
(security, code-quality bug bounty, design/accessibility) plus `pnpm audit` and CVE research on every
locked dependency version. Functional and visual behaviour must match the pre-existing state except
where a finding is intentionally corrected; every phase revalidates with the full test, typecheck and
build gate before it commits.

## Audit Baseline

  * Branch `optimize/code` at `da652af` (after fast-forwarding the `enhancement/fields` merge).
  * Tests: 45 passing (31 chart-engine, 14 risk-toolkit). Web typecheck and static export build clean.
  * Pre-existing defect: `tsc --noEmit` fails in both engine packages (`types: ["node"]` with no
    `@types/node` dependency).
  * Reference static export snapshotted for the final parity diff.
  * Verified-correct math (no action): SMA/EMA/Bollinger/RSI/MACD, Kahan volume aggregation, Monday
    weekly anchor, Excel epoch, Acklam inverse-normal CDF, VaR/CVaR/parametric VaR, covariance and
    correlation, mulberry32 and Box-Muller, Monte Carlo drawdown, OLS GMP forecast with R-squared,
    Heckbert nice-scale, Cornish-Fisher and Jarque-Bera (Python lane), retail allotment probability.

## Phase A - Toolchain and Supply Chain

Goal: a green typecheck everywhere and zero known-vulnerable dependencies before any code change.

  - [x] `xlsx` `0.18.5` (CVE-2023-30533 prototype pollution, CVE-2024-22363 ReDoS; unfixable on the
    npm registry) - replace with the patched SheetJS CDN tarball `0.20.3` in `@typhed/chart-engine`.
  - [x] `vitest` `2.1.9` (critical GHSA-5xrq-8626-4rwp; also pulls a vulnerable `vite`) - bump both
    engine packages to `^3.2.6`, with `vite` / `esbuild` / `postcss` overrides for the remaining
    transitive advisories.
  - [x] Add `@types/node` to both engine packages - fixes the pre-existing `TS2688` typecheck failure.
  - [x] `@clerk/react` `6.12.3` to `6.12.4` (patch).
  - [x] Pin `pnpm/action-setup@v4` to its commit SHA in `deploy.yml`.
  - [x] Compatibility gate: 49 tests green (4 new CSV/XLSX parse tests), typecheck all packages,
    static export build, `pnpm audit` reports zero known vulnerabilities.
  - [x] Commit (no co-author trailer).

## Phase B - Mathematical and Correctness Fixes

Goal: every surviving Part-1 math finding fixed, with regression tests.

  - [x] HNI expected profit double-discounts (`lib/ipo/applications.ts`): oversubscribed sHNI/bHNI
    multiplied the win-probability lower bound by the already-proportionate quantity, understating the
    expectation by roughly the subscription factor. Expected units become `applied / t` directly.
    SUPERSEDED by the owner's product rule (post-review): applied quantity is whole lots only
    (`floor(corpus / cutoff / lotSize) x lotSize` in "total" mode - partial-lot allotment does not
    exist in India, non-multiples are floored and flagged), and Expected Profit shows the same
    full-allotment figure as Best-Case until the allotment outcome is recorded; the win-probability
    badge alone carries the odds. Pinned by the owner's ₹12,23,768 / 574 / 26 = 82-lot example.
  - [x] Year-over-year growth on a non-positive base (`lib/ipo/analytics.ts`): a loss-to-profit swing
    rendered as negative growth. Non-positive bases now yield NaN ("not meaningful"), shown as `-`.
  - [x] NaN tone bugs: `NaN >= 0` picked the negative/positive tone for missing values in
    `ipo-overview` and `ipo-financials` - a shared NaN-safe tone helper fixes all sites.
  - [x] `fmtMoney` / `fmtNumber` used the runtime locale (hydration mismatch risk against prerendered
    HTML; inconsistent grouping) - pin `en-IN` to match `fmtInr`.
  - [x] "Today" was the UTC date (`toISOString().slice`), off by one for IST users before 05:30 -
    compute the local calendar date.
  - [x] Edit-panel focus steal: an inline `onClose` prop re-ran the mount effect on every keystroke,
    yanking focus to the Close button - callback ref plus a memoized caller; the effect depends on
    `open` alone.
  - [x] Pyodide retry dead-end: a failed CDN script load left the tag in the DOM so every retry
    short-circuited - remove the tag on error.
  - [x] Python error sentinel ignored: a constant series returned `{"error": 1}` that the UI cast
    blindly, rendering "Normality rejected" - surface it as an error message.
  - [x] `covarianceMatrix` missing the `n - ddof <= 0` guard that `variance` has.
  - [x] `validateCandles` never checked `time` for finiteness - add the check plus test.
  - [x] IPO dashboard persisted the untouched seed on first visit and instantly undid Reset - persist
    only after a real edit (`dirtyRef` gating), plus `max` clamps on the percent inputs.
  - [x] Documentation corrections: RSI flat-series comment, schema-version migration claim,
    `DEFAULT_IPO_DATASET` "deterministic ids" comment, auto-timestamp heuristic ranges.
  - [x] New web test lane (`vitest`): 22 tests covering applications (retail lottery, HNI
    proportionate expectation, clamping, -0, contributor splits), analytics growth/forecast, and
    format helpers; chart-engine validation gains the non-finite-time test. 72 tests green overall.
  - [x] Commit (no co-author trailer).

## Phase C - Security Hardening

Goal: the security agent's confirmed findings closed.

  - [x] Cap row counts in `safeParseIpoDataset` (a crafted import with a huge array crashed the tab).
  - [x] Replace spread-based `Math.min(...)` / `Math.max(...)` over user-sized arrays with loops
    (`gmpStats`, GMP chart, financials chart, Monte Carlo worst-drawdown) via a shared `valueRange`.
  - [x] Validate saved-analysis imports (shape-check every candle, cap length, surface failures
    instead of a silent `catch`).
  - [x] Subresource integrity + `crossorigin` on the Pyodide CDN script (hash precomputed from the
    pinned 0.26.4 artefact).
  - [x] React error boundaries (`app/error.tsx`, `app/global-error.tsx`) so a render crash no longer
    white-screens the page.
  - [x] Upload race guard and an unhandled-rejection fix for Save in the workspace.
  - [x] Duplicate CSV headers: the reported defect was disproved by experiment - papaparse 5.5
    renames duplicates natively (`close_1`) - so the behaviour is pinned by a test instead of code.
  - [x] Commit (no co-author trailer).

## Phase D - Deduplication and Dead Code

Goal: repeated logic collapsed and dead weight removed with zero behaviour change (fixtures and
rendered output identical).

  - [x] `ema` delegates to `emaSeries` (identical recursion duplicated in `chart-engine`); the
    pandas golden-fixture tests confirm bit-identical output.
  - [x] `formatProbability` reuses `formatPercentShort`; segmented-mode options hoisted
    (`ENTRY_MODE_OPTIONS`); `FALLBACK_ISO_DATE` hoisted in the editors.
  - [x] Shared `downloadJson` helper (IPO dashboard + saved analyses duplicated the Blob dance).
  - [x] Shared `newId` in `lib/id.ts` (duplicated UUID fallback in `ipo/defaults` and `storage`).
  - [x] `timeframeOptions` reuses the exported `canAggregate` instead of re-implementing it.
  - [x] One `isListingMilestone` helper for the three scattered listing-label tests.
  - [x] `fmtCompact` moved to `lib/format.ts` (now also locale-pinned); shared `ChartEmptyState`
    extracted for the two IPO charts.
  - [x] Dead code removed: `DEFAULT_SUBSCRIPTION_CATEGORIES`, `minInvestmentLower`, unused
    `IndicatorMeta.placement`. Library API of `@typhed/risk-toolkit` (`logReturns`, `equityCurve`,
    `normalSampler`) is deliberately kept - documented as public surface.
  - [x] Commit (no co-author trailer).

## Phase E - Design, Accessibility and Copy

Goal: the design agent's confirmed findings closed without altering the visual language.

  - [x] Success/warning theme tokens (light-theme `text-emerald-500` / `text-amber-500` fail WCAG
    contrast on white cards) - the light values sit at the 700 shades (>= 4.5:1), the dark values
    equal the previous 500s so dark rendering is unchanged; all 8 sites migrated.
  - [x] Clerk modal accent follows the active theme (ThemeProvider now wraps ClerkAuthProvider).
  - [x] `aria-pressed` on `Segmented` and `TimeframeSelect`; `aria-expanded` + `aria-controls` on
    the integrity disclosure; focus-visible rings on the segmented controls, chat send and FAB.
  - [x] Space-key scroll fix on the upload dropzone; Tab focus trap in the edit drawer; chat panel
    width clamp for 320 px viewports.
  - [x] Copy: "ALLOTED"/"Alloted"/"Cutt-Off" corrected, false "30% tax bracket Net Profit" claim
    removed, grammar fixes, deterministic dd-mm-yyyy saved-analysis timestamp.
  - [x] Commit (no co-author trailer).

## Phase F - Verification and Parity

Goal: prove the branch behaves like the reference except where a fix intentionally changed it.

  - [x] Full gate: 73 tests green (37 chart-engine, 14 risk-toolkit, 22 web), typecheck clean in all
    packages, static export builds, `pnpm audit` reports zero known vulnerabilities.
  - [x] Route sizes: `/` 292 kB and `/tools/ipo` 162 kB first-load (was 279 kB / 161 kB) - the
    growth is the patched SheetJS 0.20.3, which is larger than the vulnerable 0.18.5.
  - [x] HTML text diff against the reference snapshot: the workspace page is identical; the IPO page
    differs only in the intended empty-state copy rewrite. No unintended visual or text change.
  - [x] Final report delivered: scores, residual risks, deliberate non-fixes.

## Deliberate Non-Fixes (Reported, Not Changed)

  * Calendar-day annualisation (365.25 d) instead of 252 trading days - a disclosed convention; the
    UI states the exact figure it assumes.
  * `auto` timestamp heuristic cannot represent pre-2001 unix-seconds data - irreducible ambiguity
    with Excel serials; documented instead.
  * Comma-stripping number parsing (European decimal commas misread) - Indian/US convention assumed.
  * Soft client-side entitlement gating - inherent to a static export and honestly documented; the
    hard gate is the serverless reference stub.
  * Conditional hook in `useEntitlements` - safe behind a build-time constant, documented.
  * Build-time copyright year and `prefers-color-scheme` theme-color metas - cosmetic, noted.

</div>
