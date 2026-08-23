<div align = "center">

# TyPhed Architecture

</div>

<div align = "justify">

This page is the architecture reference for the repository. It records how the two build artifacts are produced, how the
workspace is wired together, and which constraints are load bearing. [CLAUDE.md](../CLAUDE.md) points here rather than
repeating any of it, so open this file when a change touches build configuration, the package graph, theming,
authentication, or the deploy workflow. Routine copy edits and component work do not need it.

The source code is the truth. When this page and the code disagree, fix the page.

Scope is a separate question from architecture. What belongs on this site at all, and what belongs on a product
subdomain instead, is settled by [PRD.md](../shared/documents/docs/brand/PRD.md): `typhed.com` is the brand and acquisition layer, and each product
ships on its own subdomain with its own architecture. This page describes how the brand layer is built, not what it is
allowed to contain.

## What To Read Before You Change Something

| If You Are Changing | Read | Primary Source |
| :---: | --- | --- |
| Next.js config, routing, or anything server-shaped | [Static Export Model](#static-export-model) | [next.config.mjs](../apps/web/next.config.mjs) |
| A workspace script, task order, or caching | [Build & Task Graph](#build--task-graph) | [turbo.json](../turbo.json) |
| Anything under `shared/` | [The Shared Submodule Layer](#the-shared-submodule-layer) | [.gitmodules](../.gitmodules) |
| A shared package, import path, or tsconfig | [Shared Packages Consumed from Source](#shared-packages-consumed-from-source) | [shared/components/packages/](../shared/components/packages) |
| A color, a token, or a themed surface | [Theming & Color Tokens](#theming--color-tokens) | [colors.json](../shared/documents/brand/tokens/colors.json) |
| Spacing, layout rhythm, or type | [spacing.yml](../shared/documents/docs/design/spacing.yml), [typography.yml](../shared/documents/docs/design/typography.yml) | [tailwind.config.js](../shared/components/packages/config-tailwind/tailwind.config.js) |
| Brand copy, dates, nav, or contact links | [Content Single Source of Truth](#content-single-source-of-truth) | [brand/](../shared/documents/brand) |
| The header, footer, background, or scroll behaviour | [Page Shell & Scroll Model](#page-shell--scroll-model) | [layout.tsx](../apps/web/app/layout.tsx) |
| Sign in, sign up, or session handling | [Client Side Authentication](#client-side-authentication) | [clerk-provider.tsx](../apps/web/components/clerk-provider.tsx) |
| A redirect under `/permalink/` | [Permalink Redirect Generator](#permalink-redirect-generator) | [build.py](../permalink/src/build.py) |
| CI, release, or hosting behaviour | [Deployment Pipeline](#deployment-pipeline) | [deploy.yml](../.github/workflows/deploy.yml) |

---

## The Two Artifacts

The repository is a pnpm workspace driven by Turborepo that produces two independent artifacts and ships them as one
GitHub Pages deployment at `typhed.com`.

  1. **The Site**: [apps/web](../apps/web), a Next.js 15 App Router application on React 19, exported to static HTML.
  2. **The Redirects**: [permalink/](../permalink), a Python and Jinja2 generator that renders one self-contained
     redirect page per entry in a TOML file, served under `/permalink/` endpoint.

Nothing links the two at the source level. They meet at deploy time, when the redirect generator writes its pages
directly into the web app's export output, so a single Pages upload carries both.

```text
  shared/documents/brand ---------+  (submodule: @typhed/brand)
  shared/components/packages/* ---+---> apps/web --[ next build ]--> apps/web/out/
                                  |  (submodule: ui, tailwind, tsconfig)  |
  shared/documents/assets/brand --+  (copied into public/brand)           |
                                                                          |
  permalink/config/links.toml --[ build.py + redirect.jinja ]--> apps/web/out/permalink/
                                                                          |
                                                                          v
                                        upload-pages-artifact --> deploy-pages --> typhed.com
```

## Repository Layout

| Path | Role | Built? |
| :---: | --- | :---: |
| [apps/web](../apps/web) | The public site. Owns routing, metadata, the auth wiring, and the app-level CSS. | Yes |
| [shared/documents](../shared/documents) | **Submodule.** The `@typhed/brand` contract, design tokens, brand assets, brand docs, and the shared `CLAUDE.md` fragments. | No, compiled from source |
| [shared/components](../shared/components) | **Submodule.** `@typhed/ui`, `@typhed/tailwind-config`, `@typhed/tsconfig`, and the component reference docs. | No, compiled from source |
| [permalink](../permalink) | The Python redirect generator, its TOML link table, and the Jinja template. | Yes, separately |
| [docs](.) | This repository's own reference: the architecture page you are reading. | No |
| [.github/workflows](../.github/workflows) | The release-triggered Pages deployment. | No |

Workspace membership comes from [pnpm-workspace.yaml](../pnpm-workspace.yaml), which globs `apps/*`,
`shared/components/packages/*`, and `shared/documents/brand`. The last two reach inside the submodules, which is what
makes `@typhed/ui` and `@typhed/brand` ordinary workspace packages rather than published dependencies. That file also
declines three postinstall build scripts on purpose: `sharp` (the export never optimizes images), `unrs-resolver` (the
lint import resolver works without its native binary), and `@clerk/shared` (its postinstall only prints a telemetry
notice).

## The Shared Submodule Layer

Two directories under `shared/` are git submodules pointing at separate repositories, and roughly half of what renders
on this site comes from them:

| Path | Repository | Provides |
| :---: | :---: | --- |
| `shared/documents` | [typhed/shared.documents](https://github.com/typhed/shared.documents) | `@typhed/brand`, design tokens, brand artwork, brand docs, `CLAUDE.md` fragments |
| `shared/components` | [typhed/shared.components](https://github.com/typhed/shared.components) | `@typhed/ui`, `@typhed/tailwind-config`, `@typhed/tsconfig`, component docs |

Every other TyPhed property mounts the same two repositories at the same two paths. A component or a brand string is
therefore written once and rendered everywhere, which is the whole point of the arrangement.

### How A Shared Change Reaches This Site

A submodule pins an exact commit and does not follow a branch on its own, so propagation is deliberate rather than
automatic. Four pieces make it work:

  1. [.gitmodules](../.gitmodules) sets `branch = master` on both, giving `git submodule update --remote` something to
     fast-forward to.
  2. `pnpm shared:update` runs that update and reinstalls, pulling shared changes into a local checkout on demand.
  3. **The deploy workflow floats to the branch tip.** A `git submodule update --remote --merge` step runs after
     checkout, so every release build compiles the newest shared code even when the recorded pointer is stale. This is
     what makes a shared edit reach production without touching this repository.
  4. Dependabot's `gitsubmodule` ecosystem raises the pointer bump as a pull request, so the recorded commit does not
     drift far behind what CI actually builds.

Two consequences follow, and both are deliberate:

  * **CI installs with `--no-frozen-lockfile`.** Floating a submodule can introduce a dependency this repository's
    lockfile has never seen, and a frozen install fails on exactly that. Reproducibility from a single commit SHA is
    traded for propagation. Removing the `--remote` step and restoring `--frozen-lockfile` reverses the trade.
  * **A broken commit in a shared repository breaks this site's next build**, along with every other property, at the
    same moment.

### Editing Inside A Submodule

`shared/` is a checkout of another repository. An edit there is not part of this repository's commit and reaches
nothing until it is committed and pushed inside the submodule directory itself. `pnpm shared:status` reports
uncommitted or unpushed work in either one. `git status` in this repository shows only a single gitlink line such as
` M shared/components`, never the individual files.

A plain `git clone` leaves both directories empty, which breaks the build, the workspace, and the `@import` lines at
the top of [CLAUDE.md](../CLAUDE.md) all at once. The root `postinstall` runs
`git submodule update --init --recursive` so a first `pnpm install` repairs it.

## Build & Task Graph

[turbo.json](../turbo.json) defines the task graph. Every root script is a `turbo run <task>` fan-out, so `pnpm build`
at the root means "build everything that has a build script, in dependency order".

| Task | Behaviour |
| :---: | --- |
| `build` | Depends on `^build`. Caches `out/**` and `.next/**`, excluding `.next/cache/**`. |
| `dev` | Never cached, marked persistent so Turbo keeps the process alive. |
| `lint` | Depends on `^build`. |
| `typecheck` | Depends on `^build`. |
| `clean` | Never cached. |

`^build` means "build my dependencies first". None of the shared packages define a `build` script, so that dependency
edge currently resolves to nothing and the graph is effectively a single build of `apps/web`. This is by design: the
packages are consumed as source, not as build output.

`globalDependencies` lists `**/.env.*local`, so editing a local env file invalidates the cache. The Clerk publishable
key is read at build time, and without that entry a key change would hand you a stale cached bundle.

One command people reach for does not apply here. `next start` exists in [package.json](../apps/web/package.json) as a
leftover of the Next.js template, and the export has no server for it to run. To preview a build, serve the directory
with any file server, for example `pnpm dlx serve apps/web/out`.

## Static Export Model

[next.config.mjs](../apps/web/next.config.mjs) sets four options, and three of them constrain everything downstream.

| Option | Value | Consequence |
| :---: | :---: | --- |
| `output` | `"export"` | No Node runtime at any point after the build. The result is plain files. |
| `trailingSlash` | `true` | Routes emit `route/index.html`, which is what GitHub Pages serves for `/about/`. |
| `images.unoptimized` | `true` | Required: there is no Image Optimization server to resize or reformat anything. |
| `transpilePackages` | `["@typhed/ui"]` | Next compiles the shared package from `.tsx` on every build. |

Anything that needs a request-time server is unavailable: route handlers used as APIs, server actions, middleware,
`auth()`-style server session reads, incremental regeneration, rewrites, and redirects. This is not a preference to
work around. A server feature either fails the build or silently produces nothing, and the failure usually surfaces as a
missing file rather than an error page.

Metadata routes are the exception that proves the rule. [robots.ts](../apps/web/app/robots.ts),
[sitemap.ts](../apps/web/app/sitemap.ts), and [manifest.ts](../apps/web/app/manifest.ts) each declare
`export const dynamic = "force-static"`, which pins them to build-time evaluation so they emit as real files in the
export. [opengraph-image.tsx](../apps/web/app/opengraph-image.tsx) is rendered to a PNG the same way.

Two files in [apps/web/public](../apps/web/public) carry the hosting contract and must survive any cleanup:

  * `CNAME` holds `typhed.com`, the custom domain GitHub Pages binds on every deploy.
  * `.nojekyll` is empty on purpose. Without it, Pages runs Jekyll, and Jekyll drops the `_next` directory because its
    name starts with an underscore. The site would deploy successfully and then load with no CSS or JavaScript.

## Shared Packages Consumed from Source

`@typhed/ui` is never pre-built. There is no `dist`, no build script, and no compile step of its own. The web app lists
it under `transpilePackages`, and Next compiles the `.tsx` files during its own build. Editing a component takes effect
immediately in `pnpm dev`, with nothing to rebuild in between.

Imports follow the export map in
[shared/components/packages/ui/package.json](../shared/components/packages/ui/package.json):

```tsx
import { SiteHeader } from "@typhed/ui/components/site-header"
import { Button } from "@typhed/ui/components/ui/button"
import { SITE, NAV_LINKS } from "@typhed/brand"
```

The map exposes exactly two patterns, `./components/*` to `./components/*.tsx` and `./lib/*` to `./lib/*.ts`. A new file
in either directory is importable with no packaging change. A new *directory* at the package root is not, and needs an
entry of its own.

Note the third line. Brand content comes from `@typhed/brand`, a separate package in the other submodule, not from
`@typhed/ui`. The component library renders the contract; it does not own it.

React and React DOM are peer dependencies of the package, so the app owns the single React 19 copy and the shared
components never pull a second one into the bundle.

### Configuration Packages

`@typhed/tsconfig` ships three bases, and each consumer extends exactly one.

| Base | Extended By | Notable Settings |
| :---: | :---: | --- |
| `base.json` | the other two | `strict`, `noUncheckedIndexedAccess`, ES2022 target, `Bundler` module resolution |
| `nextjs.json` | [apps/web](../apps/web/tsconfig.json) | `jsx: "preserve"`, the `next` TS plugin, `allowJs`, `noEmit` |
| `react-library.json` | [shared/components/packages/ui](../shared/components/packages/ui/tsconfig.json) | `jsx: "react-jsx"`, `noEmit` |

`@typhed/tailwind-config` is the shared preset. It reads its theme values from `@typhed/brand` and deliberately ships
an **empty `content` array**. Each app supplies its own globs, and
[apps/web/tailwind.config.ts](../apps/web/tailwind.config.ts) reaches into the submodule to do it:

```ts
content: [
  "./app/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
  "../../shared/components/packages/ui/components/**/*.{ts,tsx}",
]
```

That third glob is the one people forget. Tailwind only generates a class it has seen in a scanned file, so a component
living outside these globs renders with its styles silently missing, with no error anywhere. Any new source directory,
in the app or in either submodule, needs a matching glob here.

## Theming & Color Tokens

Colors are HSL triplets held in
[shared/documents/brand/tokens/colors.json](../shared/documents/brand/tokens/colors.json): the light theme
"Aurora Glass" and the dark theme "Midnight Indigo". Dark is the default.

Two pieces turn those triplets into working styles. The shared preset maps every token to a utility through
`hsl(var(--token))`, which is why components write `bg-brand` or `text-muted-foreground` and never a hex value. The
custom properties themselves are generated into `apps/web/app/theme.css` by the `sync:shared` script before every dev
run and every build, and [layout.tsx](../apps/web/app/layout.tsx) imports that file ahead of `globals.css`.

**No app declares the palette by hand.** `theme.css` is generated and gitignored, and
[globals.css](../apps/web/app/globals.css) holds only app-level CSS: the scroll model, scrollbar hiding, and the
selection colour. Reintroducing a `:root` token block in either would create a second source of truth that silently
overrides the shared one.

Light is written before dark on purpose. `:root` and `.dark` carry identical specificity, so source order is what lets
the dark theme win once `next-themes` puts the class on `<html>`.

### Why The Palette Is A Generated File

The preset originally emitted the palette itself, through a Tailwind `addBase` plugin reading the same JSON. That
produced correct output on a clean build and **silently stale colours on an incremental one**: webpack tracks the CSS
files it compiles and the Tailwind config, but not JSON that the config transitively `require`s, so a colour change
left `.next/cache` untouched and the previous stylesheet was reused.

A generated `.css` file is part of the module graph, so its content changing is exactly the signal the cache needs. The
trade is that an app which skips the generate step gets no colours at all. That is deliberate: a missing palette is
obvious in the first second of looking at the page, while a stale one is not.

The accent hue swaps between themes rather than staying fixed: indigo leads in light, cyan leads in dark. A change to
one theme almost always needs its counterpart edited too.

`next-themes` owns the `.dark` class. [layout.tsx](../apps/web/app/layout.tsx) configures it with `attribute="class"`,
`defaultTheme="dark"`, `enableSystem`, and `disableTransitionOnChange`, and sets `suppressHydrationWarning` on `<html>`
because the class is applied in the browser before React hydrates.

One category escapes the token system. Static and raster assets are baked at build time and cannot read a CSS variable,
so they carry literal hex that only approximates the dark theme: the PWA manifest, the viewport `themeColor` and tile
meta in `layout.tsx`, the OG image, and the brand artwork in
[shared/documents/assets/brand](../shared/documents/assets/brand). These are kept in sync by hand.

That artwork is copied into `apps/web/public/brand/` by the same `sync:shared` script that generates the theme, before
every dev run and every build, and the destination is gitignored. Editing anything under `public/brand/` is a change
that gets overwritten on the next build; edit the master files in the submodule instead.

[colors.yml](../shared/documents/docs/design/colors.yml) documents all of it: every token, its computed hex, where it is
used, and the exact sync rules. Read it before any color work. Note the division of labour: the JSON *is* the palette,
the YAML *describes* it, and a colour change updates both.

## Content Single Source of Truth

Brand strings, the launch schedule, navigation, and contact links live in the `@typhed/brand` package at
[shared/documents/brand](../shared/documents/brand). Components and apps read from it instead of hardcoding text, which
is what keeps the header, the footer, the page metadata, and the structured data agreeing with each other, on this site
and on every other TyPhed property.

The values are plain JSON so a property built on any stack can read them; [index.ts](../shared/documents/brand/index.ts)
is the typed view that TypeScript consumers import. Edit the JSON, never the TypeScript.

| File | Holds |
| :---: | --- |
| `site.json` | Name, tagline, legal entity, canonical URL, description |
| `launch.json` | The countdown target and the progress bar's zero point, in UTC |
| `navigation.json` | Header nav, login CTA, footer columns, social links, contact email, privacy link, copyright |
| `tokens/*.json` | The colour, spacing, and typography values the preset consumes |

Those files surface through these exports:

| Export | Holds |
| :---: | --- |
| `SITE` | Name, tagline, legal entity, canonical URL, description |
| `LAUNCH_DATE`, `LAUNCH_START_DATE`, `LAUNCH_LABEL` | The countdown target and the progress bar's zero point, in UTC |
| `NAV_LINKS`, `LOGIN_CTA` | Header navigation and the primary call to action |
| `FOOTER_COLUMNS`, `PRODUCT_LINKS`, `RESOURCE_LINKS`, `PRIVACY_LINK` | Footer link groups |
| `SOCIAL_LINKS`, `CONTACT_EMAIL`, `COPYRIGHT` | Contact row, address, and copyright lines |

`COPYRIGHT.line1` stamps the current year at module load from a template in `navigation.json`, so the footer needs no
annual maintenance.

`SITE` fans out further than it looks. [layout.tsx](../apps/web/app/layout.tsx) builds the Metadata object, the Open
Graph and Twitter cards, and the JSON-LD graph (an `Organization` node and a `WebSite` node) from it, and `robots.ts`,
`sitemap.ts`, and `manifest.ts` each read it too. Changing `SITE.url` moves the canonical URL, the sitemap entries, the
robots host, and the schema identifiers in one edit.

The launch dates are stored as UTC instants with the IST offset already applied, for example `2027-03-31T18:30:00Z` for
01 April 2027 00:00 IST. Keep that convention so the countdown reads correctly from any timezone.

The footer link groups carry the cross-product handoff described in [PRD.md](../shared/documents/docs/brand/PRD.md), so several of their entries
point off this domain: `trading.typhed.com`, `blog.typhed.com`, and the LinkedIn company page that serves as the
career page. Marking such an entry `external: true` is the whole mechanism. The footer reads that one flag to add
`target="_blank"`, the safe `rel`, the trailing arrow glyph, and the screen reader note, so pointing a link at a new
subdomain stays a data change and never a markup change.

## Page Shell & Scroll Model

[layout.tsx](../apps/web/app/layout.tsx) is a Server Component and assembles the shell in a fixed order: the Clerk
provider wraps the theme provider, which wraps the animated `AbstractBackground`, a flex column of `SiteHeader`, `main`,
and `SiteFooter`, and finally `ScrollToTop`. The JSON-LD script is injected after that tree.

Fonts load through `next/font/google` and are exposed as CSS variables, Inter as `--font-inter` and Space Grotesk as
`--font-space-grotesk`. The preset maps them to `font-sans` and `font-display`, so components pick a font by utility
class rather than by importing anything. The stacks themselves come from
[typography.json](../shared/documents/brand/tokens/typography.json), so an app must expose the CSS variables it names.
[typography.yml](../shared/documents/docs/design/typography.yml) carries the full type system, and
[spacing.yml](../shared/documents/docs/design/spacing.yml) the layout scale, the container, and the fluid rhythm these
sections depend on.

The site reads as a single scrolling page. [globals.css](../apps/web/app/globals.css) sets
`scroll-snap-type: y proximity` on `html`, so full-height sections settle into view without trapping a visitor on a
short one, and `scroll-padding-top: 4rem` offsets both snap targets and `#anchor` jumps by the sticky header's height.
Smooth scrolling is applied only inside a `prefers-reduced-motion: no-preference` guard. Scrollbars are hidden in every
engine while scrolling itself stays untouched.

The routes today are the home page, which renders the temporary `WipLanding` holding page, and `/about/`. The work in
progress components are deliberately undocumented and slated for replacement, as recorded in [CLAUDE.md](../CLAUDE.md).

### Server & Client Boundaries

Most of the tree is Server Components. The pieces that carry `"use client"` do so because they need state, effects, or
browser APIs: `ThemeProvider`, `ThemeToggle`, `ScrollToTop`, `MobileNav`, and both auth components. The boundary is a
real constraint, not a formality, and [the component docs](../shared/components/docs/components/README.md) record which side each
component sits on. Do not add hooks to a Server Component, and do not drop `"use client"` from a Client one.

## Client Side Authentication

Sign in runs entirely in the browser through Clerk, because there is no server to run it on.

The app uses `@clerk/react`, the framework-agnostic SDK, and **not** `@clerk/nextjs`. The Next adapter's provider
statically imports a Server Action, which a static export forbids, and that alone breaks the build. The React SDK boots
from the publishable key in the browser with no Server Actions and no middleware, which is exactly what a server-less
site can support.

The wiring is two small files in `apps/web`:

  * [components/clerk-provider.tsx](../apps/web/components/clerk-provider.tsx) is a `"use client"` wrapper that mounts
    `ClerkProvider` with `publishableKey`, `afterSignOutUrl="/"`, and an `appearance.colorPrimary` matched to the dark
    theme's `--brand` token so Clerk's hosted UI blends in.
  * [components/auth-controls.tsx](../apps/web/components/auth-controls.tsx) renders the shared `Button` inside a
    `SignInButton` with `mode="modal"` when signed out, and Clerk's `UserButton` when signed in.

`AuthControls` lives in the app rather than in `@typhed/ui` on purpose: the shared package stays free of any auth
dependency, and `SiteHeader` accepts the control as a slot (`authSlot` and `mobileAuthSlot`). Keep that direction. A
Clerk import inside `packages/ui` would couple every future product site to this one's auth choice.

The key itself is public and ships in the browser bundle, so it is a build-time value rather than a secret. Locally it
comes from `.env.local`, copied from [.env.example](../apps/web/.env.example). In CI it comes from a GitHub Actions
repository **Variable** named `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, not a Secret. The provider is prerendered as part of
the export, so a missing key surfaces during the build instead of shipping a page whose sign-in silently fails. The
Clerk secret key is never used here.

## Permalink Redirect Generator

[permalink/src/build.py](../permalink/src/build.py) turns a TOML table into static redirect pages. It has one runtime
dependency, `jinja2==3.1.6`, and needs Python 3.13 (the stdlib `tomllib` reader means 3.11 or newer).

Each redirect is one table in [permalink/config/links.toml](../permalink/config/links.toml), keyed by the output
filename:

```toml
[links."conduct.html"]
label = "The Code of Conduct"
target = "https://github.com/typhed/.github/blob/master/.github/CODE_OF_CONDUCT.md"
```

The build runs in three steps. `loadLinks` reads the file and returns its top-level `links` table, exiting with a clear
message if the file is missing or the table is absent. `main` then builds a Jinja environment rooted at the template's
directory with autoescaping on, validates every `target` as an absolute `http` or `https` URL with a network location,
and raises `ValueError` on anything else. Each entry is rendered and written as UTF-8 with `\n` line endings.

Three paths are configurable, and all three default to the project's standard layout:

```shell
$ python permalink/src/build.py --config permalink/config/links.toml --template permalink/src/templates/redirect.jinja --output permalink/dist
```

The output directory is created when missing, and files already sitting there that the configuration did not generate
are left alone.

[redirect.jinja](../permalink/src/templates/redirect.jinja) renders a page that redirects three ways for resilience: a
`rel="canonical"` link, a zero-delay `meta refresh`, and a `location.replace` script fallback, with a visible anchor to
the target underneath for anyone whose browser does neither. Every page carries `noindex, nofollow`, so the redirects
never compete with the real site in search results.

Adding a redirect is a configuration change. Append a table to `links.toml` and the next build renders it. No Python
edit is required.

## Deployment Pipeline

[.github/workflows/deploy.yml](../.github/workflows/deploy.yml) is the only path to production. It runs on a **published
GitHub Release** or a manual `workflow_dispatch`. There is deliberately no push-to-deploy on `master`: merging changes
nothing on the live site until a Release is published.

The workflow grants `pages: write` and `id-token: write`, and its `pages` concurrency group sets
`cancel-in-progress: false` so an in-flight deployment is never interrupted.

The `build` job runs in order:

  1. Check out the repository and set up pnpm through `pnpm/action-setup`, which reads the version from the
     `packageManager` field in [package.json](../package.json).
  2. Set up Node 22 with the pnpm cache, then `pnpm install --frozen-lockfile`.
  3. Run `pnpm --filter web build` with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` injected from the repository Variable,
     producing `apps/web/out`.
  4. Set up Python 3.13 with a pip cache keyed on `permalink/requirements.txt`, then install Jinja2.
  5. Run the redirect generator with `--output apps/web/out/permalink`, writing the redirect pages *into* the export.
  6. Upload `apps/web/out` as the Pages artifact.

The `deploy` job then publishes that artifact to the `github-pages` environment. Because step 5 writes into the same
directory step 3 produced, the site and its redirects always ship as one atomic deployment.

## Quality Gates

There is no automated test suite. Three commands stand in for one:

| Command | Checks |
| :---: | --- |
| `pnpm lint` | ESLint through `next lint`, extending `next/core-web-vitals` |
| `pnpm typecheck` | `tsc --noEmit` across the workspace |
| `pnpm format:check` | Prettier, with `prettier-plugin-tailwindcss` sorting class names |

CI adds the fourth and strongest gate: the production build itself, which runs on every Release. A static export fails
loudly on server-only code, so the build catches the class of mistake this architecture is most exposed to.

## Load Bearing Constraints

These hold the system together. Each one has already caused, or would immediately cause, a broken deployment.

| Constraint | Why It Exists |
| :---: | --- |
| No server-side code anywhere in `apps/web` | The export has no runtime. Server features fail the build or vanish silently. |
| `images.unoptimized` stays `true` | There is no Image Optimization server to serve a transformed image. |
| Internal links keep the trailing slash (`/about/`) | `trailingSlash: true` emits directory-style routes, and Pages serves them that way. |
| `CNAME` and `.nojekyll` stay in `apps/web/public` | They carry the custom domain, and they stop Jekyll from deleting `_next`. |
| Colors resolve from tokens, never a hex literal in a component | Both themes have to move together. See [colors.yml](../shared/documents/docs/design/colors.yml). |
| The palette stays out of `globals.css` | The generated `theme.css` carries it. A local `:root` block becomes a second source of truth that silently wins. |
| Copy, dates, and links come from `@typhed/brand` | Header, footer, metadata, and JSON-LD all read the same values, on every property. |
| `shared/` is never edited as part of this repository's commit | It is another repository. The change needs its own commit and push, and it reaches every property. |
| `apps/web/public/brand/` stays generated and gitignored | It is overwritten from the submodule before every build. |
| Off-domain footer links carry `external: true` | That flag, not the markup, gives them the new tab, the safe `rel`, and the arrow. |
| Tailwind `content` globs cover every scanned source directory | An unscanned file renders with its classes silently missing. |
| Auth stays in `apps/web`, injected into `SiteHeader` as a slot | Keeps `@typhed/ui` reusable by future sites with different auth. |
| Redirect targets are absolute `http` or `https` URLs | Validated at build time; anything else raises `ValueError`. |
| Deployment happens only on a published Release | The workflow has no push trigger, by design. |

## Extending the Workspace

Adding a second app or a shared package follows the existing shape:

  1. Create the directory under `apps/`. The workspace glob picks it up with no registration step. A new *shared*
     package belongs in the `shared.components` repository instead, not here.
  2. Depend on shared packages with `workspace:*`, and extend the right tsconfig base from `@typhed/tsconfig`.
  3. Consume the Tailwind preset with `presets: [sharedConfig]` and declare `content` globs covering both the new app and
     any package it renders components from.
  4. For a package consumed as source, add it to `transpilePackages` in the consuming app's Next config.
  5. Define `build`, `lint`, `typecheck`, and `clean` scripts. Turbo runs whatever it finds, so no task registration is
     needed either.

A second static site would also need its own deploy path. The current workflow uploads a single directory,
`apps/web/out`, as the Pages artifact.

Before adding one, check that it belongs here at all. [PRD.md](../shared/documents/docs/brand/PRD.md) puts each product
and the blog on its own subdomain, maintained in a separate repository rather than inside this deployment, and
`blog.typhed.com` already runs that way. A product that needs a server could not live in this export regardless.

A new subdomain repository starts from
[the bootstrap template](../shared/documents/templates/nextjs-subdomain/README.md), which carries the submodule wiring,
the workspace globs, the CI workflow, and a `CLAUDE.md` skeleton. [setup.md](../setup.md) works through the hosting
side, including the Clerk satellite-domain setup that keeps one sign-in valid across all of them.

## Related References

  * [Component library](../shared/components/docs/components/README.md) - props, variants, anatomy, and accessibility,
    one page per durable component. Lives in the `shared.components` repository, beside the code it describes.
  * [colors.yml](../shared/documents/docs/design/colors.yml) - the color system and the rules for changing it.
  * [spacing.yml](../shared/documents/docs/design/spacing.yml) - the layout system: scale, container, breakpoints,
    vertical rhythm, component sizes, and radius.
  * [typography.yml](../shared/documents/docs/design/typography.yml) - the type system: fonts and how they load, the
    scale, weights, tracking, and heading semantics.
  * [PRD.md](../shared/documents/docs/brand/PRD.md) - the product requirements document: what the site is for, what
    belongs on it, and the domain and subdomain model around it.
  * [MIGRATION.md](../shared/documents/MIGRATION.md) - how a repository joins the shared layer, and the trade-offs that
    come with it.
  * [CLAUDE.md](../CLAUDE.md) - repository conventions and the command table.
  * [README.md](../README.md) - project overview and local development.
  * [setup.md](../setup.md) - one-time hosting setup: GitHub Pages, the custom domain, HTTPS, DNS, and Clerk.

</div>
