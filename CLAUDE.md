# CLAUDE.md

@shared/documents/claude/brand.md
@shared/documents/claude/conventions.md
@shared/documents/claude/shared-workflow.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository. The brand context, the
shared conventions, and the submodule workflow come from the imports above. Everything below is true of this repository
only.

## What This Repo Is

The blog for the TyPhed brand, served at `blog.typhed.com` from GitHub Pages. It is a Next.js 15 (App Router, React 19)
application exported to static HTML. Posts are MDX files rendered with LaTeX math (KaTeX) and syntax-highlighted code
(Shiki) at build time.

  * `apps/web` - the Next.js app, and the only thing this repository builds.
  * `shared/documents` - submodule, the brand contract. Do not edit casually; see the shared workflow above.
  * `shared/components` - submodule, the shared component library. Same warning.

## Scope

This property is the blog. Brand-level content - marketing, pricing, legal, company information - belongs on
`typhed.com`, not here. Product features belong to that product's own subdomain.

## Commands

Run from the repository root.

| Command | What It Does |
| :---: | --- |
| `corepack enable && pnpm install` | One-time setup. Needs the submodules checked out first; see the warning below. |
| `pnpm dev` | Run locally with hot reload at `localhost:3000`. |
| `pnpm build` | Produce the static export into `apps/web/out/`. |
| `pnpm lint` | ESLint across the app. |
| `pnpm typecheck` | `tsc --noEmit` across the workspace, including both shared packages. |
| `pnpm format` / `pnpm format:check` | Prettier write / check. `shared/` is excluded; it belongs to another repository. |
| `pnpm shared:update` | Fast-forward both submodules to their branch tip, then reinstall. |
| `pnpm shared:status` | Show uncommitted or unpushed work inside either submodule. |

There is no test suite. The quality gates are `pnpm lint` and `pnpm typecheck`; CI additionally runs the production
build.

**`pnpm install` cannot bootstrap the submodules.** The workspace includes packages that live inside `shared/`, so pnpm
resolves them before any lifecycle script runs: with an empty `shared/` the install fails on
`ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` and the root `postinstall` never fires. Clone with `--recurse-submodules`, or run
`git submodule update --init --recursive` before the first install.

## Architecture

Unqualified paths in this section - `app/`, `components/`, `lib/`, `content/`, `public/` - are relative to `apps/web/`.
Paths under `shared/` and `.github/` are relative to the repository root.

### Static Export Model

`next.config.mjs` sets `output: "export"`, so there is no server at runtime. `trailingSlash: true` emits
`route/index.html` directories for Pages, and `images.unoptimized` is required because there is no Image Optimization
server. Anything needing a server (API routes, SSR, `next start`) will not work; treat the output as plain files.
Everything a post needs is resolved at build time. `transpilePackages` compiles `@typhed/ui` and `@typhed/brand` from
source, since neither ships a build.

### The Shared Brand Layer

`sync-shared.mjs` runs from `predev` and `prebuild`. It copies `shared/documents/assets/brand/` into
`apps/web/public/brand/` and generates `apps/web/app/theme.css` from `brand/tokens/colors.json`. Both destinations are
generated and gitignored - editing either by hand is overwritten on the next build.

`app/layout.tsx` imports `theme.css` before `globals.css`. That ordering matters: the generated file declares the custom
properties every token utility reads. The palette is a real stylesheet rather than a Tailwind plugin on purpose - a
bundler tracks the CSS files it compiles but not JSON that a Tailwind config happens to require, so emitting the palette
from the preset serves stale colours on incremental builds.

`tailwind.config.ts` contributes only content globs; everything else comes from the `@typhed/tailwind-config` preset.
The glob reaching into `../../shared/components/packages/ui/components` must stay **relative**. This repository is
checked out under a directory named `[GitHub] [TyPhed] ...`, and an absolute path would put those brackets into the
pattern, where a globber reads them as character classes and silently matches nothing - shared components then render
with their styles absent while the build still succeeds.

`app/globals.css` deliberately keeps two token groups that are **not** brand-level: `--chart-1` through `--chart-4`,
read at runtime by `components/chart-inner.tsx`, and `--font-scale`, driven by the reader text-size control.

`lib/constants.ts` holds blog-only values and imports the brand-level ones from `@typhed/brand`.

### Content Pipeline

