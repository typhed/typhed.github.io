# Plan: One TyPhed Monorepo, Served by Cloudflare Workers

## Context

Three live sites (typhed.com, blog.typhed.com, trading.typhed.com) are built from five repositories and deployed by
three GitHub Pages pipelines behind a Cloudflare-proxied zone. The shell (header, footer, theme, tokens), the Clerk
wiring, and the Tailwind/TS configs exist in two or three diverging copies; trading forks shared packages under the
same names; the blog no longer compiles against the newest shared contract. Outcome: one pnpm + Turborepo monorepo
with every original commit preserved unchanged, one source of truth per concern, each site deployed as its own
Cloudflare Worker (static assets), no visible downtime, and present-tense docs.

| Source repo | Ref merged (tip) | Lands in |
| --- | --- | --- |
| `typhed/typhed.github.io` (origin, this repo) | `master` @ `387d641` | `apps/web`, `permalink/`, `docs/` (base branch) |
| `typhed/shared.components` | `master` @ `9d26b78` | `packages/ui`, `packages/config-tailwind`, `packages/config-typescript`, `docs/components` |
| `typhed/shared.documents` | `master` @ `6d2dbc4` | `packages/brand` (+ `assets/`, `scripts/`), `docs/brand`, `docs/design`, `docs/data` |
| `typhed/blog.typhed.com` | `master` @ `db4b25b` | `apps/blogging` |
| `typhed/trading.typhed.com` | `reviews/20260719` @ `fc01566` (contains `master` `f9da049`) | `apps/trading`, `packages/{chart-engine,risk-toolkit,backtest,analytics-python,entitlement-gate}` |

Not merged: the 7 blog dependabot branches (bot bumps on the old layout), any tags/releases (user deletes them).

## User Decisions (Final)

  * Shared code flattened into `packages/*`; shared docs into `docs/`; full history of both shared repos merged.
  * Trading from `reviews/20260719`. Fetch everything with `--no-tags`.
  * Deploy: one GitHub Actions workflow on push to `master` + manual dispatch, auto-discovering `apps/*/wrangler.jsonc`,
    deploying only affected apps.
  * Header and footer are the **same shared brand header/footer on every site** (brand links only). A property's own
    product menu lives in a **left, collapsible sidebar, expanded by default**; today only trading has one (its
    existing tool links). Web and blog render no sidebar.
  * Trading's `serverless/` gate is kept **dormant** at `packages/entitlement-gate` (code unchanged, never deployed).
  * `/permalink/conduct.html` must keep working at that exact URL.

## Hard Rules

  1. **History:** no squash, no rebase, no amend, no filter-repo. Every imported commit keeps its SHA, message, author,
     and date. New commits only (moves, merges, integration). The final landing on `master` is a fast-forward or a
     GitHub "Create a merge commit" - never "Squash" or "Rebase and merge".
  2. **No invention:** no new logos, icons, artwork, copy, taglines, labels, or metadata. Values come from existing
     brand JSON, each app's existing strings, and existing assets. Anything missing goes to `.claude/docs/gaps.md`.
  3. **Docs describe what exists, in present tense** ("This monorepo contains the main site and two subdomains...").
     No migration story, no rationale sections. Rationale goes only to `.claude/docs/decisions/`.
  4. **Claude context location:** project memory is `.claude/MEMORY.md`; decisions `.claude/docs/decisions/`; tasks
     `.claude/docs/tasks/`; archive `.claude/docs/archive/`. Nothing in `~/.claude/`.
  5. **Commits** follow `git-commiter`: emoji subject <= 72 chars, paragraph + `-` bullets, one logical unit per
     commit, staged by explicit path, `git commit -F .git/COMMIT_MSG.txt`, trailer
     `Co-authored-by: Claude Opus 5.5 <noreply@anthropic.com>`. Any `*.py` change goes through the `python` agent
     (`python-code-format`). Markdown follows `markdown-format` + `humanize-text`; `flaunt-product` only for README/PRD
     product prose, never adding claims.

