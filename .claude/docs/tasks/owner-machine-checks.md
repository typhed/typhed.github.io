<div align = "center">

# Owner Machine Checks

</div>

<div align = "justify">

Checks that the restricted development machine could not run, kept for the owner's full machine. They cover the
toolchain the repository pins and its first runs on GitHub.

## 1. Toolchain

  - [ ] Install Node.js 26 LTS system-wide; the repository pins 26.13.1. It ships npm 11.20.0, and
    `npm install --global npm@latest` moves npm to its newest release (12.2.2 when this list was written).
  - [ ] Install pnpm with `npm install --global pnpm`, since Node.js 26 ships no Corepack. If `pnpm --version` still
    prints an old version, a Corepack shim from an older Node.js comes first on the `PATH`: run `corepack disable`.
  - [ ] In the repository, `pnpm --version` prints 12.21.0 and `pnpm exec node --version` prints v26.13.1.

## 2. Gates On Node.js 26

  - [ ] `pnpm install --frozen-lockfile && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
  - [ ] Open each site's production preview (`pnpm --filter <app> preview`) in both themes and at phone width.

## 3. First Runs On GitHub

  - [ ] The first CI run sets up pnpm 12.21.0 and Node.js 26.13.1 through `pnpm/setup@v3` and passes every gate.
  - [ ] Dependabot's next monthly run opens its npm pull request against the pnpm 12 lockfile.

## Known Local-Only Issue

On Windows, `next build` 16.4.6 writes the prefetch file of a nested route into folders
(`__next.tools/ipo/__PAGE__.txt`) instead of the dot-joined name the browser requests (`__next.tools.ipo.__PAGE__.txt`).
A local preview then logs 404s for those prefetches, and navigation falls back to the page's full payload. The exporter
builds the name from a Windows path, so Linux builds, which CI and the deploy use, write the right names. Recheck after
the next Next.js release.

</div>