`lib/posts.ts` reads `content/blog/*.mdx` with `node:fs` at build time, parses frontmatter with `gray-matter`, and
computes reading time. `app/blog/[slug]/page.tsx` pre-renders every post via `generateStaticParams` and compiles the
body with `compileMDX` from `next-mdx-remote/rsc`, wiring `remark-diagrams` (local), `remark-gfm`, `remark-math`,
`rehype-slug`, `rehype-collect-headings` (local), `rehype-autolink-headings`, `rehype-katex`, and `rehype-pretty-code`.
Element styling is in `components/mdx-components.tsx`, except code blocks, which `rehype-pretty-code` owns and
`app/globals.css` styles. Add a post by adding a file; no code change needed.

### Diagrams, Charts, And The Table Of Contents

Some fenced-code languages are intercepted in `lib/remark-diagrams.ts`, a remark plugin that runs first and rewrites the
`code` nodes before `rehype-pretty-code` can turn them into highlighted text. A `mermaid` fence becomes a diagram and a
`chart` fence becomes an interactive Recharts chart - both rewritten into `<Mermaid>` / `<Chart>` MDX JSX elements
(passing the raw fence body as a string prop) and mapped to components in `components/mdx-components.tsx`. A `latex`
fence (or `math` / `tex`) instead becomes a display-math block - the plugin emits the same `div.math-display` a `$$…$$`
block would, so `rehype-katex` renders it - the block-level companion to inline `$x^2$`, which `remark-math` already
handles. `components/mermaid.tsx` lazy-imports `mermaid` in a client effect and re-renders on theme change.
`components/chart.tsx` lazy-loads `components/chart-inner.tsx` (`next/dynamic`, `ssr: false`) so Recharts is a
client-only chunk. A chart fence is a small JSON spec: `type` (`line` / `area` / `bar`), `xKey`, `series[]`, `data[]`,
and optional `title`, `xLabel`, `yLabel`, `smooth`, and `refLines`. Chart series colours come from the validated
`--chart-1..4` tokens, read from CSS at runtime so they track the theme.

Every article puts the body in the middle with a rail on each side. `lib/rehype-collect-headings.ts` harvests the
`h2`-`h4` ids that `rehype-slug` assigned (so the anchors always match) into an array the page hands to
`components/post-body.tsx`. That client component lays out, from the `md` breakpoint up, the frontmatter panel on the
left (the access-links panel on top, then the related posts list), the article in the middle, and the table of contents
on the right (`components/table-of-contents.tsx`, whose `IntersectionObserver` highlights the section nearest the top as
the reader scrolls). Each rail renders only when it has content, so the columns adapt and never leave an empty gap: with
both rails it is a 20/60/20 three-column grid capped at 78rem, with only the left panel it falls back to 22/78 (panel
left) at 66rem, with only the TOC it falls back to 80/20 (TOC right) at 64rem, and with neither the article takes the
full single reading column. Everything collapses to that single column below `md`. The article stays first in the DOM -
the reading and mobile order - and is placed into the center column explicitly on `md+`, so screen readers reach the
body before either rail. The TOC follows the same access gate as the body: a freemium post reveals it only once the
reader is signed in (`useAuth`), a public post always shows it, and with Clerk unconfigured it shows for every post -
the ungated fallback. The access panel and the related list are keyed only to the frontmatter, so they are never gated -
they appear only when the post declares them. Both the diagram/chart rendering and the scroll-spy run in the browser,
consistent with the static-export model.

Two optional frontmatter blocks feed the rail. A `links` block (a map keyed by platform slug, each entry carrying
`type`, `link`, and `rtag`) drives the "Trade With" access panel in `components/access-panel.tsx`: every listed platform
renders with a mark from `components/platform-icons.tsx` (TradingView, NinjaTrader, MetaTrader, Thinkorswim, plus a
generic fallback), a populated `link` becomes an active branded button and an empty one renders dimmed and disabled. The
shared `AccessLink` type and the `hasAccessLinks` guard live in `lib/access-links.ts`, deliberately free of `node:*`
imports so the client rail can use them without pulling `lib/posts.ts` into the browser bundle. A `related` list of post
slugs drives `components/related-posts.tsx`; `getRelatedPosts` in `lib/posts.ts` resolves them to listing metadata at
build time, dropping unknown, hidden, duplicate, and self-referential slugs.

### Access Categories And Authentication

Every post carries an `accessCategory` in frontmatter: `public` (the default) or `freemium`. `lib/posts.ts` parses it
and `toMeta` defaults a missing value to `public`; `lib/constants.ts` holds `ACCESS_CATEGORIES`, the single source for
each tier's emoji and label. `components/access-badge.tsx` renders the badge on the index and the post header.

