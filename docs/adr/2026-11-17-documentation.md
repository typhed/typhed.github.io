<div align = "center">

# ADR 2026-11-17: Documentation Rules

</div>

<div align = "justify">

<div align = "center">

| Status | Date | Scope |
| :---: | :---: | :---: |
| Accepted | 2026-11-17 | Docs and Claude context |

</div>

## Context

The merged repositories brought migration-era docs that described submodules, GitHub Pages, and features that do not
exist. The owner wants documentation of what exists, each decision recorded once, and Claude context that travels with
every clone.

## Decision

  * `README.md`, `docs/`, and `CLAUDE.md` describe the repository as it is, in present tense, with no migration story.
  * Architecture decisions live only in `docs/adr/`, one dated record per decision.
  * Nothing is invented: no new logos, icons, artwork, or copy. Missing values are recorded in `.claude/docs/gaps.md`
    and raised with the owner.
  * Architecture, product, and design live only in `docs/`. Claude harness material lives in the repository and never
    copies a `docs/` page: `CLAUDE.md` routes into `docs/`, `.claude/MEMORY.md` holds the project memory, and
    `.claude/docs/` holds open questions, tasks, and past plans. Nothing goes under `~/.claude/`.

## Consequences

  * A doc that disagrees with the code is fixed, not annotated.
  * The reasoning behind a design is found in one place, by date.

</div>
