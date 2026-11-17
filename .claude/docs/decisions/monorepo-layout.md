<div align = "center">

# Monorepo Layout

</div>

<div align = "justify">

Where each part of the TyPhed web estate lives. Read this before adding an app, a package, or a top-level folder.

## Decisions

  * 2026-11-17: one pnpm + Turborepo monorepo serves all three sites: `apps/web` (typhed.com), `apps/trading`
    (trading.typhed.com), `apps/blogging` (blog.typhed.com), because the shell, brand, auth, and configs had drifted
    into two or three copies across separate repositories.
  * 2026-11-17: the former `shared.documents` and `shared.components` submodules are flattened into `packages/brand`,
    `packages/ui`, `packages/config-tailwind`, and `packages/config-typescript`, with their docs under `docs/`, because
    a standard `apps/*` + `packages/*` layout needs no submodule tooling and builds reproducibly from one lockfile.
  * 2026-11-17: app package names equal their folder names (`web`, `trading`, `blogging`), so the deploy workflow can
    map a folder to a Worker without a lookup table.
  * 2026-11-17: one pnpm catalog pins every shared dependency version, because the apps had drifted (three Clerk
    versions, two `next-themes` ranges).

</div>
