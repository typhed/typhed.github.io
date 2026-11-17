<div align = "center">

# TyPhed Documentation

</div>

<div align = "justify">

The architecture, product, design, and decision references for the TyPhed monorepo. Each topic has exactly one page;
when a page and the code disagree, the code wins and the page gets fixed.

## 🧭 Product And Architecture

<div align = "center">

| Page | Covers |
| :---: | --- |
| [PRD.md](PRD.md) | What each property (typhed.com, blog, trading) is for and what belongs on it |
| [architecture.md](architecture.md) | The workspace, packages, theming, page shell, auth, redirects, deployment, and constraints |
| [adr/](adr/README.md) | Every architecture decision, dated, with its context and consequences |
| [brand/subdomain-model.md](brand/subdomain-model.md) | Domains, Workers, DNS, the shared sign-in, and adding a subdomain |
| [data/typhed-project-data.dbml](data/typhed-project-data.dbml) | The data model of the separate account backend |

</div>

## 🎨 Design System

<div align = "center">

| Page | Covers | Source Of Truth |
| :---: | --- | :---: |
| [design/colors.yml](design/colors.yml) | Every theme token, its computed hex, where it is used, and the change rules | [colors.json](../packages/brand/tokens/colors.json) |
| [design/spacing.yml](design/spacing.yml) | Step scale, container, breakpoints, vertical rhythm, component sizes, radius | [spacing.json](../packages/brand/tokens/spacing.json) |
| [design/typography.yml](design/typography.yml) | Fonts and how they load, the size scale, weights, tracking, heading semantics | [typography.json](../packages/brand/tokens/typography.json) |

</div>

The JSON files are the system and the YAML files document it. Change a value in the JSON, then update the YAML in the
same commit.

## 🧩 Components

[components/README.md](components/README.md) indexes one page per shared component in `packages/ui`, with the editing
rules every change follows.

</div>