## Facts From The Inventory (Drive The Design)

  * All three apps are named `web` in `package.json`; trading's `packages/config-tailwind|config-typescript` reuse the
    shared names `@typhed/tailwind-config` / `@typhed/tsconfig` - one workspace cannot hold both.
  * Versions: Next 15.5.19-15.5.20, React 19.2.7, `@clerk/react` 6.11.1 / 6.12.2 / 6.12.4 (all client-only, no
    `@clerk/nextjs`), Tailwind 3.4.19, TS 5.9.3, ESLint 8.57.1 + `next lint`, turbo 2.9-2.10, pnpm 11.9.0 everywhere.
  * Blog breaks at the shared tip: `@typhed/brand` 6d2dbc4 removed `Site.legalEntity` and `Copyright.line2`
    (`apps/web/lib/constants.ts:24` in the blog). The tip contract matches origin's newer decision (`fccdb4d`).
  * Shared `SiteHeader`/`MobileNav`/`SiteFooter` read `@typhed/brand` nav directly and expose only auth slots.
  * Trading: hand-copied tokens in `globals.css` (differs in `destructive-foreground`; adds `--success`/`--warning`
    used by ~6 tool files), own shell, `Button variant="brand"` (~10 files; shared Button lacks it), a
    `lib/platform.ts` "control file" superseded by `@typhed/brand`, a dead drift-guard step, a committed
    `public/py/__pycache__/*.pyc` (served publicly, embeds a local path), Prettier defaults (semicolons, width 80) vs
    origin/blog (no semicolons, width 100), and 90+ vitest cases never run in CI.
  * Clerk divergence: origin requires the key, provider outside `ThemeProvider`, fixed accent; blog and trading make
    the key optional (`CLERK_ENABLED`); trading nests Clerk inside `ThemeProvider` with a theme-following accent.
  * `sync-shared.mjs` hardcodes submodule paths and `rm -rf`s its `--assets` target.
  * External consumer: `typhed/typhed.project.data` reads `brand/api.json`, `products.json`, `profile.json` from a
    shared.documents checkout - archiving that repo freezes its data (user TODO).

## Target Layout

```text
apps/
  web/            typhed.com          (package "web")
  trading/        trading.typhed.com  (package "trading")
  blogging/       blog.typhed.com     (package "blogging")
packages/
  brand/          @typhed/brand       JSON contract, tokens, assets/, scripts/sync.mjs (bin), properties.json
  ui/             @typhed/ui          shell, ProductSidebar, SiteShell, Button, metadata helpers
  auth/           @typhed/auth        the only Clerk wiring (new)
  config-next/    @typhed/next-config createNextConfig() - the static-export contract (new)
  config-tailwind/ @typhed/tailwind-config
  config-typescript/ @typhed/tsconfig
  chart-engine/ risk-toolkit/ backtest/   trading domain libraries
  analytics-python/                        trading's numpy/scipy reference script (not a workspace package)
  entitlement-gate/                        dormant Clerk gate (@typhed/entitlement-gate)
permalink/        Python + Jinja2 redirect generator (typhed.com/permalink/*)
scripts/          deploy-targets.mjs
docs/             PRD.md, architecture.md, components/, design/, brand/, data/
.claude/          MEMORY.md, docs/{apps,packages,...,archive,decisions,tasks}, agents/, hooks/, settings.json
.github/          workflows/{deploy.yml,ci.yml}, dependabot.yml, CODEOWNERS
```

## Phase 0 - Prepare (on branch `monorepo`)

```shell
git switch -c monorepo
git add ".claude/archive/Initial WIP UI Plan.md" ".claude/docs/archive/Initial WIP UI Plan.md"   # user's move, as a rename
git fetch blogging master --no-tags
git fetch trading --no-tags "+refs/heads/reviews/20260719:refs/remotes/trading/reviews/20260719"
git remote add shared-components https://github.com/typhed/shared.components.git
git remote add shared-documents  https://github.com/typhed/shared.documents.git
git fetch shared-components master --no-tags && git fetch shared-documents master --no-tags
git rev-parse blogging/master trading/reviews/20260719 shared-components/master shared-documents/master
```

