# Project Memory

Durable memory for every session in this repository, kept in git so that it survives a new machine, account, or
checkout path. `CLAUDE.md` imports it, so it loads on every request: keep it short and put the detail in `docs/`.

## Owner Preferences

  * `README.md` and `docs/README.md` are the owner's authoritative pages: align every other document with them and keep
    their voice. Why: the owner writes them as the source of truth for the brand and for the docs.
  * Docs read as if written fresh for the code as it stands, with no "moved from", "previously", or "since" history and
    no commit or branch references. Why: the repository starts from a single initial commit.
  * Leave the owner's blank sections blank (Brand Story, Voice Attributes, and Application Rules in
    `docs/brand/README.md`) and record the gap instead. Why: the owner writes brand copy; rule 1 forbids inventing it.

## Environment

  * The links from `.claude/` into `.agents/` need Git's `core.symlinks` set to `true` and, on Windows, Developer Mode
    or an elevated shell; otherwise each checks out as a plain text file and Claude Code finds no `keeper` or `verify`.
  * The owner's machine has no Python on its `PATH`, only the Microsoft Store alias, so the keeper Stop hook cannot
    start there, and the web build's redirect step needs a Python 3.13 environment with `jinja2==3.1.6`.
  * pnpm downloads the pinned Node.js for the workspace scripts, but its install scripts run on the `node` already on
    the `PATH`, so a machine needs both.

## Decisions And Changes

  * 2026-11-18: The documentation describes the code as it stands, with no change history; see `docs/README.md`.
  * 2026-11-18: One vendor-neutral agent harness; see `docs/agents/decisions/2026-11-18.1.md`.
  * 2026-11-17: Font Awesome for every icon; see `docs/agents/decisions/2026-11-17.2.md`.
  * 2026-11-17: One pnpm and Turborepo monorepo; see `docs/agents/decisions/2026-11-17.1.md`.

## Open Items

  * Finding 17 of the 2026-11-18 ponytail audit, the trading sidebar marking "Workspace" current on the `?view=` tool
    links, waits on the owner's choice between those links and a route per tool; the other findings are resolved. See
    `docs/agents/tools/ponytail/2026-11-18.md`.
  * The missing legal pages and the brand questions wait on the owner; see `.claude/docs/gaps.md`.
  * The Cloudflare go-live and the first CI run on GitHub are pending; see `.claude/docs/tasks/`.
