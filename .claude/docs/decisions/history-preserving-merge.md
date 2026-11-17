<div align = "center">

# History-Preserving Merge

</div>

<div align = "justify">

How the five repositories were joined. Read this before importing another repository.

## Decisions

  * 2026-11-17: move-then-merge. Each source got one commit of pure `git mv`/`git rm` on an import branch from its tip,
    then `git merge --no-ff --allow-unrelated-histories`, because original SHAs, messages, authors, and dates stay
    untouched (owner rule: no squash, rebase, amend, or filter-repo) and 100% renames keep `git log --follow` and
    `git blame` working across the move.
  * 2026-11-17: trading came from `reviews/20260719` (`fc01566`), 15 commits ahead of `master` and 0 behind, because
    it held the newest code.
  * 2026-11-17: sources were fetched with `--no-tags`; the owner deletes the old tags and releases. The blog's seven
    Dependabot branches were not merged; they were bot bumps against the old layout.
  * 2026-11-17: where two files had the same role, the variant with the newest commit was the base and the older
    variants' unique behaviour was carried over (owner rule).

</div>
