<div align = "center">

# Architecture Decision Records

</div>

<div align = "justify">

The architecture decision records capture why each important decision was made and what follows from it. Each file is
named `YYYY-MM-DD.<REVISION_ID>.md`, where the date is the day the decision was accepted and `REVISION_ID` numbers the
decisions of that day, starting at 1. A decision that changes gets a new record, and the latest record always takes
priority.

<div align = "center">

| ADR Date | Decision Slug | ADR Status | File Name | Document Tag(s) |
| :---: | :---: | :---: | :---: | :---: |
| 2026-11-17 | Monorepo Architecture | ✅ | [2026-11-17.1](2026-11-17.1.md) | monorepo |
| 2026-11-17 | Font Awesome Icons | ✅ | [2026-11-17.2](2026-11-17.2.md) | icons, styles, font awesome |
| 2026-11-18 | Vendor Neutral Agent Harness | ✅ | [2026-11-18.1](2026-11-18.1.md) | agent harness |

</div>

The status flag always shows a record's current state: "✅" marks a decision that holds, and "❌" marks one that a newer
record replaces. The table below pairs each replaced record with its replacement, and it stays empty until a decision is
replaced.

<div align = "center">

| Previous ADR Decision File | Updated Decision File |
| :---: | :---: |

</div>

A coding assistant finds the relevant records by their tags, then reads how and why each decision was made and what it
asks for. When a newer record replaces an older one, the assistant reads the newer record in full before it acts on the
decision, and never reverts to the older one on its own.

</div>
