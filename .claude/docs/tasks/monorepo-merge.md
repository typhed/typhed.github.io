<div align = "center">

# Monorepo Merge Progress

</div>

<div align = "justify">

Tracks the merge of five repositories into this monorepo and its move to Cloudflare Workers. The approved plan is
archived as [Monorepo Merge Plan.md](../archive/Monorepo%20Merge%20Plan.md); the owner's cutover checklist is
[cloudflare-cutover.md](cloudflare-cutover.md). Work happens on branch `monorepo`. Status as of 2026-11-17.

## Sources Merged

<div align = "center">

| Repository | Ref (tip) | Lands In |
| :---: | :---: | --- |
| `typhed/typhed.github.io` | `master` @ `387d641` | base branch: `apps/web`, `permalink/`, `docs/` |
| `typhed/shared.components` | `master` @ `9d26b78` | `packages/ui`, `packages/config-tailwind`, `packages/config-typescript`, `docs/components` |
| `typhed/shared.documents` | `master` @ `6d2dbc4` | `packages/brand`, `docs/brand`, `docs/data`, `docs/design` |
| `typhed/blog.typhed.com` | `master` @ `db4b25b` | `apps/blogging` |
| `typhed/trading.typhed.com` | `reviews/20260719` @ `fc01566` | `apps/trading`, trading packages, `packages/entitlement-gate` |

</div>

## Done

  - [x] Phase 0: branch `monorepo`; archive move committed as a rename; sources fetched with `--no-tags`; tips verified.
  - [x] Phase 1: four move-then-merge imports with `--allow-unrelated-histories`; every source tip is an ancestor of
    `HEAD` (160 commits after the merges).
  - [x] Phase 2: submodules retired; one pnpm workspace with a dependency catalog; `turbo.json` with `test` and
    `NEXT_PUBLIC_*` hashing; apps renamed `web`, `trading`, `blogging`; brand sync shipped as the `typhed-brand-sync`
    bin; `lib/` re-included in `.gitignore`.
  - [x] Phase 3: `properties.json` registry, success/warning tokens, `ProductSidebar`, `SiteShell`, metadata helpers,
    `@typhed/auth`, `@typhed/next-config`, shared Tailwind content globs.
  - [x] Phase 4: web, trading, and blogging adopt the shared layer; `pnpm typecheck` 10/10 and `pnpm build` 3/3 pass.
  - [x] Phase 6: `wrangler.jsonc` per app, `scripts/deploy-targets.mjs`, `deploy.yml` (Workers), `ci.yml`, monorepo
    `dependabot.yml`, `CNAME` and `.nojekyll` removed, one root `.env.example`. `wrangler dev` on trading verified
    `/`, the trailing-slash redirect, two routes, and the 404 page.
  - [x] Docs: `docs/PRD.md`, `docs/architecture.md`, and `docs/brand/subdomain-model.md` rewritten; architecture
    decisions recorded as dated ADRs in `docs/adr/`; the owner's cutover checklist written.
  - [x] Phase 5: permalink `--redirects` block and key validation, wired into the `web` build; keeper hook and the
    analytics test path updated. `wrangler dev` answers `/permalink/conduct.html` (and the extension-less forms) with a
    302 to the Code of Conduct; `/opengraph-image` is served as `image/png`.
  - [x] Phase 6 tail: branch `cutover/routes` adds the three routes (one commit, merged at cutover).
  - [x] Phase 7: root and app READMEs, component docs, design YAML paths, `setup.md` removed, keeper scoped to
    `docs/`; `CLAUDE.md` is the router (`/init` + `/extend-init`) and `.claude/` holds harness material only.
  - [x] Prettier pass (code only) with its SHA in `.git-blame-ignore-revs`. On this machine `format:check`,
    `typecheck` (10/10), `lint` (3/3, no warnings), `test` (116 passed), and `build` (3/3) pass.

## Pending (Owner)

  - [ ] Push `monorepo` and `cutover/routes`, then follow [cloudflare-cutover.md](cloudflare-cutover.md).

## To Verify On The Full System

These need a machine without this one's restrictions (TLS interception blocks Google Fonts during `next build`, and
there is no Cloudflare access).

  - [ ] `pnpm install --frozen-lockfile && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
    with no environment workarounds.
  - [ ] `pnpm --filter <app> preview` for each app: same header and footer everywhere, trading sidebar expanded by
    default and collapsible, blogging serves `/ads.txt`.
  - [ ] Sign-in with a Clerk development key on localhost for all three apps.
  - [ ] First `deploy.yml` run publishes three Workers on `workers.dev`; then the cutover checklist.

## Deviations From The Plan

  * Each app keeps its one-line `.eslintrc.json`: `next lint` looks for a config in the app directory and prompts
    without one.
  * `manifest.ts`, `robots.ts`, and `sitemap.ts` stay per app; their route lists differ, and only the page metadata
    skeleton is shared (`buildMetadata`).
  * Prettier formats code only; Markdown follows its own documented conventions.

</div>
