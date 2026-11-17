<div align = "center">

# ADR 2026-11-17: Monorepo Layout

</div>

<div align = "justify">

<div align = "center">

| Status | Date | Scope |
| :---: | :---: | :---: |
| Accepted | 2026-11-17 | Repository structure |

</div>

## Context

Three live sites and two shared libraries sat in five repositories. The header, footer, theme, Clerk wiring, and the
Tailwind and TypeScript configs existed in two or three diverging copies. Trading forked the shared config packages under
the same package names, and the blog pinned an older brand contract it no longer compiled against. The shared code
reached each site through git submodules that CI floated to their branch tips, so no commit built reproducibly.

## Decision

  * One pnpm + Turborepo monorepo builds all three sites: `apps/web` (typhed.com), `apps/trading`
    (trading.typhed.com), and `apps/blogging` (blog.typhed.com).
  * The shared code is flattened into `packages/brand`, `packages/ui`, `packages/config-tailwind`, and
    `packages/config-typescript`; its documentation moves under `docs/`.
  * App package names equal their folder names (`web`, `trading`, `blogging`).
  * One pnpm catalog pins every dependency that more than one package uses.

## Consequences

  * One lockfile builds every site reproducibly, and CI installs with `--frozen-lockfile`.
  * A brand, shell, or config change is one commit that every property picks up on its next build.
  * The deploy workflow maps a folder to a Worker without a lookup table.
  * A dependency upgrade moves every app at once through the catalog.

</div>
