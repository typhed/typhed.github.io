<div align = "center">

# TyPhed - Engineering Tomorrow

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

**TyPhed - Engineering Tomorrow** is a technology-driven brand built around privacy and data security, and this monorepo
is its entire web estate. Three properties ship from one codebase, one design system, and one sign-in: the brand hub at
**typhed.com** and two purpose-built product subdomains, **blog.typhed.com** and **trading.typhed.com**. A visitor meets
the same header, footer, colours, and account wherever they land, and each product still moves at its own pace.

## 🧠 What Is Inside

  * **The brand hub, `typhed.com`** - the brand, marketing, SEO, and informational home, with a launch countdown on its
    work-in-progress landing page and permanent short links under `typhed.com/permalink/`.
  * **The trading product, `trading.typhed.com`** - bring your own market data, then chart it, size positions, test
    strategies, and run Monte Carlo simulations, with every byte kept in the browser.
  * **The blog, `blog.typhed.com`** - product notes, engineering write-ups, and example documentation, with public posts
    and members-only freemium posts.
  * **One shared layer** - one brand contract, one design system, one page shell, and one sign-in that every property
    reads, so a brand change ships everywhere in a single commit.

What each property is for is set out in the [product requirements document](docs/PRD.md); how the monorepo is built is
in the [architecture reference](docs/architecture.md); every design decision is dated in [docs/adr](docs/adr/README.md).

## 🚀 Getting Started

You need Node.js, pnpm, and Python 3.13, which builds the web app's redirect pages. Any recent pnpm switches itself to
the version the repository pins, then downloads the pinned Node.js 26 LTS and runs the workspace scripts with it. The
install itself runs the build steps of `esbuild` and `workerd` on the Node.js already on your `PATH`.

```shell
$ npm install --global pnpm
$ pnpm install
$ pip install -r permalink/requirements.txt
```

Every dependency, with its one version, is declared in the root [package.json](package.json), and one `node_modules` at
the root serves all three sites. Add or upgrade a dependency there, never in an app.

Copy `.env.example` to `.env.local` at the repository root and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to the Clerk
**development** key. One file configures all three apps. Leave the key empty to run with sign-in turned off.

## 🖥️ Local Development

`pnpm dev` starts all three sites with hot reload:

<div align = "center">

| Site | App | Development | Production Preview |
| :---: | :---: | :---: | :---: |
| typhed.com | `apps/web` | `http://localhost:3000` | `http://localhost:8787` |
| trading.typhed.com | `apps/trading` | `http://localhost:3001` | `http://localhost:8788` |
| blog.typhed.com | `apps/blogging` | `http://localhost:3002` | `http://localhost:8789` |

</div>

Run one site with `pnpm --filter trading dev`. To see a site exactly as Cloudflare serves it, build first and then start
its preview: `pnpm build`, then `pnpm --filter web preview`.

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
docs/                   PRD, architecture, ADRs, brand, design, component docs
```

## 🔁 Shared Code

Everything the three sites have in common lives in `packages/` and is compiled from source by each app, so a change
there shows up in every site's next `pnpm dev` or build. Change it once, for the whole brand. The
[component reference](docs/components/README.md) documents each shared component.

## 🔗 Permanent Redirects

[permalink/config/links.toml](permalink/config/links.toml) lists the short links served under `typhed.com/permalink/`:

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

  * **Change the brand text.** Edit [site.json](packages/brand/site.json) for the brand name, tagline, canonical URL,
    and description.
  * **Change a site's name, description, or product menu.** Edit its entry in
    [properties.json](packages/brand/properties.json).
  * **Change the menu bar, footer links, social accounts, or contact email.** Edit
    [navigation.json](packages/brand/navigation.json).
  * **Change the launch date.** Edit [launch.json](packages/brand/launch.json); the value is UTC.
  * **Change the colours.** Edit [colors.json](packages/brand/tokens/colors.json), which holds both themes.
  * **Change the logo or favicon.** Replace the files in [packages/brand/assets](packages/brand/assets).
  * **Add or change a redirect.** Edit [links.toml](permalink/config/links.toml).

## 🚢 Putting It Live

Every push to `master` deploys the sites it affects to Cloudflare Workers, one Worker per site; a manual run of the
**Deploy to Cloudflare Workers** workflow deploys any site on demand. The
[deployment pipeline](docs/architecture.md#deployment-pipeline) lists the secrets and variables it uses.

## 🧪 Useful Commands

<div align = "center">

| Command | What It Does |
| :---: | --- |
| `pnpm dev` | Runs all three sites locally with hot reload. |
| `pnpm build` | Builds the three static exports into `apps/*/out`. |
| `pnpm --filter <app> preview` | Serves a built site through `wrangler dev`, as Cloudflare does. |
| `pnpm lint` | ESLint across the workspace. |
| `pnpm typecheck` | `tsc --noEmit` in every app and package. |
| `pnpm test` | The Vitest suites of the trading app and its packages. |
| `pnpm format` / `pnpm format:check` | Prettier write / check. |
| `pnpm clean` | Removes each app's and package's build output. |

</div>

## ⚠️ Project Release Names Disclaimer

Our release codenames are inspired by spells from the Harry Potter series created by J.K. Rowling. "Harry Potter" and
all related names, characters, spells, places, and indicia are trademarks of, and copyrighted by, Warner Bros.
Entertainment Inc., J.K. Rowling, and/or their respective rights holders. **TyPhed - Engineering Tomorrow** is an
independent project and is not affiliated with, endorsed by, sponsored by, or in any way officially connected to Warner
Bros. Entertainment Inc., J.K. Rowling, or any of their subsidiaries or affiliates. These names are used solely as
internal release identifiers, in tribute, with no claim of ownership and no intent to imply any official association.
All rights in the original works and marks remain the property of their respective owners.

## ⚖️ Ownership And License

```text
Copyright © 2026 TyPhed - Engineering Tomorrow
```

</div>
