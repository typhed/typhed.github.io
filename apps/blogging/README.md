<div align = "center">

# TyPhed Blog

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=plastic&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-20232A?style=plastic&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=plastic&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=plastic&logo=tailwindcss)](https://tailwindcss.com)
[![MDX](https://img.shields.io/badge/MDX-%20+%20LaTeX-1B1F24?style=plastic&logo=mdx)](https://mdxjs.com)
[![Shared Layer](https://img.shields.io/badge/Brand-%20Shared%20Submodules-003B57?style=plastic&logo=git)](https://github.com/typhed/shared.documents)
[![GitHub Pages](https://img.shields.io/badge/Deploy-%20GitHub%20Pages-222222?style=plastic&logo=githubpages)](https://pages.github.com)

</div>

<div align = "justify">

The blog for [typhed.com](https://typhed.com), served at `blog.typhed.com`. It is a Next.js
app that renders MDX posts with LaTeX math and syntax-highlighted code, wears the shared
TyPhed brand, and exports to static HTML for GitHub Pages. Analytics and ad slots are
wired in and switch on the moment you supply their ids.

## 🧠 Overview

  * **Framework** - Next.js 15 (App Router, React 19) with `output: "export"`, so the
    whole site ships as static files with no server at runtime.
  * **Content** - posts are `.mdx` files in [apps/web/content/blog/](apps/web/content/blog/).
    Frontmatter drives the title, description, date, tags, and access tier; the body is
    Markdown plus optional JSX, LaTeX, and fenced code.
  * **Brand** - the header, footer, colour tokens, type scale, and artwork come from two
    shared submodules, so a brand change lands here on the next build with no edit in this
    repository.
  * **Growth** - analytics (GA4, Microsoft Clarity), monetization (Google AdSense), and
    Google Search Console verification are all present and env-driven.

## 🚀 Getting Started

Requires Node 20 or newer and [pnpm](https://pnpm.io) (the version is pinned in
`package.json`).

Clone **with the submodules**. The workspace contains packages that live inside `shared/`,
so an install against an empty `shared/` fails before it can repair itself:

```shell
$ git clone --recurse-submodules https://github.com/typhed/blog.typhed.com.git
$ cd blog.typhed.com
$ corepack enable
$ pnpm install
$ pnpm dev
```

Already cloned without them? Run this once, then install:

```shell
$ git submodule update --init --recursive
```

Open [http://localhost:3000](http://localhost:3000). Posts render immediately; analytics
stay off locally until you add ids.

| Command | What It Does |
| :---: | --- |
| `pnpm dev` | Run the site locally with hot reload. |
| `pnpm build` | Produce the static export into `apps/web/out/`. |
| `pnpm lint` | ESLint across the app. |
| `pnpm typecheck` | `tsc --noEmit` across the workspace, shared packages included. |
| `pnpm format` | Prettier write. |
| `pnpm shared:update` | Pull the latest shared brand and components, then reinstall. |
| `pnpm shared:status` | Show uncommitted or unpushed work inside either submodule. |

## 🧩 The Shared Brand Layer

Two public repositories are mounted as git submodules and joined to this pnpm workspace,
so `@typhed/ui` and `@typhed/brand` import exactly as local packages would.

| Path | Repository | Provides |
| :---: | :---: | --- |
| `shared/documents` | [typhed/shared.documents](https://github.com/typhed/shared.documents) | `@typhed/brand` - site copy, navigation, footer links, colour and type tokens, brand artwork |
| `shared/components` | [typhed/shared.components](https://github.com/typhed/shared.components) | `@typhed/ui`, `@typhed/tailwind-config`, `@typhed/tsconfig` |

Two paths in this repository are **generated** before every dev run and every build by
`shared/documents/scripts/sync-shared.mjs`, and both are gitignored:

  * `apps/web/public/brand/` - copied from `shared/documents/assets/brand/`.
  * `apps/web/app/theme.css` - written from `shared/documents/brand/tokens/colors.json`.

Editing either by hand is silently overwritten on the next build. Change the source in the
submodule instead.

A submodule pins a commit and does not follow a branch on its own. Propagation comes from
`branch = master` in [.gitmodules](.gitmodules), the `--remote` step in CI that floats both
submodules to their branch tip on every release build, and a Dependabot job that keeps the
recorded pointer current. Locally, run `pnpm shared:update` when shared code looks stale.

**A change under `shared/` reaches every TyPhed property, not just this one.** It has to be
committed and pushed inside the submodule itself. If a change is only right for the blog,
it belongs in `apps/web/`.

## ✍️ Writing Posts

Add a file such as `apps/web/content/blog/my-post.mdx`:

```mdx
---
title: "My Post"
description: "One sentence for search results and social cards."
date: "2026-07-11"
tags: ["engineering"]
accessCategory: "public"
---

Inline math like $E = mc^2$ and display math both work:

$$
\int_0^\infty e^{-x}\,\mathrm{d}x = 1
$$
```

The file name becomes the URL slug (`/blog/my-post/`). Set `draft: true` in the
frontmatter to keep a post out of production builds while you work on it. Set
`accessCategory: "freemium"` to gate the body behind sign-in. See the existing posts in
[apps/web/content/blog/](apps/web/content/blog/) for the full range of supported Markdown,
tables, diagrams, charts, and code.

## 📊 Analytics And Monetization

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in only what you use. Each
service renders nothing until its id is present.

| Service | Environment Variable |
| :---: | --- |
| Google Analytics 4 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Google AdSense | `NEXT_PUBLIC_ADSENSE_CLIENT_ID` |
| Microsoft Clarity | `NEXT_PUBLIC_CLARITY_PROJECT_ID` |
| Search Console | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |
| Clerk (freemium posts) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |

Place an ad slot anywhere with the `AdUnit` component:

```tsx
import { AdUnit } from "@/components/analytics/ad-unit"

<AdUnit slot="1234567890" />
```

Full account setup, DNS, and the custom-domain steps live in [setup.md](setup.md).

## 🎨 Theming

Both palettes live in
[shared/documents/brand/tokens/colors.json](shared/documents/brand/tokens/colors.json) -
light ("Aurora Glass") and dark ("Midnight Indigo", the default). The sync script turns
them into `apps/web/app/theme.css`, and the shared Tailwind preset maps each token to a
utility, so components use classes like `bg-brand` and never raw hex. Change a colour once
in the JSON and every TyPhed property picks it up.

[apps/web/app/globals.css](apps/web/app/globals.css) keeps only what is blog-specific:
the `--chart-1` to `--chart-4` series tokens and the KaTeX and code-block styling. The reader's
text-size control belongs to the shared layer: `SiteHeader` mounts it, and the preset scopes it
to `main` so the chrome never resizes.

## 🗂️ Project Structure

```text
apps/web/
  app/            Routes: layout, home index, blog/[slug], sitemap, robots, manifest, OG
  components/     Blog-only components: MDX map, charts, TOC, access panel, analytics
  content/blog/   Your posts, one .mdx file each
  lib/            SITE constants, the build-time post loader, remark/rehype plugins
  public/         CNAME, ads.txt, .nojekyll (brand/ is generated)
shared/
  documents/      Submodule: the @typhed/brand contract, tokens, artwork, brand docs
  components/     Submodule: @typhed/ui and the shared Tailwind / TypeScript configs
```

## 🚢 Deployment

Publishing a GitHub Release builds the static export and deploys it to GitHub Pages via
[.github/workflows/deploy.yml](.github/workflows/deploy.yml). The workflow checks out both
submodules, floats them to their branch tip, and installs with `--no-frozen-lockfile` -
floating the shared layer can introduce a dependency this lockfile has never seen, and a
frozen install fails on exactly that. The custom domain is declared in
[apps/web/public/CNAME](apps/web/public/CNAME). Point a DNS `CNAME` record for `blog` at
your GitHub Pages host and set the analytics values as repository Variables. Step by step:
[setup.md](setup.md).

</div>