Stop if any tip differs from `db4b25b` / `fc01566` / `9d26b78` / `6d2dbc4` (someone pushed; re-inventory first).

## Phase 1 - History-Preserving Import (Move-Then-Merge)

Per source: `git switch -c import/<x> <tip>`, one commit of pure `git mv`/`git rm` (100% renames, so `git log --follow`
and `git blame` cross the move), then on `monorepo`: `git merge --no-ff --allow-unrelated-histories import/<x>`.
Import commits clear every path that collides with origin, so the merges are conflict-free. Order: shared-components,
shared-documents, blogging, trading.

| Source | Moves | Removed in the import commit (content folded later where still true) |
| --- | --- | --- |
| shared.components | `CLAUDE.md` -> `.claude/docs/packages/ui.md` (packages/ and docs/components stay in place) | `README.md`, `.gitignore` |
| shared.documents | `brand/` -> `packages/brand/`; `assets/brand/` -> `packages/brand/assets/`; `scripts/sync-shared.mjs` -> `packages/brand/scripts/sync.mjs`; `claude/brand.md`, `claude/conventions.md` -> `.claude/docs/`; `CLAUDE.md` -> `.claude/docs/packages/brand.md` (docs/ stays) | `claude/shared-workflow.md`, `MIGRATION.md`, `templates/nextjs-subdomain/`, `README.md`, `.gitignore` |
| blog.typhed.com | `apps/web/` -> `apps/blogging/`; `README.md` -> `apps/blogging/README.md`; `CLAUDE.md` -> `.claude/docs/apps/blogging.md`; `.claude/plans/Initial Plan.md` -> `.claude/docs/archive/Blogging Initial Plan.md` (keeps `.nvmrc`, `.github/dependabot.yml`) | `shared/*` gitlinks, `.gitmodules`, `setup.md`, `.github/workflows/deploy.yml`, root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.npmrc`, `.prettierrc.json`, `.prettierignore`, `.gitignore` |
| trading.typhed.com | `apps/web/` -> `apps/trading/`; `serverless/` -> `packages/entitlement-gate/`; `README.md` -> `apps/trading/README.md` (keeps other `packages/*`, `.gitattributes`) | `packages/config-tailwind/`, `packages/config-typescript/` (forks of the shared packages), `.github/workflows/deploy.yml`, root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `.npmrc`, `.prettierrc`, `.gitignore` |

Merge subjects, e.g. `✨ feat(monorepo): merge blog.typhed.com history into apps/blogging`, body names the source tip.

## Phase 2 - One Workspace

Rule for every root file: start from the variant with the newest commit, add the unique settings of the others.

  * Remove the `shared/components`, `shared/documents` gitlinks and `.gitmodules`; drop `shared:update`,
    `shared:status`, `postinstall`; workspace globs become `apps/*`, `packages/*`.
  * `pnpm-workspace.yaml`: `catalog:` holds the one version of each shared dependency (next ^15.5.20, react/react-dom
    ^19.2.7, @clerk/react ^6.12.4, typescript ^5.9.3, tailwindcss ^3.4.19, eslint ^8.57.1, eslint-config-next, types,
    next-themes, lucide-react, ...); apps depend with `catalog:` and `workspace:*`. `allowBuilds` union
    (`@clerk/shared`/`sharp`/`unrs-resolver` false, `esbuild` true); trading's `overrides` (vite, esbuild, postcss).
  * Root `package.json`: scripts `dev build lint typecheck test clean format format:check`; devDeps turbo ^2.10.5,
    prettier + tailwind plugin, typescript, wrangler (v4), eslint + eslint-config-next. Engines node >=20.9.0.
  * `turbo.json`: `build` with `env: ["NEXT_PUBLIC_*"]`, outputs `out/** .next/** !.next/cache/**`; new `test` task;
    `web#build` inputs add `$TURBO_ROOT$/permalink/**`; keep `globalDependencies: ["**/.env.*local"]`.
  * App packages renamed `web` / `trading` / `blogging`; scripts chain explicitly (no pre/post hooks):
    `dev = typhed-brand-sync ... && next dev -p 3000|3001|3002`, `build = typhed-brand-sync ... && next build`,
    `preview = wrangler dev --port 8787|8788|8789`; `next start` removed.
  * `.gitignore`: union + `__pycache__/`, `*.py[cod]`, `.wrangler/`, `apps/*/app/theme.css`, `apps/*/public/brand/`;
    drop the dead `*.zip` rule. Keep `.gitattributes` (trading) and `.nvmrc` (blog).
  * Prettier: origin's config (newest) wins. One `style` commit reformats trading code; its SHA goes into
    `.git-blame-ignore-revs`.
  * One root `.eslintrc.json` (`next/core-web-vitals`, `settings.next.rootDir: ["apps/*/"]`); per-app eslintrc files
    deleted; `next lint` stays per app (ESLint 9 flat-config move recorded as a gap).
  * Regenerate `pnpm-lock.yaml` once; CI installs with `--frozen-lockfile` again (no more floating submodules).

