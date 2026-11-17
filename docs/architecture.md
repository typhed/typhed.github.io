<div align = "center">

# TyPhed Architecture

</div>

<div align = "justify">

This page is the architecture reference for the monorepo. It records how the three sites and the redirect generator are
built, how the workspace is wired together, how the sites deploy, and which constraints are load bearing. Open it when a
change touches build configuration, the package graph, theming, the page shell, authentication, or deployment. What
belongs on each site is settled by [PRD.md](PRD.md); how the properties sit across domains is in the
[domain and subdomain model](brand/subdomain-model.md).

The source code is the truth. When this page and the code disagree, fix the page.

## What To Read Before You Change Something

<div align = "center">

| If You Are Changing | Read | Primary Source |
| :---: | --- | --- |
| Next.js config, routing, or anything server-shaped | [Static Export Model](#static-export-model) | [config-next](../packages/config-next/index.mjs) |
| A workspace script, task order, caching, or a version | [Workspace And Task Graph](#workspace-and-task-graph) | [package.json](../package.json), [turbo.json](../turbo.json), [pnpm-workspace.yaml](../pnpm-workspace.yaml) |
| An icon | [Icons](#icons) | [icon.tsx](../packages/ui/components/icon.tsx) |
| A shared package, import path, or tsconfig | [Shared Packages](#shared-packages-consumed-from-source) | [packages/](../packages) |
| A colour, a token, or a themed surface | [Theming And Colour Tokens](#theming-and-colour-tokens) | [colors.json](../packages/brand/tokens/colors.json) |
| Brand copy, nav, a property's name or menu | [Content Single Source Of Truth](#content-single-source-of-truth) | [packages/brand](../packages/brand) |
| The header, footer, sidebar, or scroll behaviour | [Page Shell](#page-shell-sidebar-and-scroll-model) | [site-shell.tsx](../packages/ui/components/site-shell.tsx) |
| Sign in, gates, or entitlements | [Client Side Authentication](#client-side-authentication) | [packages/auth](../packages/auth/src) |
| A redirect under `/permalink/` | [Permalink Redirect Generator](#permalink-redirect-generator) | [build.py](../permalink/src/build.py) |
| CI, deployment, or hosting | [Deployment Pipeline](#deployment-pipeline) | [deploy.yml](../.github/workflows/deploy.yml) |

</div>

---

## The Artifacts

The repository is a pnpm workspace driven by Turborepo. It builds three static sites and one set of redirect pages:

  1. **[apps/web](../apps/web)** - `typhed.com`, the brand hub.
  2. **[apps/trading](../apps/trading)** - `trading.typhed.com`, the trading tools, with its domain libraries in
     `packages/chart-engine`, `packages/risk-toolkit`, and `packages/backtest`.
  3. **[apps/blogging](../apps/blogging)** - `blog.typhed.com`, the MDX blog.
  4. **[permalink/](../permalink)** - a Python and Jinja2 generator that writes the `/permalink/` redirects into the web
     app's export.

Each app is a Next.js 16 App Router application on React 19, built with Turbopack, exported to static HTML, and served
by its own Cloudflare Worker.

```text
  packages/brand  (tokens, artwork, properties.json) --typhed-brand-sync--> apps/*/app/theme.css, apps/*/public/brand/
  packages/ui, packages/auth, packages/config-*   ----compiled from source--> apps/web | apps/trading | apps/blogging
                                                                                  |
                                                                       next build (output: export)
                                                                                  v
  permalink/config/links.toml --build.py--> apps/web/out/permalink/ + apps/web/out/_redirects
                                                                                  |
                                                     wrangler deploy (one assets-only Worker per app)
                                                                                  v
                                       typhed-web, typhed-trading, typhed-blogging on the typhed.com zone
```

## Repository Layout

<div align = "center">

| Path | Role |
| :---: | --- |
| [apps/web](../apps/web), [apps/trading](../apps/trading), [apps/blogging](../apps/blogging) | The three sites. Each owns its routes, page metadata, and app-level CSS. |
| [packages/brand](../packages/brand) | `@typhed/brand`: the brand JSON contract, `properties.json`, design tokens, brand artwork, and the `typhed-brand-sync` bin. |
| [packages/ui](../packages/ui) | `@typhed/ui`: the page shell, header, footer, sidebar, theme components, Button, Icon, and the metadata helpers. |
| [packages/auth](../packages/auth) | `@typhed/auth`: the only Clerk wiring - provider, header control, sign-in gate, entitlements. |
| [packages/config-next](../packages/config-next) | `@typhed/next-config`: `createNextConfig()`, the static-export configuration. |
| [packages/config-tailwind](../packages/config-tailwind), [packages/config-typescript](../packages/config-typescript) | `@typhed/tailwind-config` (base stylesheet, preset, shared content globs, PostCSS config) and `@typhed/tsconfig` (bases). |
| [packages/chart-engine](../packages/chart-engine), [risk-toolkit](../packages/risk-toolkit), [backtest](../packages/backtest) | Trading domain libraries, tested with Vitest. |
| [packages/entitlement-gate](../packages/entitlement-gate) | A Clerk-backed server-side entitlement check. Not deployed. |
| [packages/analytics-python](../packages/analytics-python) | A NumPy/SciPy reference test for the trading app's in-browser Python analytics. Not a workspace package. |
| [permalink](../permalink) | The redirect generator, its TOML link table, and its Jinja template. |
| [scripts](../scripts) | `deploy-targets.mjs`, which picks the apps a deploy publishes. |
| [docs](.) | This reference, the PRD, the brand and design references, and the component docs. |

</div>

## Workspace And Task Graph

The root [package.json](../package.json) declares every dependency the workspace uses, each with its one version, and
links every `@typhed/*` package. An app or package lists only the `@typhed/*` packages it uses, as `workspace:*`;
Turborepo reads those links to order tasks and to find the apps a change affects.
[pnpm-workspace.yaml](../pnpm-workspace.yaml) globs `apps/*` and `packages/*` and sets `dedupeDirectDeps`, so the one
`node_modules` at the root serves every app and package; Vitest keeps its cache there too, under
`node_modules/.vite/<package>`. The same file lists the install scripts that may run (`esbuild` and `workerd` only).

The root `package.json` also pins the toolchain: pnpm through `packageManager`, and Node.js through
`devEngines.runtime`. pnpm downloads that Node.js release, records it in the lockfile, and runs every workspace script
with it. The install's dependency build scripts (`esbuild` and `workerd`) run on the `node` already on the `PATH`,
so a machine needs Node.js as well as pnpm. In CI, `pnpm/setup` installs the pinned release before the install. pnpm
installs a release only once it is a day old, its default `minimumReleaseAge`.
Three versions are held below the newest release on purpose:

<div align = "center">

| Package | Held At | Because |
| :---: | :---: | --- |
| `typescript` | `~6.0` | `typescript-eslint`, which `eslint-config-next` lints with, supports TypeScript below 6.1. |
| `katex` | `^0.16` | `rehype-katex` renders with KaTeX 0.16, and the stylesheet must match the renderer. `pnpm audit` reports the low-severity GHSA-238p-pmpm-9mq7 (fixed in 0.18.2) against it: the flaw needs prototype pollution elsewhere and attacker-written math, and the blog renders only its own posts, at build time. |
| `eslint-plugin-react`, `-import`, `-jsx-a11y` | ESLint 10 accepted | They still declare ESLint 9, which is past end of life; their rules run on ESLint 10, so `peerDependencyRules` accepts it. |

</div>

[dependabot.yml](../.github/dependabot.yml) skips the TypeScript and KaTeX updates these holds rule out.

[turbo.json](../turbo.json) defines the tasks. Every root script is a `turbo run <task>` fan-out:

<div align = "center">

| Task | Behaviour |
| :---: | --- |
| `build` | Depends on `^build`; caches `out/**` and `.next/**`; every `NEXT_PUBLIC_*` value is part of the hash. `web#build` also hashes `permalink/`. |
| `dev` | Never cached, persistent. |
| `lint`, `typecheck` | Depend on `^build`. |
| `test` | Runs Vitest in `apps/trading`, the trading packages, and `@typhed/brand`. |
| `clean` | Never cached. |

</div>

`globalDependencies` lists `**/.env.*local`, so editing a local env file invalidates the cache. Each app's `dev` and
`build` scripts run `typhed-brand-sync` first, then Next. Each app has a fixed port: web `3000`, trading `3001`,
blogging `3002` for `pnpm dev`, and `8787`, `8788`, `8789` for `pnpm --filter <app> preview`, which serves the built
`out/` through `wrangler dev` exactly as Cloudflare serves it.

## Static Export Model

Every `next.config.mjs` is `export default createNextConfig(options)` from
[packages/config-next](../packages/config-next/index.mjs), which sets:

<div align = "center">

| Option | Value | Consequence |
| :---: | :---: | --- |
| `output` | `"export"` | No Node runtime after the build. The result is plain files in `out/`. |
| `trailingSlash` | `true` | Routes emit `route/index.html`, served at `/route/`. |
| `images.unoptimized` | `true` | No image optimisation server exists. |
| `transpilePackages` | `@typhed/auth`, `@typhed/brand`, `@typhed/ui` + the app's own | Next compiles the shared packages from TypeScript source. |

</div>

`createNextConfig()` also loads the repo-root `.env.local`, so one file configures every app; a real environment
variable always wins. Anything that needs a request-time server is unavailable: route handlers as APIs, server actions,
middleware, server session reads, incremental regeneration, rewrites, and redirects. Metadata routes such as
`robots.ts`, `sitemap.ts`, and `manifest.ts` declare `export const dynamic = "force-static"` so they emit as files.

## Shared Packages Consumed From Source

No shared package is pre-built. `@typhed/ui` exports `./components/*` and `./lib/*`; `@typhed/brand` exports `.` and
every raw file (`@typhed/brand/tokens/colors.json`); `@typhed/auth` exports `.`. A new file inside an exported directory
is importable with no packaging change. React, React DOM, and Next resolve from the root `node_modules`, so every app
and package shares one copy.

`@typhed/tsconfig` ships `base.json`, `nextjs.json` (extended by the apps), and `react-library.json` (extended by the
packages); `paths` resolve from each tsconfig's own folder, with no `baseUrl`.

`@typhed/tailwind-config` carries the Tailwind CSS 4 setup. Each app's `globals.css` starts with
`@import "@typhed/tailwind-config/base.css"`, which loads Tailwind and then Font Awesome's icon styles in Tailwind's
base layer, followed by `@config "../tailwind.config.ts"`. That app config extends the shared preset (an empty `content`
array) and spreads `@typhed/tailwind-config/content.js`, the list of shared source directories that render Tailwind
classes; a new shared source directory is added to that one list, never to each app. Each app's `postcss.config.mjs`
re-exports `@typhed/tailwind-config/postcss.config.mjs`.

## Theming And Colour Tokens

Colours are HSL triplets in [colors.json](../packages/brand/tokens/colors.json): the light theme "Aurora Glass" and the
dark theme "Midnight Indigo", including the `success` and `warning` status colours. Dark is the default. Before every
dev run and build, `typhed-brand-sync` writes both themes into the app's `app/theme.css` and copies the brand artwork
into `public/brand/`; both paths are generated and gitignored. Each app's layout imports `theme.css` before
`globals.css`, and `globals.css` holds only app-level CSS. The preset maps every token to a utility through
`hsl(var(--token))`, so components write `bg-brand` or `text-success`, never a hex value.

`next-themes` owns the `.dark` class (`attribute="class"`, `defaultTheme="dark"`, `enableSystem`,
`disableTransitionOnChange`). Baked assets cannot read a CSS variable, so the manifest, the viewport `themeColor`, the
tile colours, and the OG images carry literal hex that matches the dark theme; [colors.yml](design/colors.yml) lists
every token and every baked value.

The base stylesheet also sets the theme colours on `html body` outside any cascade layer. Next's built-in 404 page ships
an unlayered `body` colour rule that would otherwise beat Tailwind's layered base styles.

## Icons

Every icon comes from Font Awesome Free, the solid set for interface icons and the brand set for social networks,
through [Icon](../packages/ui/components/icon.tsx) in `@typhed/ui`: `<Icon icon={faSun} className="h-4 w-4" />`. `Icon`
switches off Font Awesome's runtime style injection, so the stylesheet that `base.css` places in the base layer is the
only one, and Tailwind utilities size every icon. No icon or logo is drawn by hand; the
[decision record](adr/2026-11-17-font-awesome-for-every-icon.md) explains the choice.

## Content Single Source Of Truth

Brand strings, navigation, the footer, contact details, the launch schedule, and the properties all live in
[packages/brand](../packages/brand) as JSON, with [index.ts](../packages/brand/index.ts) as the typed view. Edit the
JSON, never the TypeScript. Each value is written down once. A link in `navigation.json` names its destination in one
of three ways: a brand path, URL, or `#` placeholder in `href`; a property by id (`"property": "trading"`), which takes
the URL from `properties.json` and opens in a new tab unless it is the brand site; or a social account by icon
(`"social": "linkedin"`). `index.ts` resolves every reference and throws at module load, which stops the build, when
one names nothing. It also builds the mail link from `contactEmail`, the copyright line and the header's first link,
to the brand hub, from `site.json`'s name and tagline, and prepends the privacy link to the DISCLAIMER column. The
`@typhed/brand` tests guard all of this, including that no property or social URL is written a second time.

<div align = "center">

| File | Holds |
| :---: | --- |
| `site.json` | Brand name, tagline, canonical URL, description |
| `navigation.json` | Header nav, login call-to-action, footer columns, social links, contact email, privacy link, copyright |
| `properties.json` | One entry per app: URL, name, description, keywords, and its sidebar groups |
| `launch.json` | The countdown target and the progress bar's zero point, in UTC |
| `tokens/*.json` | Colour, spacing, and typography values |
| `api.json`, `products.json`, `profile.json` | Contracts read by the separate account backend |

</div>

`getProperty(id)` returns a property's entry. The metadata helper `buildMetadata()` in `@typhed/ui/lib/metadata` builds
each page's title, description, icons, Open Graph, Twitter, and robots metadata from it, and `allowedRedirectOrigins` in
the auth provider lists every property URL. `resolveBrandHref` expands brand-layer paths such as `/about/` and
`/permalink/conduct.html` against the brand URL, so header and footer links reach the brand hub from every subdomain.
Footer entries marked `external: true` open in a new tab with a safe `rel` and a screen-reader note, and no icon.

## Page Shell, Sidebar, And Scroll Model

Each app's layout wraps its pages in `ThemeProvider`, then `AuthProvider`, then
[SiteShell](../packages/ui/components/site-shell.tsx). `SiteShell` renders the shared `SiteHeader`, the page, and the
shared `SiteFooter`; the header and footer are identical on every property. When the property's entry has sidebar
groups, `SiteShell` also renders [ProductSidebar](../packages/ui/components/product-sidebar.tsx): a left-hand menu,
expanded by default, that animates as it collapses and remembers the choice per property in `localStorage`. Today only
trading has one.
`SiteShell` options turn on the animated background (web, blogging) and the `ScrollToTop` button (web). App extras sit
beside the shell: trading's `PrivacyGuard` and chat button, and the blog's analytics.

The sticky header is `h-16`, and the web app's `globals.css` offsets anchors with `scroll-padding-top: 4rem`; the two
change together. The web home page snaps full-height sections with `scroll-snap-type: y proximity`.

## Client Side Authentication

Sign-in runs in the browser through Clerk's framework-agnostic `@clerk/react` SDK; `@clerk/nextjs` imports a Server
Action that a static export cannot build. [packages/auth](../packages/auth/src) is the only package that imports Clerk:

  * `AuthProvider` mounts `ClerkProvider` inside `ThemeProvider`, with the accent taken from the brand tokens for the
    active theme, `afterSignOutUrl="/"`, and every property URL as an allowed redirect origin.
  * `AuthControls` fills the header's `authSlot` and `mobileAuthSlot`: the brand Login / Sign Up button opens Clerk's
    sign-in in a modal; signed in, it shows Clerk's user menu.
  * `SignedInGate` shows its children to a signed-in visitor and its `fallback` to everyone else. Trading's workspace
    and members-only sections and the blog's freemium posts use it with their own prompts.
  * `useEntitlements()` reports the account's tier and grants from Clerk `publicMetadata`; trading resolves them against
    its feature catalogue.

The publishable key is public and inlined at build time from `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Without it, auth is
off and every gate passes through; the deploy workflow refuses to build production without it. One Clerk production
instance (`clerk.typhed.com`) serves every subdomain. `@typhed/ui` stays auth-free: the header takes the control as a
slot.

## Permalink Redirect Generator

[permalink/src/build.py](../permalink/src/build.py) turns the `[links]` table in
[links.toml](../permalink/config/links.toml) into redirects. It needs Python 3.13 and `jinja2==3.1.6`. For each entry,
keyed by its output filename, it writes:

  * an HTML page at `out/permalink/<key>` that redirects through a canonical link, a zero-delay meta refresh, and a
    `location.replace` fallback, marked `noindex, nofollow`;
  * with `--redirects out/_redirects`, a `302` rule for `/permalink/<key>` (and for `.html` keys, the extension-less and
    trailing-slash forms) inside a `# permalink:begin` / `# permalink:end` block that later runs replace in place.

Cloudflare answers a matching path with the 302 at the edge; the HTML page serves plain file servers. Keys must be one
safe path segment, and targets must be absolute `http` or `https` URLs, or the build stops. The web app's `build` script
runs the generator after `next build`. Adding a redirect is a new table in `links.toml`.

## Deployment Pipeline

[deploy.yml](../.github/workflows/deploy.yml) deploys on every push to `master` and on a manual run whose `apps` input
is `all` or a comma-separated list. The `targets` job runs [deploy-targets.mjs](../scripts/deploy-targets.mjs): an app
is deployable when `apps/<name>/wrangler.jsonc` exists, and a push deploys the apps Turborepo marks as affected since
the previous tip (every app when that tip is unknown). Both workflows set up with `pnpm/setup`, which installs the
pinned pnpm and Node.js and then the frozen lockfile. For each app the `deploy` job exports every `NEXT_PUBLIC_*`
repository Variable, fails when the Clerk key is missing, builds the app, and runs `wrangler deploy` with the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. One deployment per app runs at a time.

Each `wrangler.jsonc` describes an assets-only Worker named `typhed-<app>`: assets from `./out`,
`html_handling: "auto-trailing-slash"` for the trailing-slash export, `not_found_handling: "404-page"` for the exported
404 page, the route of its hostname on the `typhed.com` zone, and `workers_dev: true`, so the Worker also answers at
`https://typhed-<app>.typhed-main.workers.dev`. `www.typhed.com` redirects to the apex through a Cloudflare Redirect
Rule.

## Quality Gates

[ci.yml](../.github/workflows/ci.yml) runs on every pull request and on `master`:

<div align = "center">

| Command | Checks |
| :---: | --- |
| `pnpm format:check` | Prettier, with `prettier-plugin-tailwindcss` sorting class names |
| `pnpm lint` | ESLint 10, `eslint .` in each app and each package with source code, with the root [eslint.config.mjs](../eslint.config.mjs) spreading `eslint-config-next/core-web-vitals` |
| `pnpm typecheck` | `tsc --noEmit` in every app and package |
| `pnpm test` | Vitest suites of `apps/trading`, `chart-engine`, `risk-toolkit`, `backtest`, and `brand` |
| `pnpm build` | The three static exports, which fail loudly on server-only code |

</div>

## Load Bearing Constraints

<div align = "center">

| Constraint | Why It Holds |
| :---: | --- |
| No server-side code in any app | The exports have no runtime; server features fail the build or vanish silently. |
| `images.unoptimized` stays `true` | No image optimisation server exists. |
| Internal links keep the trailing slash (`/about/`) | The export emits directory-style routes. |
| Colours come from tokens, never a hex literal in a component | Both themes move together through `theme.css`. |
| No `:root` or `.dark` palette in any `globals.css` | The generated `theme.css` carries the palette; a local copy silently wins. |
| `apps/*/public/brand/` and `apps/*/app/theme.css` stay generated | `typhed-brand-sync` overwrites them before every build. |
| Copy, nav, and property values come from `@typhed/brand` | Header, footer, metadata, and JSON-LD agree on every property. |
| Only `@typhed/auth` imports Clerk | `@typhed/ui` stays usable by any property, whatever its auth. |
| Every shared source directory is in `content.js` | Tailwind generates only classes it has scanned. |
| Third-party versions live only in the root `package.json` | One version per dependency on every site, and one `node_modules`. |
| Icons render through `@typhed/ui`'s `Icon` | It keeps Font Awesome's styles in the base layer, where utilities size every icon. |
| The header height and `scroll-padding-top` change together | Anchors land under the sticky header. |
| Redirect keys are one safe segment; targets are absolute http(s) | Validated at build time; anything else stops the build. |
| An app is deployable only through its `wrangler.jsonc` | The deploy workflow discovers apps from that file. |

</div>

## Extending The Workspace

A new subdomain is one entry in `properties.json`, an `apps/<name>` folder, and its `wrangler.jsonc`; the
[domain and subdomain model](brand/subdomain-model.md) lists the steps. A new shared package goes in `packages/`, is
consumed with `workspace:*`, is linked from the root `package.json`, extends a `@typhed/tsconfig` base, and, if it
renders Tailwind classes, joins `content.js`. A new dependency, with its version, goes in the root `package.json`.

## Related References

  * [Component library](components/README.md) - props, variants, anatomy, and accessibility of the shared components.
  * [colors.yml](design/colors.yml), [spacing.yml](design/spacing.yml), [typography.yml](design/typography.yml) - the
    colour, layout, and type systems.
  * [Architecture decision records](adr/README.md) - each design decision, dated, with its context and consequences.
  * [PRD.md](PRD.md) - what each property is for and what belongs on it.
  * [subdomain-model.md](brand/subdomain-model.md) - domains, Workers, DNS, and the shared sign-in.
  * [README.md](../README.md) - overview, local development, and commands.

</div>
