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

## Environment

  * pnpm 11.9.0 (`packageManager`), Node 20.9 or newer (CI uses 22), Python 3.13 with Jinja2 for `permalink/`.
  * Windows checkouts use Git Bash; `.gitattributes` keeps LF in the repository.

## Decisions And Changes

  * 2026-11-17: one monorepo for all three properties; see `docs/adr/2026-11-17-monorepo-over-multiple-repositories.md`.

## Open Items

  * Owner questions: `.claude/docs/gaps.md`.
  * Going live on Cloudflare Workers: `.claude/docs/tasks/cloudflare-cutover.md`.
