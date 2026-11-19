<div align = "center">

# Website Documentation

</div>

<div align = "justify">

The documents directory keeps track of the website's architecture, product, design, brand guidelines, and the decisions
made during development, together with the logs that coding assistants write during their sessions. Each topic has
exactly one page, so an LLM tool reads only the file a task needs and spends fewer tokens.

The documentation records what exists. When a page and the code disagree, the code wins, and the page is fixed once the
developer confirms it.

## 🧭 Website Architecture

The development follows a standard architecture, and the documentation stays current so that every coding assistant has
the latest notes, reads only what it needs, and makes changes that follow the brand guidelines.

<div align = "center">

| Document File | Document Coverage |
| :---: | --- |
| [Architecture Note](architecture.md) | The workspace, packages, page shell, authentication, redirects, deployment, and load-bearing constraints. |
| [Product Requirements](product.md) | What each property is for, and which property a feature or a page belongs to. |
| [Developer Guide](developers.md) | Local setup, environment variables, common changes, deployment, and the commands CI runs. |
| [Brand Guidelines](brand/README.md) | The brand story, colour palette, typography and spacing, voice attributes, and application rules. |
| [Domain And Subdomain Model](brand/subdomain-model.md) | Where each property lives across domains, Workers, and DNS, and how one sign-in spans them. |
| [Design References](brand/design/) | `colors.yml`, `spacing.yml`, and `typography.yml`: every token, scale, and change rule. |
| [Account Data Model](data/typhed-project-data.dbml) | The DBML schema of the account and entitlement database that `typhed/typhed.project.data` owns. |

</div>

## 🤖 Agentic Harness

The harness is tool-agnostic. Every instruction, agent, skill, and note lives once in the repository, and each coding
assistant reaches it from its own initialization file, such as `CLAUDE.md` or `GEMINI.md`. One copy keeps a single
source of truth and spends fewer tokens. It also ships with the code, so a new machine, a new tool, or a second
developer on the project starts with the same knowledge.

### Harness Layout

<div align = "center">

| Path | Holds |
| :---: | --- |
| [`AGENTS.md`](../AGENTS.md) | The instructions every assistant shares: commands, architecture, rules, and the table that routes a task to one document. |
| [`CLAUDE.md`](../CLAUDE.md) | Claude Code's entry point. It imports `AGENTS.md` and the project memory, and adds only what belongs to Claude Code. |
| [`SKILL.md`](../SKILL.md) | The index of every repository skill. |
| [`.agents/agents/`](../.agents/agents/) | One file per agent. `keeper` reconciles `docs/` with the code after a source change. |
| [`.agents/skills/`](../.agents/skills/) | The repository skills, one folder each. The folder holds no skill yet. |
| [`.agents/hooks/`](../.agents/hooks/) | The hook scripts every tool registers, such as the keeper Stop hook. |
| [`.claude/settings.json`](../.claude/settings.json) | Claude Code's hook registrations, each by its `.agents/hooks/` path. |
| [`.claude/MEMORY.md`](../.claude/MEMORY.md) | The project memory: owner preferences, environment notes, dated decisions, and open items. |
| [`.claude/docs/`](../.claude/docs/) | Harness material only: the known gaps and the owner's task checklists, which point into `docs/`. |

</div>

A tool's own folder only links into `.agents/` or registers hooks. Each tool reads its agents and skills from its own
folder, so a wired tool links those folders to `.agents/` with relative symlinks, such as `.claude/agents` and
`.claude/skills` for Claude Code, and `apps/trading/.claude/skills` for the trading app's skills. The links need Git's
`core.symlinks` set to `true` and, on Windows, Developer Mode or an elevated shell; otherwise each one checks out as a
plain text file and the tool finds no agents or skills.

### Wiring A New Tool

  1. Point the tool's initialization file at `AGENTS.md`, through an import where the tool supports one, and add only
     the tool's own notes beside it.
  2. Link the tool's agents and skills folders to `.agents/agents` and `.agents/skills` with relative symlinks.
  3. Register each script in `.agents/hooks/` in the tool's hook configuration, by its `.agents/hooks/` path. A hook
     script reads one tool's event format, so check the new tool's input first.
  4. Add the tool's files to the layout table above.

### Agent References

  * 🧩 [**Components Library**](agents/components/README.md): one page per shared component in `packages/ui`, on how
    to use it, with the editing rules every change follows.
  * ✍️ [**Architecture Decision Records**](agents/decisions/README.md): the important architecture decisions, each
    with its context and consequences.
  * 🤖 [**Code Sessions**](agents/tools/README.md): during a coding session, LLM tools (particularly plugins and custom
    agents) may write files that record what they reviewed, what they found, and why they suggest a change. These tools
    have no standard directory, so their files are kept in one place, one folder per tool:
      * [Code Refactor Using Ponytail](agents/tools/ponytail/) holds the dated audits of the ponytail plugin. Each one
        lists what the run reviewed, what it found, and the change it suggests for every finding.

</div>