## Phase 3 - Single Sources Of Truth

  * **`@typhed/brand`**
      * `properties.json` + typed `PROPERTIES` / `getProperty(id)`: one entry per app (`web`, `trading`, `blogging`)
        with `url`, `name`, `description` taken from existing metadata (site.json, the blog's layout metadata,
        trading's `site.local.ts`/`constants.ts`), plus `sidebar` groups for trading taken verbatim from
        `lib/tool-registry.ts`. Adding a subdomain = one entry here + an app folder.
      * Tokens: add `success`/`warning` (trading's values) to `tokens/colors.json`; shared `destructive-foreground`
        (newer) wins. Preset gains the two colour utilities.
      * `scripts/sync.mjs` exposed as bin `typhed-brand-sync`; paths resolve from the script (`import.meta.url`), not
        from submodule paths; refuses any `--assets` target not ending in `/brand`.
  * **`@typhed/ui`**
      * `SiteHeader`, `MobileNav`, `SiteFooter` stay brand-only and identical on every site; auth stays a slot.
      * New `ProductSidebar`: left, collapsible, expanded by default, the collapse choice remembered per site
        (`localStorage`, wrapped in try/catch); renders nothing for a property without `sidebar` groups.
      * New `SiteShell({ propertyId, authSlot, mobileAuthSlot, children })`: header, optional sidebar, `main`,
        footer, `ScrollToTop`. Each `layout.tsx` keeps only fonts, metadata, providers, and app extras (trading's
        `PrivacyGuard`/`ChatFab`, the blog's analytics).
      * `lib/metadata.ts`: `buildMetadata`, `buildManifest`, `buildRobots`, `buildSitemap` from `getProperty`;
        existing `manifest.ts`/`robots.ts`/`sitemap.ts` become one-line calls (no new routes added anywhere).
      * Button: if trading's `brand` classes equal `default`, codemod `variant="brand"` -> `"default"`; otherwise add
        `brand` to the shared Button.
  * **`@typhed/auth`** (keeps `@typhed/ui` auth-free, per `architecture.md:380`)
      * `AuthProvider`: `@clerk/react` `ClerkProvider`, inside `ThemeProvider`, accent from the brand tokens per
        resolved theme, `afterSignOutUrl="/"`, `allowedRedirectOrigins` from `PROPERTIES`. Empty key renders children
        without Clerk (local runs); the deploy workflow fails a production build with no key.
      * `AuthControls`/`MobileAuthControls` (modal `SignInButton`, `UserButton`, shared Button), `AuthGate`, and a
        generic `useEntitlements()` over `publicMetadata`. Feature catalogs stay in the app (trading's `FeatureId`).
      * One production Clerk instance (`clerk.typhed.com`) serves all subdomains; no satellite domains.
  * **`@typhed/next-config`**: `createNextConfig()` sets `output: "export"`, `trailingSlash`, `images.unoptimized`,
    `reactStrictMode`, `transpilePackages` for `@typhed/*`, and loads the repo-root `.env.local` via `@next/env`
    `loadEnvConfig`. Every `next.config.mjs` becomes `export default createNextConfig()`.

## Phase 4 - Adopt Per App

  * **web**: `@typhed/auth`, `SiteShell`, `createNextConfig`, metadata helpers; delete `clerk-provider.tsx`,
    `auth-controls.tsx`. WIP landing untouched.
  * **blogging**: adapt to the brand tip (drop `legalEntity`/`line2` reads), then the same adoption; `FreemiumGate`
    sits on `AuthGate`; delete the unused `CONTACT_EMAIL`/`COPYRIGHT` re-exports; correct stale comments (TOC rail
    breakpoint, left-rail names, `main` -> `master`). Analytics, `ads.txt`, MDX pipeline unchanged.
  * **trading**: delete the local shell (`site-header`, `site-footer`, `mobile-nav`, `nav-dropdown`, `theme-provider`,
    `theme-toggle`, `brand-mark`, `copyright-year`, `ui/button`, `lib/utils`, `clerk-provider`, `auth-buttons`,
    `auth-gate`, `lib/platform.ts`, `lib/site.local.ts`, `lib/tool-registry.ts` -> `properties.json`), the
    hand-copied tokens in `globals.css` (keeps its `p { text-align: justify }`), `types/shims.d.ts`, the `.pyc`;
    adopt the shared preset, sync, shell, sidebar, auth. Brand values win where trading diverged (contact email,
    privacy link). Fix `packages/analytics-python` target path to `apps/trading/public/py/analytics.py`.

## Phase 5 - Permalink (`/permalink/conduct.html` Must Keep Working)

  * `build.py` keeps writing `out/permalink/<key>` HTML pages (template unchanged) and gains `--redirects <file>`:
    an idempotent block (`# permalink:begin`/`# permalink:end`) in `out/_redirects` with
    `/permalink/<key> <target> 302`, plus `/permalink/<stem>` and `/permalink/<stem>/` for `.html` keys. One edge 302,
    independent of `html_handling`; the HTML page stays the fallback for plain file servers.
  * Keys validated as one safe path segment; targets stay absolute http(s); docstring describes Workers, not Pages.
  * `apps/web` `build` runs it after `next build`; CI sets up Python 3.13 + `permalink/requirements.txt`.
  * Link sweep: re-point every URL into an archived repo to its `typhed/typhed.github.io` path; the `conduct.html`
    target (`typhed/.github`) stays. The README badge pointing at `/permalink/` (404) links the real page instead.

## Phase 6 - Cloudflare Workers

  * `apps/<app>/wrangler.jsonc` (assets-only Worker, no script): `name` `typhed-web|typhed-trading|typhed-blogging`,
    `compatibility_date`, `assets: { directory: "./out", html_handling: "auto-trailing-slash",
    not_found_handling: "404-page" }`, `workers_dev: true`, `preview_urls: false`, observability on. No routes yet.
  * `apps/web/public/_headers`: `/opengraph-image` -> `Content-Type: image/png` (today it serves as octet-stream).
  * `.github/workflows/deploy.yml` (replaces the Pages workflow): push `master` + `workflow_dispatch` (input `apps`,
    default `all`). Job `targets`: checkout `fetch-depth: 0`, `node scripts/deploy-targets.mjs` lists apps that have a
    `wrangler.jsonc` and are affected since `github.event.before` (`turbo ... --affected`). Job `deploy` (matrix,
    `fail-fast: false`, concurrency per app): pnpm, Node 22, Python + Jinja2, `pnpm install --frozen-lockfile`, export
    every `NEXT_PUBLIC_*` repository variable from `toJSON(vars)` (new public vars need no workflow edit), fail if
    the Clerk key is empty, `pnpm turbo run build --filter=<app>`, `pnpm --filter <app> exec wrangler deploy` with
    secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
  * `.github/workflows/ci.yml` (new): PR + push - install, lint, typecheck, test, format:check, build.
  * `.github/dependabot.yml`: npm (root, catalogs) + github-actions; no gitsubmodule ecosystem.
  * Delete `apps/*/public/CNAME` and `.nojekyll` (Pages keeps serving its last deployment until DNS moves).
  * Prepare branch `cutover/routes` adding `routes: [{ "pattern": "<host>/*", "zone_name": "typhed.com" }]` to each
    `wrangler.jsonc` (`typhed.com`, `trading.typhed.com`, `blog.typhed.com`); the user merges it at cutover.

## Phase 7 - Docs And Claude Context (Present Tense)

  * Rewrite: root `README.md` (what the monorepo contains, local development, commands), `apps/*/README.md`,
    `docs/PRD.md` (one PRD: brand hub + two subdomains, a section each, plus the "where does it belong" table),
    `docs/architecture.md` (workspace, packages, theming, auth, sidebar/shell, permalink, Cloudflare deploy,
    constraints, adding a subdomain), `docs/brand/subdomain-model.md`, fixes in `docs/design/*.yml` and
    `docs/components/*.md` (add `product-sidebar.md`, `site-shell.md`). Delete root `setup.md`.
  * `.claude/agents/keeper.md` + `.claude/hooks/keeper-stop-hook.py` cover `docs/` and `.claude/docs/` (except
    `archive/`, `decisions/`, `tasks/`) and drop the submodule notes (`python` agent for the hook).
  * Last code step: `/init`, then `/extend-init docs=.claude/docs/ mode=migrate` (skill at
    `~/.claude/skills/extend-init`): router `CLAUDE.md` (<100 lines, ends `@.claude/MEMORY.md`), docs tree
    `apps/{apps,web,trading,blogging}.md`, `packages/{packages,brand,ui,auth,config,chart-engine,risk-toolkit,
    backtest}.md`, `permalink.md`, `deployment.md`, `testing.md`, `claude-setup.md`, `gaps.md`.
  * `.claude/docs/decisions/`: one dated record each - layout, merge method, trading ref, deploy model, single auth
    package, sidebar navigation, dormant gate, no tags, docs rule. `.claude/docs/tasks/`: `cloudflare-cutover.md`
    (user TODO below) and `monorepo-merge.md` (this checklist with progress).

## Doc Claims That Do Not Match Reality (Approve The Proposed Action)

| Claim | Reality | Action |
| --- | --- | --- |
| `setup.md` Part 10: Clerk webhooks into a Flask service | No such service in any repo | Drop; record in `gaps.md` |
| `subdomain-model.md`, `setup.md`: Clerk satellite domains | Same-root subdomains share the session via `clerk.typhed.com` | Rewrite as automatic sharing |
| `setup.md`, `architecture.md`: push-to-deploy, `--frozen-lockfile`, Dependabot in origin, 4 next options | Release trigger, `--no-frozen-lockfile`, no dependabot, 5 options | Superseded by the rewrite |
| README badge -> `typhed.com/permalink/` | 404, no index page | Link `/permalink/conduct.html`; no index invented |
| Trading `platform.ts`: canonical copy on `typhed.github.io` | File never existed; drift guard always warns | Delete with the control file |
| Trading `tool-registry.ts`: `/tools`, `/budgeting` index pages | Pages do not exist | Comment removed with the file; no pages invented |
| Trading privacy link `typhed.com/privacy` | 404 | Use the brand privacy link |
| Trading README: "packages arrive in later phases", "private control hub" | Packages exist; hub unknown | Rewrite; hub recorded in `gaps.md` |
| Blog README/`ad-unit.tsx`: AdUnit usable anywhere in posts | Not in `mdxComponents` | Correct the text; behaviour unchanged |
| Blog `ads.txt`: carries the AdSense publisher line | Placeholder `pub-0000000000000000` | Keep; real ID requested in `gaps.md` |
| Shared docs: the preset emits the palettes | `sync.mjs` generates `theme.css` | Correct the docs |

## Verification

  * **History:** for each tip `db4b25b fc01566 9d26b78 6d2dbc4` `git merge-base --is-ancestor <tip> HEAD`;
    `git log -1 --format='%H %an %ae %ad %s' <tip>` identical before/after; `git log --follow
    apps/trading/app/page.tsx` reaches trading's first commit; `git blame` on a trading file shows original authors.
  * **Gates:** `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm format:check &&
    pnpm build` all green; three `out/` dirs; no `CNAME`, `.nojekyll`, or `.pyc` in any output.
  * **Local preview:** `pnpm dev` (3000/3001/3002) and `pnpm build` + `pnpm --filter <app> preview`
    (8787/8788/8789): same header/footer on all three, trading sidebar expanded by default and collapsible, theme
    toggle, sign-in with the Clerk development key, `/about/`, `/blog/<slug>/`, `/tools/ipo/`, `/budgeting/mnws/`,
    404 page, blogging `/ads.txt`, web `/permalink/conduct.html` -> 302 to the Code of Conduct.
  * **workers.dev, then cutover:** same checks on each Worker URL; after routes, `curl -sI` on all four hosts shows no
    `x-github-request-id`, `www` -> 301 apex, `/permalink/conduct.html` -> 302; sign in on typhed.com, open
    trading.typhed.com still signed in.
  * **Check during implementation (from knowledge, not re-researched):** `_redirects` precedence under `wrangler dev`;
    `$TURBO_ROOT$` + source-package hashing on turbo 2.10; `wrangler deploy` route reconciliation; `NEXT_PUBLIC_*`
    inlining via `loadEnvConfig`. Each has a fallback noted in its section.

## User TODO Deliverable (`.claude/docs/tasks/cloudflare-cutover.md`)

  1. **Repos merged (archive after a stable week):** `blog.typhed.com`, `trading.typhed.com`, `shared.documents`,
     `shared.components` - with the exact tips above. First re-point `typhed/typhed.project.data` at
     `packages/brand/*.json` in this repo (it reads shared.documents today).
  2. **Cloudflare + GitHub setup:** Account ID; API token (template "Edit Cloudflare Workers", account + zone
     typhed.com); repo secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; keep Variable
     `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; copy the blog's analytics Variables from the blog repo.
  3. **Land the branch** with a merge commit or fast-forward (never squash/rebase); the deploy run publishes three
     Workers on `workers.dev`; run the checks.
  4. **Cutover, zero downtime:** Redirect Rule `www.typhed.com/*` -> `https://typhed.com/${1}` (301, keep query) first;
     merge `cutover/routes`; confirm with `curl -sI`; then switch the apex/www/trading/blog DNS records from GitHub
     targets to proxied `AAAA 100::`; purge cache.
  5. **Stop GitHub Pages** in all three site repos: remove custom domain, unpublish, disable the old deploy workflows,
     delete the `github-pages` environment; keep `typhed.com` verified for Pages in the org settings.
  6. Delete old tags and releases (user's own step).
  7. **Restart / redeploy / roll back:** Actions -> Deploy -> Run workflow (`apps=all` or one app);
     `pnpm --filter <app> exec wrangler rollback`; dashboard Deployments -> Rollback.
  8. **View the sites locally:** `corepack enable`, `pnpm install`, copy `.env.example` to a root `.env.local` with the
     Clerk development key, `pnpm dev` (web 3000, trading 3001, blogging 3002) or `pnpm build` then
     `pnpm --filter <app> preview` for the production-identical Worker preview.
