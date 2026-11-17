<div align = "center">

# ADR 2026-11-17: Monorepo Over Multiple Repositories

</div>

<div align = "justify">

<div align = "center">

| Status | Date | Scope |
| :---: | :---: | :---: |
| Accepted | 2026-11-17 | Repository structure |

</div>

## Context

The TyPhed web estate is three properties that share one brand: the brand hub at `typhed.com` and the product
subdomains `blog.typhed.com` and `trading.typhed.com`. They render the same header, footer, colour and type system, and
sign-in, and they build with the same Next.js, Tailwind, and TypeScript configuration. Two layouts fit that shape: one
repository per property, with the brand code shared across repositories, or one monorepo that holds every property and
the shared code together.

## Decision

TyPhed uses one pnpm + Turborepo monorepo:

  * `apps/web`, `apps/trading`, and `apps/blogging` build the three properties.
  * `packages/` holds the shared brand contract, page shell, sign-in, and configuration, consumed from source.
  * One pnpm catalog pins every dependency that more than one package uses.
  * Each app still deploys on its own, as a separate Cloudflare Worker.

## Consequences

  * A change to the brand, the shell, or the configuration is one commit that every property picks up on its next build.
  * One lockfile and one catalog keep every property on the same versions, and one upgrade moves them together.
  * One workflow checks every change and deploys only the apps it affects; a new subdomain is a new folder under `apps/`.
  * The properties stay independent at runtime: one site can deploy or roll back without touching the others.
  * Every change runs the gates for the packages it touches, so a shared change is checked against all three sites.

</div>
