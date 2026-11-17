# Project Memory

Durable memory for every session in this repository, kept in git so that it survives a new machine, account, or
checkout path. `CLAUDE.md` imports it, so it loads on every request: keep it short and put the detail in `.claude/docs/`.

## Owner Preferences

  * Keep all Claude context in this repository: memory here, plans and progress in `.claude/docs/tasks/`, old plans in
    `.claude/docs/archive/`. Never write any of it under `~/.claude/`.
  * Architecture decisions go to `docs/adr/` as dated records (`YYYY-MM-DD-<slug>.md`: Status, Context, Decision,
    Consequences), listed in `docs/adr/README.md`.
  * Never squash, rebase, amend, or rewrite history; imported commits keep their SHA, message, author, and date.
  * Never invent logos, icons, artwork, or copy. Take values from `packages/brand` and existing app strings; record
    anything missing in `.claude/docs/gaps.md` and ask.
  * Docs describe the repository as it is, in present tense. Rationale goes only to `docs/adr/`.
  * Every Markdown edit applies `markdown-format`, `humanize-text`, and `flaunt-product` (the last only to
    product-facing prose, never to commands, config, or the technical reference).
  * Do not tune the code or config to one machine; fix the environment instead or record a TODO for the owner.
  * Tokens are costly: no speculative research or agent fan-out; use known facts and verify locally.
  * Commits follow the `git-commiter` skill; Markdown follows `markdown-format` and `humanize-text`.

## Environment

  * pnpm 11.9.0 (`packageManager`), Node 20.9 or newer (CI uses 22), Python 3.13 with Jinja2 for `permalink/`.
  * Windows checkouts use Git Bash; `.gitattributes` forces LF in the repository.

## Decisions And Changes

  * 2026-11-17: five repositories merged into this monorepo with full history; see
    `.claude/docs/tasks/monorepo-merge.md` and `docs/adr/`.

## Open Items

  * Pending phases and the tests this machine could not run are listed in `.claude/docs/tasks/monorepo-merge.md`.
  * The Cloudflare cutover is the owner's checklist in `.claude/docs/tasks/cloudflare-cutover.md`.
