<div align = "center">

# Product Requirements Document (PRD)

</div>

<div align = "justify">

🚀 **`TyPhed - Engineering Tomorrow`** is a technology-driven brand built around privacy and data security. What sets us
apart is one core principle: our free and freemium products never track you, and we never share or save the data you
bring. As an end user of our products, you bring your own data, or plug in a data connector, then analyse, build,
fine-tune, and disconnect.

<div align = "center">

| Document | Document Version | Status |
| :---: | :---: | :---: |
| **`TyPhed web estate`** | v1.0.0-dev.0 | WIP |

</div>

## Document Scope

This PRD governs the three web properties built from this monorepo: the brand hub at **`typhed.com`** and its two
product subdomains, **`blog.typhed.com`** and **`trading.typhed.com`**. Each property has its own section below, and a
requirement in one section does not constrain the others. What the properties share is the brand, not the
requirements: the shared layer in `packages/` carries the brand contract, the design tokens, the page shell, and the
sign-in, and the [domain and subdomain model](brand/subdomain-model.md) records how the properties are laid out across
domains and hosting.

## Domain Architecture

The architecture follows a domain and subdomain model. Shared brand elements, such as the main layout and the primary
navigation links, stay consistent across every property. Everything else lives on its own subdomain, which keeps control
and maintenance simpler.

```text
  https://typhed.com/          → Brand, Marketing, SEO, Legal, and Informational Hub
  https://blog.typhed.com/     → Blog, Product Notes, and Example Documentation
  https://trading.typhed.com/  → The Trading Product: Indicators, Strategies, and Algorithms
```

Every property renders the same brand header and footer. A property that needs its own navigation, such as the trading
tools, shows it in a collapsible menu on the left of the page, so the brand header never changes from one property to
the next. One TyPhed account signs a visitor in on every property.

## typhed.com - The Brand Hub

The platform serves as the **central brand, marketing, SEO, and informational website** for the product ecosystem. Its
primary responsibility is to establish and communicate the parent brand identity, not to host the products themselves.
This website is the authoritative destination for:

  * Overall brand positioning, messaging, and visual identity.
  * Product ecosystem overview and discovery.
  * SEO-focused content and organic search visibility.
  * Marketing campaigns, landing pages, and conversion-oriented content.
  * Company and about information, and brand communications.
  * Product documentation, or high-level product information where appropriate.
  * Legal notices, terms, privacy policies, cookie policies, disclaimers, and related compliance content.
  * Cross-product navigation and links to the relevant product subdomains.
  * Other trust, credibility, and informational content associated with the parent brand.

The home page is a work-in-progress holding page with a launch countdown, and `/about/` is a placeholder. Permanent
short links under `/permalink/` redirect to documents the brand points at, such as the Code of Conduct.

## blog.typhed.com - The Blog

Product notes, engineering write-ups, and example documentation. Posts are MDX files that build into static pages, with
support for mathematics, diagrams, charts, and highlighted code. Every post declares an access tier:

<div align = "center">

| Tier | Meaning |
| :---: | --- |
| 👥 Public | Free for everyone. No account needed. |
| 🔓 Freemium | Sign in with a free account to read the full post. |

</div>

Analytics, advertising, and search-console verification switch on only when their identifiers are configured.

## trading.typhed.com - The Trading Product

A one-stop chart and analysis tool: bring your own data, analyse, and disconnect. Visitors upload their own market data
and answer the questions retail charts skip: how much quantity, how much risk, how to size and allocate capital. The
data stays in the browser.

<div align = "center">

| Area | What It Holds |
| :---: | --- |
| Workspace | Upload CSV or XLSX data, map its columns, chart it with indicators, and run the analysis tools |
| Tools | EMA Swing Lab, Monte Carlo Lab, IPO Dashboard |
| Budgeting | Modified 50-30-20 Rule |

</div>

The workspace asks the visitor to sign in. Free tools are open to every signed-in account; Pro tools, the Monte Carlo
tools and the advanced analytics, unlock with the Pro tier or an individual grant on the account.

## PRD Documentation Decision

Three questions settle almost every case, and they are asked in this order:

<div align = "center">

| Question Intent | Answer | Documentation Lookup |
| --- | :---: | --- |
| Does it describe the brand, or sell a product a visitor has not chosen yet? | YES | The `typhed.com` section |
| Is it part of using a product a visitor has already chosen? | YES | That product's section |
| Is it a brand string, a colour, a footer link, or a shared component? | YES | The shared layer in `packages/`, which every property reads |

</div>

A feature that belongs to one product does not belong on the brand layer, and brand-level content does not belong inside
a product. When the answer is genuinely unclear, the tie-breaker is the visitor's position on the path in the core
principle below: before product selection is the brand hub, after it is the product.

## Core Principle

The brand hub does not replicate or constrain the individual product interfaces. It provides a consistent brand
foundation and a clear path from **discovery → trust → product selection → product experience**, while each product
subdomain evolves independently according to its own design and functional requirements.

The resulting ecosystem feels like a **single, coherent brand with multiple purpose-built products**, rather than a
monolithic application containing every product experience.

</div>
