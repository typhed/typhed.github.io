<div align = "center">

# The Domain And Subdomain Model

</div>

<div align = "justify">

How the TyPhed web estate is laid out across domains, code, and hosting. [PRD.md](../PRD.md) says what belongs on each
property; this page says where each one lives and how they fit together.

## The Shape

```text
  https://typhed.com/            Brand, marketing, SEO, legal, informational hub      apps/web
  https://blog.typhed.com/       Blog, product notes, example documentation            apps/blogging
  https://trading.typhed.com/    The trading product: tools, indicators, strategies    apps/trading
```

The parent domain is the **brand and acquisition layer**; each subdomain is a purpose-built product. All three are apps
in one monorepo, and they share the brand rather than the product: the header, the footer, the colour and type systems,
the copy that names the company, and the sign-in. That shared layer lives in `packages/` (`@typhed/brand`, `@typhed/ui`,
`@typhed/auth`, and the config packages), so a brand change is one commit that every property picks up.

## A Subdomain Is A DNS Record

`typhed.com` is a Cloudflare zone. A subdomain is a record inside it: a record named `trading` creates
`trading.typhed.com`. There is nothing to register and nothing to buy.

## One Worker Per Property

Each app is a static export served by its own Cloudflare Worker, which serves the exported files as static assets and
runs no script:

<div align = "center">

| Property | App | Worker | Route |
| :---: | :---: | :---: | :---: |
| `typhed.com` | `apps/web` | `typhed-web` | `typhed.com/*` |
| `trading.typhed.com` | `apps/trading` | `typhed-trading` | `trading.typhed.com/*` |
| `blog.typhed.com` | `apps/blogging` | `typhed-blogging` | `blog.typhed.com/*` |

</div>

Each app's `wrangler.jsonc` names its Worker and its route, and keeps the Worker on its `workers.dev` address too,
`https://typhed-<app>.typhed-main.workers.dev`. The hostnames are proxied records in the Cloudflare zone, and
`www.typhed.com` answers a 301 to `https://typhed.com/` through a Cloudflare Redirect Rule.

## One Login Across Every Subdomain

One Clerk production instance serves every property: its Frontend API is `clerk.typhed.com` and its Account Portal is
`accounts.typhed.com`. Every app builds with the same publishable key, so a visitor who signs in on any `*.typhed.com`
property is recognised on all of them.

The publishable key is public and ships in the browser bundle, so it is a build-time value rather than a secret. The
Clerk **secret** key belongs nowhere in this repository and never takes a `NEXT_PUBLIC_` name.

## Adding A New Subdomain

  1. Add an entry to [properties.json](../../packages/brand/properties.json) with the property's URL, name, description,
     keywords, and, if it has its own menu, its sidebar groups. A footer link reaches it by id
     (`{ "label": "...", "property": "<name>" }` in `navigation.json`), so its URL is written only here.
  2. Create `apps/<name>` like the other apps: a layout that renders `SiteShell` and the auth providers, a
     `next.config.mjs` that exports `createNextConfig()`, a `tailwind.config.ts` that uses the shared preset and content
     globs, a `globals.css` that imports `@typhed/tailwind-config/base.css` and names that config with `@config`, a
     `postcss.config.mjs` that re-exports the shared one, and a `package.json` named `<name>` with `"type": "module"`,
     the `dev`, `build`, `lint`, and `preview` scripts, and only its `@typhed/*` packages as `workspace:*`. Any new
     third-party dependency goes in the root `package.json`.
  3. Add `apps/<name>/wrangler.jsonc` naming the Worker `typhed-<name>` and its route on the `typhed.com` zone. The
     deploy workflow picks the app up from that file; no workflow edit is needed.
  4. In Cloudflare, create a proxied DNS record for the hostname (an originless `AAAA 100::` record is enough).

The [architecture reference](../architecture.md) covers the build and deploy details behind each step.

</div>
