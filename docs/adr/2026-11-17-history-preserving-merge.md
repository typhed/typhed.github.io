<div align = "center">

# ADR 2026-11-17: History-Preserving Merge

</div>

<div align = "justify">

<div align = "center">

| Status | Date | Scope |
| :---: | :---: | :---: |
| Accepted | 2026-11-17 | Version control |

</div>

## Context

Joining five repositories could flatten or rewrite their histories. The owner requires every original commit to keep
its SHA, message, author, and date: no squash, no rebase, no amend, and no history rewriting. Where two repositories held
a file with the same role, the newest commit decides which variant is the base.

## Decision

  * Each source gets an import branch from its tip with one commit of pure `git mv` and `git rm`, then joins with
    `git merge --no-ff --allow-unrelated-histories`.
  * Trading is taken from `reviews/20260719` (`fc01566`), 15 commits ahead of `master` and 0 behind.
  * Sources are fetched with `--no-tags`, and the owner deletes the old tags and releases. The blog's Dependabot
    branches are not merged.
  * For files with the same role, the newest variant is the base and the older variants' unique behaviour is carried
    into it.

## Consequences

  * Every source tip (`db4b25b`, `fc01566`, `9d26b78`, `6d2dbc4`) is an ancestor of `master`, byte for byte.
  * 100% renames keep `git log --follow` and `git blame` working across the move into `apps/*` and `packages/*`.
  * The branch lands on `master` only as a merge commit or a fast-forward; squash and rebase merges are not used.

</div>
