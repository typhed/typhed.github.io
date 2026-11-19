<div align = "center">

# TyPhed - Engineering Tomorrow

[![Brand Page](https://img.shields.io/badge/🌐%20TyPhed-%20Engineering%20Tomorrow-000000?style=plastic)](https://typhed.com/)
[![Trading Platform](https://img.shields.io/badge/📈-Trading%20Platform-49BFD1?style=plastic)](https://trading.typhed.com/)

[![Blogging Platform](https://img.shields.io/badge/📜-Blogging%20Platform-6366F1?style=plastic)](https://blog.typhed.com/)

</div>

<div align = "justify">

**TyPhed - Engineering Tomorrow** is a technology-driven brand built around privacy and data security, and one principle
sets it apart: our free and freemium products are completely free of tracking. We never share or save the data you
bring. You use our tools on your own data, or plug in a data connector, then analyse, build, fine-tune, and disconnect.
You can also download your configuration file and pick up where you left off.

Subscription-based products, even on a free trial or limited usage, may track limited, basic information (for example,
Google AdSense), and we never share it with third parties. Our code is open source, so you can check exactly how you are
tracked, and contribute by following the [contributing guidelines](https://typhed.com/permalink/contributing.html).

## 🌐 Our Products & Services

The brand [**`typhed.com`**](https://typhed.com/) is a conglomerate of products and services built on engineering
principles to improve quality of life. It is the front door to the ecosystem: the place to discover each product, read
the legal and privacy notices, and create the one account every product shares. The brand offers these products and
services:

  * [**Trading Platform**](https://trading.typhed.com/): a stock market trading suite built for retail traders, with
    tools, analysis, recommendations based on different patterns or algo-trading rules, and a dashboard to monitor your
    trades. Its free tools let you bring in your own market data, in a structured format, and draw conclusions from
    strategies such as EMA Crossover points, and the Pro tier adds Monte Carlo Simulation. Every tool runs in your
    browser, and TyPhed stores none of your data.

### List Of Resources

TyPhed publishes these resources for end users, developers, and everyone else who uses the platform, with tools,
documentation, and more around our products and offerings:

  * [**Blogging Platform**](https://blog.typhed.com/): product notes, example usages, "how to" documents, explanations,
    and our attempt at blogging in general, all around the platform and our products and offerings.

### Pricing Model

Every product and service shares one centralised user management system (one account, used across every domain) and
follows one of the pricing models below. Check each product's page for its pricing, free tier allowance, trial usage,
subscription cycle, and more.

  * 👥 **Public Tier**: free for everyone, with no account required. Bring in your own data, analyse, build, fine-tune,
    and disconnect. A free tier product gives you the look, feel, and understanding of the product, and an advanced
    paid model may be available for it.
  * 🔓 **Freemium Products**: you create an account to use the product. Usage varies, and the product asks for only
    minimal user information.
  * 🔒 **Invite Only**: available only to invited customers and users, and often requires a dedicated account secured
    with an `X-API Key` header.
  * 💳 **Subscription Products**: available only with a subscription. One account can turn several subscriptions on or
    off from the account management section. A subscription product may have a free trial or lookup period; check the
    product's pricing page for more information.

The [product document](docs/product.md) is the technical document that describes the products in general, while the
[architecture](docs/architecture.md) and the [design decisions](docs/agents/decisions/README.md) are written for
developers. The [developer guide](docs/developers.md) holds the getting-started notes, local build steps, and useful
commands, and the [documentation index](docs/README.md) maps every page.

## ⚠️ Product Disclaimer

By accessing or using any TyPhed product or service, you agree to the
[Terms and Conditions](https://typhed.com/permalink/conditions.html) and to the
[Legal Disclaimer](https://typhed.com/permalink/disclaimer.html) concerning financial advice. You acknowledge that TyPhed
may amend its terms of use, disclaimers, and related notices at any time without prior notice.

### Project Release Name

Our release codenames are inspired by spells from the Harry Potter series created by J.K. Rowling. "Harry Potter" and
all related names, characters, spells, places, and indicia are trademarks of, and copyrighted by, Warner Bros.
Entertainment Inc., J.K. Rowling, and/or their respective rights holders. **TyPhed - Engineering Tomorrow** is an
independent project and is not affiliated with, endorsed by, sponsored by, or in any way officially connected to Warner
Bros. Entertainment Inc., J.K. Rowling, or any of their subsidiaries or affiliates. These names are used solely as
internal release identifiers, in tribute, with no claim of ownership and no intent to imply any official association.
All rights in the original works and marks remain the property of their respective owners.

### Coding Assistants & LLM Tools

We build this website with AI coding assistants such as Claude Code and Windsurf, and keep their configuration in
tool-agnostic, industry-standard files. So that every developer can work with the tool of their choice, each tool
reaches the shared [agents](AGENTS.md), [skills](SKILL.md), and similar files through its own entry point: an import
line in its instruction file, or a `symlink` into the shared `.agents/` folder.

As of November 2026, there is no industry standard for storing *hooks* in the same way. Claude Code reads them from
`.claude/settings.json`, Google Gemini from a `hooks.json` file in the project root, and other coding assistants follow
their own conventions. To stay tool-agnostic, the project keeps its hook scripts in `.agents/hooks/`, and each tool
registers them in its own configuration. The agentic harness [documentation](docs/README.md#-agentic-harness) explains
how the repository is laid out for AI coding tools.

## ⚖️ Ownership & License

The brand **`TyPhed - Engineering Tomorrow`** is a UDYAM MSME (`UDYAM-WB-10-0214968`) registered by *Debmalya Pramanik
HUF*, classified on 17/07/2026, and mainly associated with providing products and software services. For more details,
refer to the registration certificate.

<div align = "center">

```text
Copyright © 2026 TyPhed - Engineering Tomorrow
```

</div>

</div>
