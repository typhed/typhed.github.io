# -*- encoding: utf-8 -*-

"""
Keeper Stop Hook for Documentation Reconciliation
=================================================

A Claude Code ``Stop`` hook that nudges the main agent to run the ``keeper``
subagent when source files changed during the turn but the docs may not have
been reconciled.

The hook reads the Stop event JSON on standard input and blocks the stop
exactly once, guarded by ``stop_hook_active`` so it can never loop, with an
instruction to invoke ``keeper``. It blocks only when ``git`` reports
uncommitted changes to files outside ``docs/`` and ``.claude/``; doc-only,
config-only, and no-change turns are left alone.

:NOTE: Every failure path (no git, malformed input, non-zero git status) allows
    the stop silently, so the hook can never wedge a session. It fails open.

.. versionadded:: 2026-06-28 Add Keeper Documentation Reconciliation Hook
"""

import json
import subprocess
import sys

# paths under these prefixes never need a docs reconciliation nudge: docs/ is
# what keeper edits, and .claude/ is local agent and hook configuration.
IGNORED_PREFIXES = ("docs/", ".claude/")


def changedSourcePaths(cwd : str) -> list[str]:
    """
    Return Uncommitted Paths That Could Affect Documentation

    Run ``git status --porcelain`` in ``cwd`` and return the changed paths,
    dropping anything under ``docs/`` or ``.claude/``. An empty list is
    returned when git is unavailable or reports nothing relevant, so the caller
    treats "cannot tell" the same as "nothing to do".

    :type  cwd: str
    :param cwd: Working directory of the repository to inspect, taken from the
        ``cwd`` field of the Stop event.

    :rtype:   list[str]
    :returns: Changed paths outside the ignored prefixes, possibly empty.
    """

    try:
        result = subprocess.run(
            ["git", "-C", cwd, "status", "--porcelain"],
            capture_output = True, text = True, timeout = 10
        )
    except Exception:
        return []

    if result.returncode != 0:
        return []

    paths : list[str] = []
    for line in result.stdout.splitlines():
        entry = line[3:].strip()
        if not entry:
            continue

        # renames are reported as "old -> new"; keep the destination path.
        if " -> " in entry:
            entry = entry.split(" -> ", 1)[1]

        entry = entry.strip().strip('"')
        if entry and not entry.startswith(IGNORED_PREFIXES):
            paths.append(entry)

    return paths


def main() -> int:
    """
    Decide Whether to Nudge the Agent Toward the Keeper Subagent

    Read the Stop event from standard input and, unless this stop is already a
    hook-driven continuation, block once when non-documentation source files
    changed. The block reason instructs the agent to invoke ``keeper`` to
    reconcile ``docs/`` before finishing.

    :rtype:   int
    :returns: Always ``0`` so the hook process exits successfully; the decision
        is carried by the JSON written to standard output, not by the code.
    """

    try:
        event = json.load(sys.stdin)
    except Exception:
        return 0

    if event.get("stop_hook_active"):
        return 0

    changed = changedSourcePaths(event.get("cwd") or ".")
    if not changed:
        return 0

    sample = ", ".join(changed[:8])
    reason = (
        f"Source files changed this turn ({sample}). Before finishing, invoke "
        "the keeper subagent to reconcile the docs/ directory with these "
        "changes. Keeper fixes documentation that now contradicts the code on "
        "its own and asks permission before documenting a new caveat or "
        "variant. If none of these changes affect what docs/ describes, say so "
        "briefly and stop."
    )

    print(json.dumps({"decision" : "block", "reason" : reason}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
