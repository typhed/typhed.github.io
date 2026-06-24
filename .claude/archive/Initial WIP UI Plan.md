<div align = "center">

# TyPhed Website Plan

</div>

<div align = "justify">

This document is the build plan and architecture record for the TyPhed website. It explains what was built, why each decision was made, and how to extend the project to product subdomains later. The website is the brand homepage of Debmalya Pramanik HUF, served from GitHub Pages on the Cloudflare domain `typhed.com`.

## Context

The brand needed a public holding page before its real launch. The goal of this phase is a production ready, search friendly, modern and fluid "work in progress" landing page with a live countdown to the launch moment of `01 April 2027, 00:00 IST`. The page is built with Next.js and TypeScript, styled with shadcn/ui and Tailwind CSS, packaged with pnpm, and structured as a monorepo so product sites can be added without rework.

## Locked Decisions

  * Ship the main site at `typhed.com` now. Build the monorepo and shared UI so a products app can drop in later, but do not deploy products yet.
  * Default theme is dark (Midnight Indigo with a cyan accent). The alternate is light (Aurora Glass with an indigo accent). A toggle button switches between them.
  * The page shows branding, the countdown, and quiet contact links only. No email form and no third party services, so the whole site is static.
  * The countdown target is `2027-03-31T18:30:00Z`, which is `01 April 2027, 00:00` in India Standard Time.
  * No em dashes anywhere. Only the hyphen character is used in code, docs, and commit messages.

## Key Constraint

A host like `products.typhed.github.io` is not possible on GitHub Pages, because the `*.github.io` name is reserved for account names only. The real product subdomain is `products.typhed.com`, which on GitHub Pages needs a second repository with its own `CNAME` file. Creating a subdomain is not a purchase or a registration step. It is a single DNS record in the Cloudflare zone. Both points are explained in [setup.md](setup.md).

---

## Technology Choices

  * **pnpm workspaces with Turborepo** for the monorepo and its task running.
  * **Next.js 15 with the App Router, React 19, and TypeScript 5**, exported as fully static HTML so GitHub Pages can serve it with no server.
  * **Tailwind CSS 3.4 with a shared preset** plus **shadcn/ui** primitives and **lucide-react** icons.
  * **next-themes** for the dark and light switch, and **Framer Motion** for fluid, motion safe animation.
  * **Space Grotesk** for display text and **Inter** for body text, self hosted at build time through `next/font`.

The static export is configured in [apps/web/next.config.mjs](../apps/web/next.config.mjs) with `output: "export"`, `trailingSlash: true`, and unoptimized images.

## Repository Layout

```text
apps/
  web/                         the deployed site -> typhed.com
    app/
      layout.tsx               fonts, metadata, JSON-LD, theme provider
      page.tsx                 renders <WipLanding/>
      globals.css              Tailwind plus the light and dark palettes
      robots.ts                emits robots.txt
      sitemap.ts               emits sitemap.xml
      opengraph-image.tsx      build time social share image
      icon.tsx                 build time favicon
      manifest.ts              web manifest
    public/CNAME               typhed.com
    public/.nojekyll           lets GitHub serve the _next folder
packages/
  ui/                          @typhed/ui, the reusable surface
    components/                countdown, background, theme toggle, footer, landing
    components/ui/             shadcn button and card
    lib/constants.ts           brand text, launch date, links, copyright
    lib/utils.ts               the cn() class helper
  config-tailwind/             shared design tokens and the Tailwind preset
  config-typescript/           shared tsconfig bases
.github/workflows/deploy.yml   build apps/web and publish to GitHub Pages
```

Adding a product site later means creating `apps/products` that imports `WipLanding` (or a real product page) from `@typhed/ui`, then deploying it to a second repository. The exact steps are in [setup.md](setup.md).

## Implementation Notes

  * **Countdown.** The target is a single constant in [packages/ui/lib/constants.ts](../packages/ui/lib/constants.ts). The component renders zeros on the server and during the first client render so the markup matches, then fills in real values after mount and ticks every second. When the date passes it shows a launch message instead.
  * **Theme.** The root element carries `suppressHydrationWarning`, and next-themes is set to default dark with system support. The two palettes are CSS variables in `globals.css`, and every shadcn token maps to them, so both themes stay consistent.
  * **Background.** A soft brand glow, a faint masked grid, and three drifting blurred orbs. It is pure CSS animation and is disabled automatically for visitors who prefer reduced motion.
  * **Copyright.** The footer renders the exact two ownership lines, and the legal entity name is real text rather than an image so it helps search relevance.

## Search Visibility

The aim is modest and specific. A person searching for "Debmalya Pramanik HUF" should find this site. That is achieved with on page relevance and structured data rather than heavy optimization.

  * Page metadata names both TyPhed and Debmalya Pramanik HUF, sets a canonical URL, and provides Open Graph and Twitter cards using the generated share image.
  * A JSON-LD `Organization` block declares the legal name, and a `WebSite` block links to it.
  * `robots.txt` and `sitemap.xml` are generated at build, and the footer repeats the legal entity name as visible text.

After the domain is live, submit `typhed.com` and its sitemap to Google Search Console. That step is in [setup.md](setup.md).

## Deployment

The workflow at [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) runs on every push to `master`. It installs with pnpm, builds the static export, and publishes `apps/web/out` to GitHub Pages. The `CNAME` file pins the custom domain and `.nojekyll` makes GitHub serve the build untouched.

## Verification

The following all pass on this build.

  * `pnpm install` completes cleanly.
  * `pnpm build` produces `apps/web/out` containing `index.html`, `_next`, `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml`, the manifest, the favicon, and the share image.
  * `pnpm typecheck` and `pnpm lint` report no errors.
  * The home page HTML contains the JSON-LD, the canonical link, the Open Graph image, and the visible "Debmalya Pramanik HUF" text.

## Open Items For Later

  * Add `apps/products` and a second repository deploy for `products.typhed.com`.
  * Build real product subpages, add analytics, and submit the sitemap to Search Console.

</div>
