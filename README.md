<div align = "center">

# TyPhed Trading

[![Next.js](https://img.shields.io/badge/Next.js-%2015-003B57?style=plastic&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-%205.7-003B57?style=plastic&logo=typescript)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-%2011.9-003B57?style=plastic&logo=pnpm)](https://pnpm.io)
[![Turborepo](https://img.shields.io/badge/Turborepo-%20monorepo-003B57?style=plastic&logo=turborepo)](https://turbo.build)
[![GitHub Pages](https://img.shields.io/badge/Hosted-%20GitHub%20Pages-003B57?style=plastic&logo=githubpages)](https://pages.github.com)

</div>

<div align = "justify">

The third leg of the TyPhed project. A client-side chart-analysis and funds-management platform: upload
your own historic market data (CSV or XLSX), render a fluid TradingView-style chart, and answer the
questions retail tools skip - **how much quantity, how much risk, how to allocate capital**. Everything
runs in the browser; the site is statically hosted, so no market data ever leaves the device.

## 🧠 Why This Exists

TradingView already answers &quot;at what price&quot;. This platform answers &quot;how much quantity&quot; -
the institutional lane of position sizing, portfolio risk, and capital allocation found in tools like the
Bloomberg Terminal and BlackRock Aladdin, plus one-off analyses that off-the-shelf charts do not offer.

## 🚀 Getting Started

```shell
$ pnpm install
$ pnpm dev
```

The app runs at `http://localhost:3000`. Authentication is OFF until a Clerk key is set, so the workspace
is reachable straight away for local development.

To enable the shared TyPhed login, copy `apps/web/.env.example` to `apps/web/.env.local` and set
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to the same publishable key used by the main site and blog.

## 📦 Repository Layout

```text
apps/web                  Next.js 15 App Router, static export
packages/config-tailwind  Shared Tailwind preset (@typhed/tailwind-config)
packages/config-typescript  Shared tsconfig bases (@typhed/tsconfig)
```

Further packages (`chart-engine`, `risk-toolkit`, `analytics-python`) arrive in later phases and hold the
accuracy-critical logic in isolated, unit-tested units.

## 🧭 Roadmap

The phase-by-phase plan and its per-phase exit gates live in
[Initial Plan.md](.claude/plans/Initial%20Plan.md). Each phase is validated, simplified, reviewed,
security-checked, and committed before the next begins.

## 🧪 Build and Verify

```shell
$ pnpm --filter web build
$ pnpm --filter web typecheck
```

`build` produces the static export at `apps/web/out`, which is what deploys to GitHub Pages.

## ⚠️ Disclaimer

This platform is a decision-support tool, not investment advice. It can contain errors. Verify every
figure independently before it informs a real trade.

</div>
