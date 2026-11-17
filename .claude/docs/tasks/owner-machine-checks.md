<div align = "center">

# Owner Machine Checks

</div>

<div align = "justify">

Checks that the restricted development machine could not run, kept for the owner's full machine. The owner's machine ran
the toolchain and gate checks on 2026-11-17. The wrangler update follows on 2026-11-18, and the first runs on GitHub
wait for the push in the [go-live checklist](cloudflare-cutover.md).

## 1. Toolchain

  - [x] Install Node.js 26 LTS system-wide. The repository pins 26.13.1, the newest LTS release ("Lithium",
    2026-11-10), while Node.js 27 is still an alpha. It ships npm 11.20.0, and `npm install --global npm@latest` moves
    npm to its newest release, 12.2.2. With nvm-windows, `nvm install 26.13.1` then `nvm use 26.13.1` installs and
    activates it.
  - [x] Install pnpm with `npm install --global --allow-scripts=pnpm pnpm`, since Node.js 26 ships no Corepack. npm 12
    blocks install scripts unless a package is allowed, and without the flag pnpm runs through Node.js instead of its
    native binary. If `pnpm --version` still prints an old version, a Corepack shim from an older Node.js comes first on
    the `PATH`: run `corepack disable`.
  - [x] In the repository, `pnpm --version` prints 12.21.0 and `pnpm exec node --version` prints v26.13.1.

## 2. Gates On Node.js 26

  - [x] `pnpm install --frozen-lockfile && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
    Every gate ran fresh, with `TURBO_FORCE=true` so that no result came from the cache: format, lint 3/3, typecheck
    10/10, 116 tests, and builds 3/3, with no warnings. The lockfile passes pnpm's supply-chain check.
  - [x] Open each site's production preview (`pnpm --filter <app> preview`) in both themes and at phone width. Headless
    Chrome loaded every route and each site's 404 page at 1366 px and 390 px in both themes, 40 views in all. Each had
    the right status, theme, header, and footer, with no console errors and no horizontal scroll. The theme toggle and
    the trading sidebar keep their state across a reload, `/permalink/conduct.html` answers 302, and `/ads.txt` and the
    OG images serve with the right content types.

## 3. First Runs On GitHub

The workflows' actions exist at their pinned tags (`actions/checkout@v7`, `actions/setup-python@v7`, `pnpm/setup@v3`),
and `wrangler deploy --dry-run` passes for all three apps, with and without the routes on `cutover/routes`.

  - [ ] The first CI run sets up pnpm 12.21.0 and Node.js 26.13.1 through `pnpm/setup@v3` and passes every gate.
  - [ ] Dependabot's next monthly run opens its npm pull request against the pnpm 12 lockfile.

## 4. Dependency Updates

pnpm installs a release only once it is a day old, so each update below waits for its release to age.

  - [x] `pnpm update typescript-eslint "@typescript-eslint/*"` moved typescript-eslint, which `eslint-config-next`
    brings in, from 8.72.2 to 8.73.0 on 2026-11-17. Its parser now uses minimatch 11, which clears the moderate
    GHSA-g3hv-75wg-m249 against minimatch 10.2.6. The root `package.json` is unchanged, and every gate passes again.
  - [ ] From 11:15 UTC (16:45 IST) on 2026-11-18, when wrangler 4.164.0 is a day old, `pnpm update wrangler` moves it
    from 4.163.0 and writes the new range into the root `package.json`. Then rerun every gate and the preview check
    from step 2.
  - [ ] `pnpm audit` also reports the high-severity GHSA-fc5q-39xc-vjpf, a ReDoS in picomatch up to 4.0.7, which the
    lint tooling pulls in through `eslint-config-next`. Nothing that ships uses it, and no fixed release exists yet
    (checked 2026-11-17). Update once one is out. `pnpm outdated` should still list only the TypeScript and KaTeX holds,
    and `pnpm audit` only this and the KaTeX advisory in [architecture.md](../../../docs/architecture.md).

## Known Local-Only Issue

On Windows, `next build` 16.4.6 writes the prefetch file of a nested route into folders
(`__next.tools/ipo/__PAGE__.txt`) instead of the dot-joined name the browser requests (`__next.tools.ipo.__PAGE__.txt`).
A local preview then logs 404s for those prefetches, and navigation falls back to the page's full payload. A Linux build
of trading (WSL Ubuntu 24.04, 2026-11-17) writes the dot-joined names, so CI and the deploy, which build on Linux, serve
the right files. The owner's machine still shows the issue on 2026-11-17, with 16.4.6 the newest release. Recheck after
the next Next.js release.

## Environment Notes

  * The owner's machine has no Python on its `PATH`, only the Microsoft Store alias. The web build's redirect step needs
    Python 3.13 with Jinja2, so a gitignored `.venv` at the repository root (the uv-managed CPython 3.13.14 with
    `jinja2==3.1.6`) serves it: activate it before `pnpm build`. The keeper Stop hook
    (`python .claude/hooks/keeper-stop-hook.py`) cannot run until Python is on the `PATH`. It fails open, so sessions
    still end normally.
  * Node.js 22.20.0 stays installed under nvm, and `nvm use 22.20.0` switches back to it.
  * The WSL distribution Ubuntu 24.04 lacks `libatomic1`, which the official Node.js 26 Linux build needs. Install it
    with `sudo apt install libatomic1` before building there.

</div>
