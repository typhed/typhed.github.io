<div align = "center">

# Code Session Logs

</div>

<div align = "justify">

**Agents: skip this folder unless a task asks for a tool's audit or log.** No change to the code needs it: the
architecture, product, and component pages under `docs/` describe the code as it stands, while each file here is a long,
dated report of one tool run and costs many tokens to read.

Coding assistants and their plugins write reports during a session: what they reviewed, what they found, and the change
they suggest. No standard says where such reports belong, so this folder keeps them, with one subfolder per tool and one
dated file per run.

## 📜 Summary Ledger

<div align = "center">

| Tool | Run Date | Document | What It Holds |
| :---: | :---: | :---: | --- |
| [ponytail](https://github.com/DietrichGebert/ponytail) | 2026-11-18 | [2026-11-18.md](ponytail/2026-11-18.md) | An audit of the whole monorepo: what it scanned, the gates on the audited code, and 19 ranked findings, each with its file and line, the behaviour it found, the issue, a suggested change, and its risk; then what it left out, kept on purpose, and did not check |

</div>

### Executive Summary

**Ponytail Audit, the code health check for the TyPhed web estate.** A fast-moving codebase hides small faults, and
visitors feel them first. On 2026-11-18 an AI-assisted, end-to-end review read the brand hub, the trading platform, the
blog, the shared brand layer, and the release pipeline, and returned **19 ranked findings**, each tied to an exact file
and line, with a remedy and its risk.

  * **Protect what visitors see**: two findings changed visible output. Spreadsheet uploads shifted chart times for
    visitors in India, and blog posts reached search engines and link previews without a publish date.
  * **Smooth the everyday path**: sidebar shortcuts left the trading workspace on the old view, the budgeting plan
    used yesterday's date after midnight in India, and one results table opened only with a mouse.
  * **Hold one source of truth to the letter**: seven findings trace logic written in more than one place, the very
    drift that the brand's own rule, one value in one place, exists to prevent.

Eighteen of the nineteen findings are resolved in this repository. The one still open, finding 17, waits on a product
choice: whether each trading tool keeps its `?view=` link or gets a route of its own.

</div>
