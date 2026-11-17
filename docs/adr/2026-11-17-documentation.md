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
  * Claude context lives in the repository: `.claude/MEMORY.md`, the routed documents in `.claude/docs/`, plans and
    progress in `.claude/docs/tasks/`, and past plans in `.claude/docs/archive/`. Nothing goes under `~/.claude/`.

## Consequences

  * A doc that disagrees with the code is fixed, not annotated.
  * The reasoning behind a design is found in one place, by date.

</div>
