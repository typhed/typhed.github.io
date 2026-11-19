<div align = "center">

# Owner Machine Checks

</div>

<div align = "justify">

Checks that a restricted development machine cannot run, kept for the owner's full machine. The owner's machine has run
the toolchain and gate checks, and the first runs on GitHub wait for the push in the
[go-live checklist](cloudflare-cutover.md).

## 1. Toolchain

  - [x] Install Node.js 26 LTS system-wide. The repository pins 26.13.1, the LTS release "Lithium" of 2026-11-10, while
    Node.js 27 is still an alpha. It ships npm 11.20.0, and `npm install --global npm@latest` brings npm to its newest
    release. With nvm-windows, `nvm install 26.13.1` then `nvm use 26.13.1` installs and activates it.
  - [x] Install pnpm with `npm install --global --allow-scripts=pnpm pnpm`, since Node.js 26 ships no Corepack. npm 12
    blocks install scripts unless a package is allowed, and without the flag pnpm runs through Node.js instead of its
    native binary. If `pnpm --version` still prints an old version, a Corepack shim from an older Node.js comes first on
    the `PATH`: run `corepack disable`.
  - [x] In the repository, `pnpm --version` prints 12.21.0 and `pnpm exec node --version` prints v26.13.1.

## 2. Gates On Node.js 26

  - [x] `pnpm install --frozen-lockfile && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
    Every gate passed fresh on 2026-11-17, with `TURBO_FORCE=true` so that no result came from the cache, and with no
    warnings, and the lockfile passes pnpm's supply-chain check. On the current code the gates cover lint and typecheck
    in 10 packages, 130 tests, and 3 static exports.
  - [x] Open each site's production preview (`pnpm --filter <app> preview`) in both themes and at phone width. Headless
    Chrome loaded every route and each site's 404 page at 1366 px and 390 px in both themes, 40 views in all. Each had
    the right status, theme, header, and footer, with no console errors and no horizontal scroll. The theme toggle and
    the trading sidebar keep their state across a reload, `/permalink/conduct.html` answers 302, and `/ads.txt` and the
    OG images serve with the right content types.

## 3. First Runs On GitHub

The workflows' actions exist at their pinned tags (`actions/checkout@v7`, `actions/setup-python@v7`, `pnpm/setup@v3`),
and `wrangler deploy --dry-run` passes for all three apps with their routes.

  - [ ] The first CI run sets up pnpm 12.21.0 and Node.js 26.13.1 through `pnpm/setup@v3` and passes every gate.
  - [ ] Dependabot's next monthly run opens its npm pull request against the pnpm 12 lockfile.

## 4. Dependency Advisories

pnpm installs a release only once it is a day old, so each update waits for its release to age.

  - [x] typescript-eslint, which `eslint-config-next` brings in, is at 8.73.0. Its parser uses minimatch 11, which
    clears the moderate GHSA-g3hv-75wg-m249 against minimatch 10.2.6.
  - [ ] `pnpm audit` reports the high-severity GHSA-fc5q-39xc-vjpf, a ReDoS in picomatch up to 4.0.7, which the lint
    tooling pulls in through `eslint-config-next`. Nothing that ships uses it, and no fixed release exists yet (checked
    2026-11-19). Update once one is out. `pnpm outdated` should still list only the TypeScript and KaTeX holds, and
    `pnpm audit` only this and the KaTeX advisory in [architecture.md](../../../docs/architecture.md).

## 5. Checks For The Synced Ponytail Fixes

A restricted Windows machine ran every gate, the Python checks, a comparison of the three exports against `dbdce92`,
and 80 headless Edge views of both trees on 2026-11-19, all passing. These checks need Linux, a Clerk key, or other
browsers:

  - [ ] Build the three apps on Linux (CI, or WSL with `libatomic1`) and compare the exports with a Linux build of
    `dbdce92`. A Windows build writes nested prefetch files, so the Windows comparison left the RSC payloads out.
  - [ ] Build with the Clerk development key in `.env.local`: sign in, open the members-only IPO and budgeting pages
    and the Pro tools, and time finding 16's Monte Carlo: typing `20000` into Paths runs once, after the inputs settle.
  - [ ] Check the three sites in Safari, Firefox, and on a real phone.
  - [ ] Trigger the trading crash page (finding 14) in a local build and compare its colours with the dark theme.
  - [ ] On Linux or macOS, once the harness links are committed with `apps/trading/.agents/skills/verify/`,
    `ls -l .claude/ apps/trading/.claude/` shows the three symlinks into `.agents/`, and Claude Code lists the
    `keeper` agent and the trading `verify` skill.
  - [ ] Move `wrangler` to 4.165.0 once that release is a day old (after 2026-11-19 21:44 UTC): set `^4.165.0` in the
    root `package.json`, run `pnpm install`, then the gates and `pnpm --filter <app> exec wrangler deploy --dry-run`
    for each app. Like 4.164.0, it depends on the miniflare 5 beta.

## Known Local-Only Issue

On Windows, `next build` 16.4.6 writes the prefetch file of a nested route into folders
(`__next.tools/ipo/__PAGE__.txt`) instead of the dot-joined name the browser requests (`__next.tools.ipo.__PAGE__.txt`).
A local preview then logs 404s for those prefetches, and navigation falls back to the page's full payload. A Linux build
of trading (WSL Ubuntu 24.04, 2026-11-17) writes the dot-joined names, so CI and the deploy, which build on Linux, serve
the right files. The owner's machine shows the issue with 16.4.6, the newest release on 2026-11-19. Recheck after the
next Next.js release.

## Environment Notes

  * The owner's machine has no Python on its `PATH`, only the Microsoft Store alias. The web build's redirect step needs
    Python 3.13 with Jinja2, so create a virtual environment at the repository root (`.venv`, which git ignores),
    install `permalink/requirements.txt` into it, and activate it before `pnpm build`. The keeper Stop hook
    (`python .agents/hooks/keeper-stop-hook.py`) cannot start until Python is on the `PATH`, and the session then ends
    as usual.
  * Node.js 22.20.0 stays installed under nvm, and `nvm use 22.20.0` switches back to it.
  * The WSL distribution Ubuntu 24.04 lacks `libatomic1`, which the official Node.js 26 Linux build needs. Install it
    with `sudo apt install libatomic1` before building there.

</div>
