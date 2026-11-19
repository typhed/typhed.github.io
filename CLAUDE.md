# TyPhed For Claude Code

Claude Code's entry point. The instructions every assistant shares live in `AGENTS.md`, imported below; this file adds
only what belongs to Claude Code.

@AGENTS.md

## Claude Code

  * **Stop hook**: `.claude/settings.json` registers `python .agents/hooks/keeper-stop-hook.py`. When files outside
    `docs/`, `.claude/`, and `.agents/` changed, it blocks the stop once and asks for the `keeper` agent. The script
    fails open, and on a machine without Python on its `PATH` the hook cannot start, so the session ends as usual.
  * **Keeper**: `.claude/agents` links to `.agents/agents`, so `keeper` is a registered agent. Where the link checks out
    as a plain text file, follow `.agents/agents/keeper.md` in the main session, or say that the change affects no
    document.
  * **Skills**: `.claude/skills` links to `.agents/skills`, and `apps/trading/.claude/skills` to
    `apps/trading/.agents/skills`, so the trading app's `verify` skill loads when a task works under `apps/trading/`.
  * **Local overrides**: `.claude/settings.local.json` and `CLAUDE.local.md` are gitignored, for personal settings.

## Memory

@.claude/MEMORY.md
