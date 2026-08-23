# CLAUDE.md

@shared/documents/claude/brand.md
@shared/documents/claude/conventions.md
@shared/documents/claude/shared-workflow.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. The brand context,
the shared conventions, and the submodule workflow come from the three imports above, which every TyPhed repository
loads. Everything below is true of this repository only.

<!-- If those imports resolve to nothing, the submodules are not checked out.
     Run: git submodule update --init --recursive -->

## What This Repo Is

A pnpm + Turborepo monorepo that builds two independent artifacts and publishes them to one GitHub Pages site at
`typhed.com`:

  * `apps/web` - a Next.js 15 (App Router, React 19) site exported to static HTML.
  * `permalink/` - a Python + Jinja2 generator that renders zero-cost redirect pages served under `/permalink/`.

The two are stitched together at deploy time: the redirect pages are generated into the web app's export output, so the
site and its redirects ship in a single Pages deployment.

Two further directories are **git submodules**, not part of this repository:

  * `shared/documents/` - [typhed/shared.documents](https://github.com/typhed/shared.documents): the `@typhed/brand`
    contract, design tokens, brand assets, and the brand documentation.
  * `shared/components/` - [typhed/shared.components](https://github.com/typhed/shared.components): `@typhed/ui`, the
    Tailwind preset, the tsconfig bases, and the component reference docs.

Both join this pnpm workspace, so `@typhed/ui` and `@typhed/brand` import as ordinary packages. Editing anything under
`shared/` changes every TyPhed property, and needs its own commit inside the submodule. The imported shared workflow
covers the rules and the commands.

## Scope

This repository is the **brand and acquisition layer** described in the imported brand context, and
[PRD.md](shared/documents/docs/brand/PRD.md) is the source of truth for what belongs on it. Read it before adding a page,
a route, or a feature.

## Reference Docs (Read Before Editing)

  * [docs/architecture.md](docs/architecture.md) - how *this* repository is built and why: the static export model, the
    task graph, the shared submodule layer, theming, auth, the redirect generator, the deploy pipeline, and the
    constraints that hold them together.
  * [PRD.md](shared/documents/docs/brand/PRD.md) - what the site is for and what belongs on it.
  * [shared/components/docs/components/README.md](shared/components/docs/components/README.md) - the component library
    reference (props, variants, accessibility, do's and don'ts). One page per durable component.
  * [shared/documents/docs/design/](shared/documents/docs/design/) - the colour, spacing, and typography references. The
    values themselves live in [shared/documents/brand/tokens/](shared/documents/brand/tokens/).

## Commands

Run from the repo root unless noted. Turbo fans each script out across the workspace.

| Command | What It Does |
| :---: | --- |
| `corepack enable && pnpm install` | One-time setup. Also initialises the submodules. pnpm version is pinned in `package.json` (`packageManager`). |
| `pnpm dev` | Run the site locally with hot reload at `localhost:3000`. |
| `pnpm build` | Produce the static export into `apps/web/out`. |
| `pnpm lint` | ESLint across the workspace. |
| `pnpm typecheck` | `tsc --noEmit` across the workspace. |
| `pnpm format` / `pnpm format:check` | Prettier write / check. |
| `pnpm clean` | Remove build output and `node_modules`. |
| `pnpm shared:update` | Fast-forward both submodules to their branch tip, then reinstall. |
| `pnpm shared:status` | Show uncommitted or unpushed work inside either submodule. |
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
  * The pnpm workspace layout across this repository and the two submodules, and the Turborepo task graph.
  * How the shared packages are consumed from source, and how a shared change reaches this site.
  * Theming, the page shell, the scroll model, and the Server / Client component boundary.
  * Client-side Clerk authentication and where the publishable key comes from in local development and in CI.
  * The permalink redirect generator and the release-triggered deployment pipeline.
  * The load bearing constraints a change must not break.

## Conventions

Shared conventions (colour tokens, the spacing and type system, markdown and commit skills) are in the imported
`conventions.md`. These are specific to this repository:

  * **The current landing page is temporary.** `apps/web` renders a work-in-progress holding page. Its WIP-only
    components (`WipLanding`, `CountdownTimer`, `LaunchProgress`) are deliberately excluded from the component docs and
    are slated for replacement by the brand hub described in the PRD. Do not document them or treat them as the permanent
    product architecture.
  * **The header height and `scroll-padding-top` are a sync pair.** `scroll-padding-top: 4rem` in
    [globals.css](apps/web/app/globals.css) offsets the sticky `h-16` header. Change one and you must change the other.
  * **`globals.css` no longer holds the palette.** Both themes are generated into `apps/web/app/theme.css` from
    [colors.json](shared/documents/brand/tokens/colors.json), and `layout.tsx` imports that file first. What remains in
    `globals.css` is the scroll model, scrollbar hiding, and the selection colour. Do not reintroduce `:root` or `.dark`
    token blocks in either file.
  * **Two paths are generated, not authored.** `apps/web/app/theme.css` and `apps/web/public/brand/` are written by the
    `sync:shared` script before every dev run and build, and both are gitignored. Edit the colour tokens and the artwork
    in [shared/documents](shared/documents) instead; anything written to the generated paths is overwritten.
