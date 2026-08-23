# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A pnpm + Turborepo monorepo that builds two independent artifacts and publishes them to one GitHub Pages site at
`typhed.com`:

  * `apps/web` - a Next.js 15 (App Router, React 19) site exported to static HTML.
  * `permalink/` - a Python + Jinja2 generator that renders zero-cost redirect pages served under `/permalink/`.

The two are stitched together at deploy time: the redirect pages are generated into the web app's export output, so the
site and its redirects ship in a single Pages deployment.

## What This Product Is

[PRD.md](PRD.md) is the product requirements document and the source of truth for scope. Read it before adding a page, a
route, or a feature: most "does this belong here?" questions are answered there and nowhere in the code.

`typhed.com` is the **brand and acquisition layer** for the TyPhed ecosystem, not a product host. It owns brand
positioning, the product ecosystem overview, SEO and marketing content, company and about information, high-level
product information, legal and compliance pages, and cross-product navigation. Each product runs on its own subdomain
and is free to choose its own architecture, UX, and design. Those subdomains are maintained in separate repositories and
may not be visible from this one at all, so do not expect to find product code here: `blog.typhed.com` is already live,
carrying the blog, product notes, and example documentation. Build the path from discovery to trust to product selection
here, and leave the product experience to the product subdomain. A feature that belongs to one product does not belong
in this repository.

One brand principle has teeth for the code: TyPhed is built on privacy, with no user data tracking or sharing. Adding an
analytics script, a tracking pixel, or any third-party tag that observes visitors is therefore a brand decision, not a
routine one. Raise it rather than wiring it in.

## Reference Docs (Read Before Editing)

Detail lives in [PRD.md](PRD.md) and [docs/](docs/), not in this file. Consult the relevant one before touching an area:

  * [PRD.md](PRD.md) - the product requirements document: what the site is for, what belongs on it, the domain and
    subdomain model, and the brand principles behind them.
  * [docs/architecture.md](docs/architecture.md) - how the system is built and why. The static export model, the task
    graph, shared packages, theming, auth, the redirect generator, the deploy pipeline, and the constraints that hold
    them together.
  * [docs/components/README.md](docs/components/README.md) - the component library reference (props, variants,
    accessibility, do's and don'ts). One page per durable component.
  * [docs/design/colors.yml](docs/design/colors.yml) - the color system: every theme token, its hex, where it is used,
    and the rules for changing colors. This is the source of truth for any color work.
  * [docs/design/spacing.yml](docs/design/spacing.yml) - the layout system: the step scale, the container and its
    gutters, breakpoints, the fluid vertical rhythm of the full-height sections, fixed component sizes, and the radius
    map. Read it before changing any padding, margin, gap, or width.
  * [docs/design/typography.yml](docs/design/typography.yml) - the type system: the two loaded fonts and how they reach
    the browser, the size scale, weights, tracking, heading semantics, and the baked-in type that cannot follow the
    theme. Read it before changing any font, size, or heading level.

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

The architecture reference is [docs/architecture.md](docs/architecture.md). Read it before changing build configuration,
the package graph, theming, authentication, or the deploy workflow, rather than inferring the design from the code. Do
not restate it here; keep new architectural detail in that file. It covers:

  * The static export model: no runtime, `trailingSlash`, `images.unoptimized`, and which Next.js features are therefore
    unavailable.
  * The pnpm workspace layout and the Turborepo task graph, including what is cached and what depends on what.
  * Shared packages consumed from source: `@typhed/ui`, its export map, and the tsconfig and Tailwind preset chain.
  * Theming and color tokens, the page shell, the scroll model, and the Server / Client component boundary.
  * The content single source of truth in [packages/ui/lib/constants.ts](packages/ui/lib/constants.ts).
  * Client-side Clerk authentication and where the publishable key comes from in local development and in CI.
  * The permalink redirect generator and the release-triggered deployment pipeline.
  * The load bearing constraints a change must not break, and how to extend the workspace with a new app or package.

## Conventions

  * **The current landing page is temporary.** `apps/web` renders a work-in-progress holding page. Its WIP-only
    components (`WipLanding`, `CountdownTimer`, `LaunchProgress`) are deliberately excluded from
    [docs/components/](docs/components/) and are slated for replacement by the brand hub described in [PRD.md](PRD.md).
    Do not document them or treat them as the permanent product architecture.
  * **Colors go through tokens.** Never hardcode a hex value in a component. Edit the token in `globals.css`, and when a
    change affects a static asset, update its hardcoded hex too (see [colors.yml](docs/design/colors.yml)).
  * **Spacing and type come from the system.** Stay on the Tailwind step scale and the documented type scale instead of
    reaching for arbitrary values; the two sanctioned exceptions, the fluid `clamp()` rhythm inside full-height sections
    and the fluid page headlines, are documented in [spacing.yml](docs/design/spacing.yml) and
    [typography.yml](docs/design/typography.yml). The header height and `scroll-padding-top` in `globals.css` are a sync
    pair: change one and you must change the other.
  * **Markdown and commits are skill-governed.** This repo carries skills that own `*.md` formatting (`markdown-format`)
    and commit messages (`git-commiter`, which requires an emoji-prefixed subject). Follow them when editing docs or
    committing.
