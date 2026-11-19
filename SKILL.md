<div align = "center">

# TyPhed Skills

</div>

<div align = "justify">

The index of every skill the coding assistants use in this repository. A skill is a folder that holds one `SKILL.md`,
whose frontmatter `name` and `description` tell an assistant when to load it. This file is the index, not a skill, so
it carries no frontmatter. [AGENTS.md](AGENTS.md) points here, and the
[agentic harness](docs/README.md#-agentic-harness) shows how each tool reaches the skill folders.

## Repository Skills

A repository skill is written once under an `.agents/skills/` folder, and every wired tool reaches it through a
symlink from its own skills folder. The root folder, `.agents/skills/`, holds no skill yet.

<div align = "center">

| Skill | Scope | Source | Use It To |
| :---: | :---: | :---: | --- |
| `verify` | `apps/trading` | [SKILL.md](apps/trading/.agents/skills/verify/SKILL.md) | Build, launch, and screenshot the trading app to see a UI change working in a browser |

</div>

## Adding A Skill

  1. Create `.agents/skills/<name>/SKILL.md` for the whole repository, or `apps/<app>/.agents/skills/<name>/SKILL.md`
     for one app. The folder name matches the frontmatter `name`.
  2. For an app's first skill, link each tool's skills folder in that app, such as `apps/<app>/.claude/skills`, to
     `../.agents/skills` with a relative symlink.
  3. Add a row to **Repository Skills**.

</div>