Auth is Clerk, and it is **client-only** because this is a static export with no server: no middleware, no `auth()`, no
API routes. The provider is `@clerk/react` (not `@clerk/nextjs`, whose `ClerkProvider` is a server component that
expects middleware), wrapped in `components/clerk-provider.tsx` and mounted in `app/layout.tsx`. Session state is read
through the `useAuth()` hook. `components/freemium-gate.tsx` wraps the compiled MDX body of a freemium post: signed-in
readers see it, everyone else gets a sign-in card. The header sign-in lives in `components/auth-buttons.tsx` and opens
Clerk in a modal; it reaches the shared header through its `authSlot` / `mobileAuthSlot` props, which is how
`@typhed/ui` stays free of any auth dependency.

The blog reuses the **same Clerk publishable key as `typhed.com`**. Because it is a subdomain of the same root, Clerk
shares the session across both sites automatically, with no satellite domain. The key is
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; like the analytics ids it is public and ships to the browser. When it is unset,
`CLERK_ENABLED` is false, the provider is skipped, and freemium posts render ungated, so dev and unauthenticated builds
work with no Clerk config.

The gate is a **soft gate**: the body is compiled at build time and travels in the page payload, so it is hidden, not
secret. That is the right trade for freemium; real paid content would need a server or edge check. Freemium posts stay
in `getAllPosts()`, so they remain listed on the index and in `sitemap.xml` - the public title and description are the
teaser.

### Analytics And Monetization

`components/analytics/` holds GA4, AdSense (loader plus `AdUnit` slot), and Microsoft Clarity. Each reads a
`NEXT_PUBLIC_*` variable and renders nothing when it is unset, so dev builds stay untracked. Search Console
verification is a meta tag driven by `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`. `apps/web/public/ads.txt` carries the
AdSense publisher line. Note the privacy principle in the brand context above: adding a new third-party tag here is a
brand decision, not a routine one.

### Deployment

`.github/workflows/deploy.yml` runs on a published GitHub Release or manual `workflow_dispatch`. It checks out both
submodules, floats them to their branch tip with `git submodule update --remote --merge`, installs with
`--no-frozen-lockfile`, builds the static export, and deploys `apps/web/out/` to GitHub Pages. The custom domain is
declared in `apps/web/public/CNAME`. There is no push-to-deploy on `master`; publishing a Release ships the site.

The install is deliberately not frozen: floating the submodules can introduce a dependency this lockfile has never seen,
and `--frozen-lockfile` fails on exactly that. Reproducibility is traded for propagation on purpose.

### Custom Domain And DNS Routing

`blog.typhed.com` is a project site served from this repository, while `typhed.com` is served from the separate
`typhed.github.io` repository in the same organization. Both custom domains resolve to the same GitHub Pages host, and
GitHub picks which repository answers a request by matching the `Host` header against each repo's configured custom
domain. That is why `apps/web/public/CNAME` must stay `blog.typhed.com`: it is the claim that routes the subdomain to
this repo.

The DNS record for `blog` is a `CNAME` whose target is the organization's Pages host, `typhed.github.io` - a bare
hostname, never a URL or a path. A target with a slash (for example `typhed.com/blog.typhed.com`) is treated as a
literal string, resolves to nothing, and surfaces as Cloudflare Error 1016. The record runs through Cloudflare Proxied
with SSL/TLS set to Full (strict); the certificate has to be provisioned with the record temporarily set to DNS only,
since GitHub cannot reach the origin through the proxy. See [setup.md](setup.md) for that order. There is no `basePath`
in `next.config.mjs` because the site is served at the domain root, not a subpath.

## Conventions

Only what differs from, or adds to, the shared conventions:

  * **The blog's own components live in `apps/web/components/`.** Reach for `@typhed/ui` first; add here only what is
    specific to this property. `scroll-to-top.tsx` is deliberately a local variant of the shared one - it honours
    `prefers-reduced-motion`.
  * **Baked hex is confined to four files.** `app/layout.tsx`, `app/manifest.ts`, `app/opengraph-image.tsx`, and the
    pre-hydration fallback in `components/chart-inner.tsx` carry literal hex because a PWA manifest, a `themeColor` meta
    tag, and an `ImageResponse` cannot read a CSS variable. Every one of them is listed in the `static_assets` block of
    `shared/documents/docs/design/colors.yml`. Nowhere else.
