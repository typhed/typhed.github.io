<div align = "center">

# TyPhed Blog

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=plastic&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-20232A?style=plastic&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=plastic&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=plastic&logo=tailwindcss)](https://tailwindcss.com)
[![MDX](https://img.shields.io/badge/MDX-%20+%20LaTeX-1B1F24?style=plastic&logo=mdx)](https://mdxjs.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-%20Workers-F38020?style=plastic&logo=cloudflareworkers)](https://workers.cloudflare.com)

</div>

<div align = "justify">

The blog of [typhed.com](https://typhed.com), served at `blog.typhed.com`. Product notes, engineering write-ups, and
example documentation land here as MDX posts with LaTeX math, diagrams, charts, and highlighted code, all wearing the
shared TyPhed brand. Analytics and ad slots are wired in and switch on the moment their ids are set.

## 🧠 Overview

  * **Framework** - Next.js 16 (App Router, React 19), exported to static files and served by the `typhed-blogging`
    Cloudflare Worker.
  * **Content** - posts are `.mdx` files in [content/blog/](content/blog/). Frontmatter drives the title, description,
    date, tags, and access tier; the body is Markdown plus optional JSX, LaTeX, and fenced code.
  * **Brand** - the header, footer, colour tokens, type scale, artwork, and sign-in come from the shared packages in
    `packages/`, so a brand change lands here on the next build.
  * **Growth** - analytics (GA4, Microsoft Clarity), monetisation (Google AdSense), and Google Search Console
    verification are present and driven by environment variables.

## 🚀 Getting Started

From the repository root:

```shell
$ pnpm install
$ pnpm --filter blogging dev
```

The blog runs at `http://localhost:3002`. `pnpm build` writes the static export to `apps/blogging/out/`, and
`pnpm --filter blogging preview` serves it at `http://localhost:8789` exactly as Cloudflare does.

## ✍️ Writing Posts

Add a file such as `content/blog/my-post.mdx`:

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

The file name becomes the URL slug (`/blog/my-post/`). Set `draft: true` in the frontmatter to keep a post out of
production builds while you work on it. Set `accessCategory: "freemium"` to show the body only to signed-in readers.
Posts support GitHub-flavoured Markdown, tables, LaTeX math, Mermaid diagrams, charts, and highlighted code.

## 📊 Analytics And Monetisation

Set the values you use in `.env.local` at the repository root. Each service renders nothing until its id is present.

<div align = "center">

| Service | Environment Variable |
| :---: | --- |
| Google Analytics 4 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Google AdSense | `NEXT_PUBLIC_ADSENSE_CLIENT_ID` |
| Microsoft Clarity | `NEXT_PUBLIC_CLARITY_PROJECT_ID` |
| Search Console | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |
| Clerk (freemium posts) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |

</div>

Place an ad slot in a page or component with the `AdUnit` component; MDX posts do not register it.

```tsx
import { AdUnit } from "@/components/analytics/ad-unit"

<AdUnit slot="1234567890" />
```

`public/ads.txt` is served at `blog.typhed.com/ads.txt`.

## 🎨 Theming

Both palettes live in [colors.json](../../packages/brand/tokens/colors.json): light ("Aurora Glass") and dark
("Midnight Indigo", the default). `typhed-brand-sync` writes them into `app/theme.css` before every dev run and build,
and the shared Tailwind preset maps each token to a utility, so components use classes like `bg-brand` and never raw
hex.

[app/globals.css](app/globals.css) keeps only what is blog-specific: the `--chart-1` to `--chart-4` series tokens and
the KaTeX and code-block styling. The reader's text-size control belongs to the shared header.

## 🗂️ Project Structure

```text
apps/blogging/
  app/            routes: home, blog/[slug], metadata files, not-found
  components/     post rendering, gates, analytics, charts, diagrams
  content/blog/   the MDX posts
  lib/            post loading, constants, remark and rehype plugins
  public/         ads.txt (brand/ is generated)
  tests/          Vitest checks of the post loader (pnpm --filter blogging test)
  wrangler.jsonc  the typhed-blogging Worker
```

## 🚢 Deployment

A push to `master` that touches the blog or a shared package deploys it to the `typhed-blogging` Worker. The
[deployment pipeline](../../docs/architecture.md#deployment-pipeline) covers the details.

</div>
