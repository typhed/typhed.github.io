# TyPhed Monorepo

This monorepo builds the TyPhed web estate: the brand hub `apps/web` (typhed.com) and two product subdomains,
`apps/trading` (trading.typhed.com) and `apps/blogging` (blog.typhed.com). Each app is a Next.js 15 static export served
by its own Cloudflare Worker, and all three render one shared brand layer from `packages/`. The rule every change keeps:
one source of truth, so a value lives in exactly one place and everything else reads it.

## Commands

```shell
# install once (Node 20.9+, pnpm via corepack, Python 3.13 for the web build)
$ corepack enable && pnpm install && pip install -r permalink/requirements.txt

# run every app (web 3000, trading 3001, blogging 3002), or one
$ pnpm dev
$ pnpm --filter trading dev

# the gates CI runs
$ pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build

# one test file, or one test by name
$ pnpm --filter @typhed/risk-toolkit exec vitest run test/stats.test.ts
$ pnpm --filter trading exec vitest run -t "<test name>"

# serve a built app exactly as Cloudflare does (web 8787, trading 8788, blogging 8789)
$ pnpm --filter web preview
```

## Architecture

  * **Apps** (`apps/*`): static exports; the folder name is the package name and the Worker name suffix (`typhed-<app>`).
  * **Brand** (`packages/brand`): brand JSON, `properties.json` (one entry per app), tokens, artwork, and the
    `typhed-brand-sync` bin that writes each app's `app/theme.css` and `public/brand/` before every dev run and build.
  * **Shell** (`packages/ui`): `SiteShell` renders the identical header and footer, plus a property's sidebar menu.
  * **Auth** (`packages/auth`): the only package that imports Clerk; `@typhed/ui` takes auth as a slot.
  * **Config** (`packages/config-*`): `createNextConfig()`, the Tailwind preset and shared content globs, tsconfig bases.
  * **Deploy**: `.github/workflows/deploy.yml` deploys every affected app that has an `apps/*/wrangler.jsonc`.

## Rules

  1. Never invent copy, logos, or icons. Take values from `packages/brand` or existing strings, and record anything
     missing in `.claude/docs/gaps.md`.
  2. Never hardcode a brand string, link, or colour; edit the JSON in `packages/brand` (colours in `tokens/`).
  3. A change in `packages/` reaches every site: add the new shape, migrate the apps, then remove the old one.
  4. Keep `@typhed/ui` auth-free and property-neutral; property-only behaviour stays in its app or behind a prop.
  5. Adding analytics, tracking, or any third-party tag that observes visitors is a brand decision: ask first.
  6. Never rewrite history (no squash, rebase, or amend); land work with a merge commit or a fast-forward.
  7. Docs describe what exists, in present tense, once. Architecture, product, and design live in `docs/`; decisions
     are dated records in `docs/adr/`. `.claude/docs/` holds harness material only and points into `docs/`.
  8. Markdown follows `markdown-format` and `humanize-text`; commits follow `git-commiter`.
  9. Do not tune code or config to one machine; record environment problems for the owner instead.
  10. Update the docs a change affects as the last step of the change.

## Read Only What The Task Needs

Read the row that matches the task, never a whole directory.

| Task Touches | Read |
| :---: | --- |
| Product scope, a new page or feature | `docs/PRD.md` |
| Build, workspace, packages, theming, shell, auth, redirects, deploy | `docs/architecture.md` |
| Why something is built the way it is | `docs/adr/README.md`, then the dated record |
| A shared component in `packages/ui` | `docs/components/README.md`, then the component's page |
| Colours, spacing, type | `docs/design/colors.yml`, `spacing.yml`, `typography.yml` |
| Domains, DNS, Workers, adding a subdomain | `docs/brand/subdomain-model.md` |
| An app's local setup and layout | `apps/<app>/README.md` |
| Open questions for the owner | `.claude/docs/gaps.md` |
| Work in progress and the cutover checklist | `.claude/docs/tasks/` |
| Past plans (only when asked) | `.claude/docs/archive/` |

## Memory

@.claude/MEMORY.md
