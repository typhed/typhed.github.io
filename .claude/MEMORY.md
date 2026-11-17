# Project Memory

Durable memory for every session in this repository, kept in git so that it survives a new machine, account, or
checkout path. `CLAUDE.md` imports it, so it loads on every request: keep it short and put the detail in `docs/`.

## Owner Preferences

  * Keep all Claude context in this repository: this file, open questions in `.claude/docs/gaps.md`, tasks in
    `.claude/docs/tasks/`, past plans in `.claude/docs/archive/`. Never write any of it under `~/.claude/`.
  * `docs/` is the single source for architecture, product, design, and decisions; `.claude/` points into it and never
    copies a page. Architecture decisions are dated records in `docs/adr/`.
  * The sites are a work in progress: keep docs lean, factual, and in present tense, describing what exists.
  * Never invent logos, icons, artwork, or copy. Take values from `packages/brand` or existing strings, and record
    anything missing in `.claude/docs/gaps.md`.
  * Markdown follows `markdown-format` and `humanize-text`, with `flaunt-product` for product-facing prose only.
    Commits follow `git-commiter`.
  * Do not tune code or config to one machine; fix the environment or record a task for the owner instead.
  * Tokens are costly: no speculative research or agent fan-out; use known facts and verify locally.
  * Every dependency and its one version lives in the root `package.json`, with one `node_modules` at the root; apps
    and packages list only `@typhed/*` links. No exceptions.
  * Versions are the newest stable (LTS where one exists) that every other module supports; never an alpha, beta, or
    release candidate. Check compatibility before upgrading, and explain any version held back.
  * Font Awesome is the only icon source; lucide and hand-drawn icons are not used.

## Environment

  * pnpm 12.21.0 (`packageManager`) and Node.js 26.13.1 LTS (`devEngines.runtime`, downloaded by pnpm); Python 3.13 with
    Jinja2 for `permalink/`. Node 26 ships no Corepack, so pnpm is installed with `npm install --global pnpm`.
  * Windows checkouts use Git Bash; `.gitattributes` keeps LF in the repository.

## Decisions And Changes

  * 2026-11-17: one monorepo for all three properties; see `docs/adr/2026-11-17-monorepo-over-multiple-repositories.md`.
  * 2026-11-17: Font Awesome for every icon; see `docs/adr/2026-11-17-font-awesome-for-every-icon.md`.

## Open Items

  * Owner questions: `.claude/docs/gaps.md`.
  * Going live on Cloudflare Workers: `.claude/docs/tasks/cloudflare-cutover.md`.
  * The owner's machine checks (toolchain and gates passed 2026-11-17), the wrangler update due 2026-11-18, the
    picomatch advisory with no fix yet, the first GitHub runs still to watch, and the machine's environment notes:
    `.claude/docs/tasks/owner-machine-checks.md`.
