<div align = "center">

# TyPhed Developer Guide

[![Next.js](https://img.shields.io/badge/Next.js-%2016-000000?style=plastic&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-%206-3178C6?style=plastic&logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-%2026%20LTS-5FA04E?style=plastic&logo=nodedotjs)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%20workspace-F69220?style=plastic&logo=pnpm)](https://pnpm.io)
[![Turborepo](https://img.shields.io/badge/Turborepo-%202-EF4444?style=plastic&logo=turborepo)](https://turborepo.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-%204-06B6D4?style=plastic&logo=tailwindcss)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-%20components-000000?style=plastic&logo=shadcnui)](https://ui.shadcn.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-%20Workers-F38020?style=plastic&logo=cloudflareworkers)](https://workers.cloudflare.com)
[![Python](https://img.shields.io/badge/Python-%203.13-3776AB?style=plastic&logo=python)](https://www.python.org/)
[![Jinja2](https://img.shields.io/badge/Jinja2-%203.1.6-B41717?style=plastic&logo=jinja)](https://jinja.palletsprojects.com/)
[![Live Site](https://img.shields.io/badge/typhed.com-%20Live-2EA44F?style=plastic&logo=googlechrome)](https://typhed.com/)

</div>

<div align = "justify">

This guide is for developers working on the TyPhed web estate: the brand hub `apps/web` (typhed.com) and the product
subdomains `apps/trading` (trading.typhed.com) and `apps/blogging` (blog.typhed.com). Each app is a static export served
by its own Cloudflare Worker, and all three render one shared brand layer from `packages/`. One rule shapes every
change: a value lives in exactly one place, and everything else reads it. The [README](../README.md) describes the
products, and the [documentation index](README.md) maps every reference page.

## 🚀 Getting Started

You need three tools. pnpm brings the right Node.js with it:

<div align = "center">

| Tool | Version | Role |
| :---: | :---: | --- |
| pnpm | 12.21.0 | Pinned in `packageManager`; installs the workspace and runs every script. |
| Node.js | 26.13.1 LTS | Pinned in `devEngines.runtime`; pnpm downloads it and runs the workspace scripts on it. |
| Python | 3.13 | Builds the web app's redirect pages with Jinja2 3.1.6. |

</div>

Any recent pnpm switches itself to the pinned version, then downloads the pinned Node.js and runs the workspace scripts
with it. Node.js 26 ships no Corepack, so pnpm itself comes from npm. The install still runs the build steps of
`esbuild` and `workerd` on the Node.js already on your `PATH`.

```shell
$ npm install --global pnpm
$ pnpm install
$ pip install -r permalink/requirements.txt
```

Every third-party dependency, with its one version, is declared in the root [package.json](../package.json), and one
`node_modules` at the root serves all three sites. An app or package lists only the `@typhed/*` packages it uses. Add or
upgrade a dependency at the root, never in an app; [Workspace And Task Graph](architecture.md#workspace-and-task-graph)
explains the versions held back.

### Environment Variables

Copy `.env.example` to `.env.local` at the repository root. One file configures all three apps. Every value is a public,
build-time `NEXT_PUBLIC_*` value that ships to the browser, not a secret, and in CI each one is a GitHub Actions
repository Variable of the same name.

<div align = "center">

| Variable | Used By | Purpose |
| :---: | :---: | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | All three apps | The shared sign-in. Use the Clerk **development** key locally, since the production key works only on typhed.com hostnames. Leave it empty to run with sign-in turned off: every sign-in gate opens, and the Pro tools stay locked. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Blog | Google Analytics 4 measurement id. |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Blog | Google AdSense publisher id. |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Blog | Microsoft Clarity project id. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Blog | Google Search Console verification token. |

</div>

Each blog value renders nothing until it is set.

## 🖥️ Local Development

`pnpm dev` starts all three sites with hot reload. Before every dev run and every build, each app runs
`typhed-brand-sync`, which writes its `app/theme.css` and `public/brand/` from `packages/brand`.

<div align = "center">

| Site | App | Development | Production Preview |
| :---: | :---: | :---: | :---: |
| typhed.com | `apps/web` | `http://localhost:3000` | `http://localhost:8787` |
| trading.typhed.com | `apps/trading` | `http://localhost:3001` | `http://localhost:8788` |
| blog.typhed.com | `apps/blogging` | `http://localhost:3002` | `http://localhost:8789` |

</div>

Run one site with `pnpm --filter trading dev`. To see a site exactly as Cloudflare serves it, build first and then start
its preview: `pnpm build`, then `pnpm --filter web preview`. With the Clerk key empty, sign-in is off and every
sign-in gate lets you through, so the trading workspace opens straight away.

## 📦 Project Structure

```text
apps/
  web/                  typhed.com
  trading/              trading.typhed.com
  blogging/             blog.typhed.com
packages/
  brand/                @typhed/brand - brand JSON, properties.json, tokens, artwork, typhed-brand-sync
  ui/                   @typhed/ui - page shell, header, footer, sidebar, theme, Button, Icon, metadata helpers
  auth/                 @typhed/auth - sign-in provider, header control, gates, entitlements
  config-next/          @typhed/next-config - createNextConfig()
  config-tailwind/      @typhed/tailwind-config - Tailwind base stylesheet, preset, content globs, PostCSS
  config-typescript/    @typhed/tsconfig - TypeScript bases
  chart-engine/         trading: parsing, timeframes, indicators
  risk-toolkit/         trading: statistics, sizing, Monte Carlo
  backtest/             trading: EMA swing backtester
  entitlement-gate/     trading: server-side entitlement check (not deployed)
  analytics-python/     trading: NumPy/SciPy reference test
permalink/              redirect generator for typhed.com/permalink/
scripts/                deploy-targets.mjs
docs/                   architecture, product, brand and design references, component docs, ADRs, tool logs
```

An app's folder name is also its package name and the suffix of its Worker's name, `typhed-<app>`. Each app's own
README covers its local setup and layout.

## 🔁 Shared Code

Everything the three sites have in common lives in `packages/`, and each app compiles it from source, so a change there
shows up in every site's next `pnpm dev` or build. Change it once, for the whole brand. Four rules keep that layer safe
to change:

  * A change in `packages/` reaches every site: add the new shape, update the apps, then remove the old one.
  * `@typhed/ui` stays free of auth and of any single property. Behaviour that only one property needs stays in its app
    or behind a prop, and `@typhed/auth`, the only package the sites import Clerk through, reaches the shell as a slot.
  * Every icon is Font Awesome, rendered through `Icon` from `@typhed/ui/components/icon`.
  * Brand strings, links, and colours are never hardcoded. They come from the JSON in `packages/brand`.

The [component reference](agents/components/README.md) documents each shared component.

## 🔗 Permanent Redirects

[permalink/config/links.toml](../permalink/config/links.toml) lists the short links served under
`typhed.com/permalink/`:

```toml
[links."conduct.html"]
label = "The Code of Conduct"
target = "https://github.com/typhed/.github/blob/master/.github/CODE_OF_CONDUCT.md"
```

  * **key** - the path served at `https://typhed.com/permalink/<key>`.
  * **target** - the destination URL, checked to be `http`/`https` at build time.
  * **label** - optional link text shown on the fallback page (defaults to `destination`).

The web app's build writes a redirect page and a Cloudflare `_redirects` rule for every entry.

## 🎨 Common Changes You Might Want

  * **Change the brand text.** Edit [site.json](../packages/brand/site.json) for the brand name, tagline, canonical
    URL, and description.
  * **Change a site's name, description, or product menu.** Edit its entry in
    [properties.json](../packages/brand/properties.json).
  * **Change the menu bar, footer links, social accounts, or contact email.** Edit
    [navigation.json](../packages/brand/navigation.json).
  * **Change the launch date.** Edit [launch.json](../packages/brand/launch.json); the value is UTC.
  * **Change the colours.** Edit [colors.json](../packages/brand/tokens/colors.json), which holds both themes.
  * **Change the logo or favicon.** Replace the files in [packages/brand/assets](../packages/brand/assets).
  * **Add or change a redirect.** Edit [links.toml](../permalink/config/links.toml).
  * **Write a blog post.** Add an `.mdx` file under
    [apps/blogging/content/blog](../apps/blogging/content/blog); the [blog's README](../apps/blogging/README.md)
    covers the frontmatter.
  * **Add a subdomain.** Add one entry to [properties.json](../packages/brand/properties.json) and an app folder; the
    [subdomain model](brand/subdomain-model.md) covers domains, Workers, and DNS.

## 🚢 Putting It Live

Every push to `master` deploys the sites it affects to Cloudflare Workers, one Worker per site, and a manual run of the
**Deploy to Cloudflare Workers** workflow deploys `all` apps or a comma-separated list of them on demand. An app is
deployable when it has an `apps/<app>/wrangler.jsonc`. The deploy job stops when the Clerk key Variable is missing, and
it publishes with the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. The
[deployment pipeline](architecture.md#deployment-pipeline) covers the rest.

## 🧪 Useful Commands

<div align = "center">

| Command | What It Does |
| :---: | --- |
| `pnpm dev` | Runs all three sites locally with hot reload. |
| `pnpm build` | Builds the three static exports into `apps/*/out`. |
| `pnpm --filter <app> preview` | Serves a built site through `wrangler dev`, as Cloudflare does. |
| `pnpm lint` | ESLint across the workspace. |
| `pnpm typecheck` | `tsc --noEmit` in every app and package. |
| `pnpm test` | The Vitest suites of the trading app, its three packages, the blog's post loader, and the brand contract. |
| `pnpm format` / `pnpm format:check` | Prettier write / check. |
| `pnpm clean` | Removes each app's and package's build output. |

</div>

CI runs the same gates on every pull request and on `master`. Run them in this order before you push:

```shell
$ pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

To run one test file, or one test by name:

```shell
$ pnpm --filter @typhed/risk-toolkit exec vitest run test/stats.test.ts
$ pnpm --filter trading exec vitest run -t "<test name>"
```

</div>
