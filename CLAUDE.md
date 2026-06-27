# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A pnpm + Turborepo monorepo that builds two independent artifacts and publishes them to one GitHub Pages site at
`typhed.com`:

  * `apps/web` - a Next.js 15 (App Router, React 19) site exported to static HTML.
  * `permalink/` - a Python + Jinja2 generator that renders zero-cost redirect pages served under `/permalink/`.

The two are stitched together at deploy time: the redirect pages are generated into the web app's export output, so the
site and its redirects ship in a single Pages deployment.

## Reference Docs (Read Before Editing)

Detail lives in [docs/](docs/), not in this file. Consult it before touching the relevant area:

  * [docs/components/README.md](docs/components/README.md) - the component library reference (props, variants,
    accessibility, do's and don'ts). One page per durable component.
  * [docs/design/colors.yml](docs/design/colors.yml) - the color system: every theme token, its hex, where it is used,
    and the rules for changing colors. This is the source of truth for any color work.

## Commands

Run from the repo root unless noted. Turbo fans each script out across the workspace.

| Command | What It Does |
| :---: | --- |
| `corepack enable && pnpm install` | One-time setup. pnpm version is pinned in `package.json` (`packageManager`). |
| `pnpm dev` | Run the site locally with hot reload at `localhost:3000`. |
| `pnpm build` | Produce the static export into `apps/web/out`. |
| `pnpm lint` | ESLint across the workspace. |
| `pnpm typecheck` | `tsc --noEmit` across the workspace. |
| `pnpm format` / `pnpm format:check` | Prettier write / check. |
| `pnpm clean` | Remove build output and `node_modules`. |
| `pnpm --filter web <script>` | Run a single package's script, for example `pnpm --filter web build`. |
| `pip install -r permalink/requirements.txt` | Install the redirect generator dependency (Jinja2). Python 3.13. |
| `python permalink/src/build.py` | Render redirect pages from `links.toml`. Override paths with `--config`, `--template`, `--output` (default output is `permalink/dist`). |
| `pnpm dlx serve apps/web/out` | Preview the built static site (a plain file server; the export has no Node runtime). |

There is no automated test suite. The quality gates are `pnpm lint` and `pnpm typecheck`; CI additionally runs the
production build. Requires Node 20+ (CI builds on Node 22).

## Architecture

### Static export model

`apps/web` builds with `output: "export"` (see [next.config.mjs](apps/web/next.config.mjs)), so there is no server at
runtime. Two consequences shape most decisions: `trailingSlash: true` emits `route/index.html` directories for Pages, and
`images.unoptimized` is required because no Image Optimization server exists. Anything that needs a server (API routes,
SSR, `next start`) will not work; treat the output as plain files.

### Shared packages consumed from source

The shared package `@typhed/ui` ([packages/ui](packages/ui)) is not pre-built. The web app lists it under
`transpilePackages`, so Next compiles it from `.tsx` source on every build. Edits to components take effect directly with
no separate build step. Two config packages back the apps: `@typhed/tailwind-config` (the shared Tailwind preset) and
`@typhed/tsconfig`. Import paths follow the package export map: `@typhed/ui/components/<name>` and `@typhed/ui/lib/<name>`.

### Theming and color tokens

Colors are HSL CSS variables defined in [apps/web/app/globals.css](apps/web/app/globals.css): light theme ("Aurora
Glass") under `:root`, dark theme ("Midnight Indigo", the default) under `.dark`. The shared Tailwind preset
([packages/config-tailwind/tailwind.config.js](packages/config-tailwind/tailwind.config.js)) maps each token to a utility
via `hsl(var(--token))`, so components use classes like `bg-brand` and never raw hex. `next-themes` toggles the `.dark`
class. Static raster assets (favicon, OG image, logo, manifest) carry their own hardcoded hex that must be kept in sync by
hand. The full token tables and the sync rules are in [docs/design/colors.yml](docs/design/colors.yml).

### Single source of truth for content

Brand strings, the launch date, and contact links live in [packages/ui/lib/constants.ts](packages/ui/lib/constants.ts).
Every app and component reads from there. Change copy, the launch target, or social links in that one file rather than in
markup.

### Permalink redirect generator

[permalink/src/build.py](permalink/src/build.py) reads [permalink/config/links.toml](permalink/config/links.toml) (a
`[links."<output>.html"]` table per redirect, each with a `target` and optional `label`) and renders one self-contained
HTML page per entry from [redirect.jinja](permalink/src/templates/redirect.jinja). Targets are validated as absolute
`http`/`https` URLs at build time. Each page redirects via canonical link, `meta refresh`, and a `location.replace`
fallback, and carries `noindex, nofollow`. To add a redirect, add a table to `links.toml`; no code change is needed.

### Deployment

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs on a published GitHub Release or manual
`workflow_dispatch`. It builds the web app (`pnpm --filter web build`), then generates the redirect pages directly into
`apps/web/out/permalink/`, and deploys that combined directory to GitHub Pages. There is no push-to-deploy on `master`;
publishing a Release is what ships the site.

## Conventions

  * **The current landing page is temporary.** `apps/web` renders a work-in-progress holding page. Its WIP-only
    components (`WipLanding`, `CountdownTimer`, `LaunchProgress`) are deliberately excluded from
    [docs/components/](docs/components/) and are slated for replacement. Do not document them or treat them as the
    permanent product architecture.
  * **Colors go through tokens.** Never hardcode a hex value in a component. Edit the token in `globals.css`, and when a
    change affects a static asset, update its hardcoded hex too (see [colors.yml](docs/design/colors.yml)).
  * **Markdown and commits are skill-governed.** This repo carries skills that own `*.md` formatting (`markdown-format`)
    and commit messages (`git-commiter`, which requires an emoji-prefixed subject). Follow them when editing docs or
    committing.
