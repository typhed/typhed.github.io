<div align = "center">

# TyPhed - Engineering Tomorrow

[![Next.js](https://img.shields.io/badge/Next.js-%2015-003B57?style=plastic&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-%205-003B57?style=plastic&logo=typescript)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-%20workspace-003B57?style=plastic&logo=pnpm)](https://pnpm.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-%203.4-003B57?style=plastic&logo=tailwindcss)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-%20components-003B57?style=plastic&logo=shadcnui)](https://ui.shadcn.com)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-%20hosting-003B57?style=plastic&logo=github)](https://pages.github.com)
[![Python](https://img.shields.io/badge/Python-%203.13-003B57?style=plastic&logo=python)](https://www.python.org/)
[![Jinja2](https://img.shields.io/badge/Jinja2-%203.1.6-003B57?style=plastic&logo=jinja)](https://jinja.palletsprojects.com/)
[![Live Site](https://img.shields.io/badge/GitHub%20Pages-%20Live-003B57?style=plastic&logo=github)](https://typhed.com/permalink/)

</div>

<div align = "justify">

This repository holds the brand homepage for **TyPhed - Engineering Tomorrow**, a brand maintained and owned by Debmalya
Pramanik HUF. It is a `pnpm` monorepo containing two things that build to static files and publish to GitHub Pages together:
an animated "work in progress" landing page with a live launch countdown, and a self-hosted permanent redirect service served
under `typhed.com/permalink/`. The workspace is laid out so additional product sites can be added later without restructuring.

The one-time hosting setup - GitHub Pages, the custom domain, HTTPS, and Cloudflare DNS - is documented in the [hosting guide](setup.md).

## 🧠 What Is Inside

  * The live website (`apps/web`) that renders the work in progress landing page.
  * A shared component library (`packages/ui`) holding the countdown, animated background, theme switch, and branding - the
    parts reused by future product sites.
  * Shared TypeScript and Tailwind configuration packages so every app builds against the same settings.
  * A redirect generator (`permalink`) that renders zero-cost permanent redirects from a single TOML file into static HTML,
    served under `typhed.com/permalink/`.
  * A GitHub Actions workflow that builds the site, generates the redirects, and publishes both to GitHub Pages in one deploy.

The page ships with a dark theme (Midnight Indigo) by default and a light theme (Aurora Glass), switchable through the toggle
in the top right.

## 🚀 Getting Started

The frontend requires **Node.js 20+** and **pnpm** (package manager), enabled through Corepack. The redirect generator requires
**Python 3.13** and **Jinja2** (templating engine).

```shell
$ corepack enable
$ pnpm install
```

Install the redirect builder's dependency when you intend to generate redirects locally:

```shell
$ pip install -r permalink/requirements.txt
```

## 🖥️ Local Development

Start the development server with live reload:

```shell
$ pnpm dev
```

The site is served at [http://localhost:3000](http://localhost:3000); the countdown updates every second, the theme toggle is
live, and saved changes hot-reload. Stop the server with `Ctrl + C`.

Generate the static redirect pages declared in [links.toml](permalink/config/links.toml):

```shell
$ python permalink/src/build.py
```

The generator writes one HTML file per redirect. Each path is overridable from the command line:

| Flag | Default | Description |
| :---: | :---: | --- |
| `--config` | `config/links.toml` | The TOML file that declares the redirects |
| `--template` | `src/templates/redirect.jinja` | The Jinja template rendered for each redirect |
| `--output` | `dist` | The directory that receives the generated pages |

```shell
$ python permalink/src/build.py --output build_preview
```

## 📦 Project Structure

The repository is a monorepo - several related packages living together in one repository.

```text
typhed.github.io/
  apps/
    web/                 the live website served at typhed.com
      app/               pages, layout, SEO routes (robots, sitemap, icons)
      public/            CNAME and static files copied as is to the site
  packages/
    ui/                  shared, reusable components (the @typhed/ui package)
      components/        countdown, background, theme toggle, footer, landing
      lib/               brand text, the launch date, and helpers
    config-tailwind/     the shared color and design tokens
    config-typescript/   the shared TypeScript settings
  permalink/             the permanent redirect generator
    src/                 build.py and the redirect.jinja template
    config/              links.toml, the single source of truth for redirects
    requirements.txt     the redirect builder dependency (Jinja2)
  .github/workflows/     the automated build and deploy to GitHub Pages
```

The single most useful file to know is [constants.ts](packages/ui/lib/constants.ts); it holds the brand name, the tagline,
the launch date, and the contact links in one place.

## 🔗 Permanent Redirects

Each redirect is one entry in [links.toml](permalink/config/links.toml). A Jinja2 template ([redirect.jinja](permalink/src/templates/redirect.jinja))
renders each entry into a self-contained HTML page that forwards the visitor with a canonical link, a `meta refresh`, and a
`location.replace` fallback, and carries `noindex, nofollow` so the redirects are never indexed. The result is serverless and zero-cost.

Generated pages are published under `https://typhed.com/permalink/`; the TOML file keys sets the endpoint for the redirect URL
which is like `https://typhed.com/permalink/...` endpoints. Declare a redirect by adding a table to [links.toml](permalink/config/links.toml),
keyed by the output filename, with an absolute `http` or `https` `target`:

```toml
[links."conduct.html"]
label = "The Code of Conduct"
target = "https://github.com/typhed/.github/blob/master/.github/CODE_OF_CONDUCT.md"
```

  * **key** - the output filename, served at `https://typhed.com/permalink/<key>`.
  * **target** - the destination URL, validated as `http`/`https` at build time.
  * **label** - optional link text shown on the page (defaults to `destination`).

## 🎨 Common Changes You Might Want

  * **Change the launch date.** Edit `LAUNCH_DATE` and `LAUNCH_LABEL` in [constants.ts](packages/ui/lib/constants.ts). The
    value is UTC; the current `2027-03-31T18:30:00.000Z` is `01 April 2027, 00:00 IST`.
  * **Change the brand text or contact links.** Edit `SITE`, `SOCIAL_LINKS`, and `CONTACT_EMAIL` in the same file.
  * **Change the menu bar or footer links.** Edit `NAV_LINKS`, `LOGIN_CTA`, `FOOTER_COLUMNS` (and `COMPANY_LINKS` /
    `PRODUCT_LINKS` / `RESOURCE_LINKS`), and `PRIVACY_LINK` in [constants.ts](packages/ui/lib/constants.ts).
  * **Change the colors.** The two themes are CSS variables in [globals.css](apps/web/app/globals.css) - light under `:root`,
    dark under `.dark`.
  * **Add or change a redirect.** Edit [links.toml](permalink/config/links.toml); see **Permanent Redirects** above for the table format.

## 🧱 Build And Preview The Final Site

Produce the exact static files that go on the internet:

```shell
$ pnpm build
```

This writes a fully static copy of the site to `apps/web/out`. The deploy pipeline additionally generates the redirect pages
into `apps/web/out/permalink/`, so the site and its redirects ship together. Preview the build with any static server:

```shell
$ pnpm dlx serve apps/web/out
```

Then open the address it prints (usually [http://localhost:3000](http://localhost:3000)).

## 🚢 Putting It Live

The site targets GitHub Pages on the Cloudflare domain `typhed.com`. Deployment is automated by [deploy.yml](.github/workflows/deploy.yml):
on a published GitHub Release, or on demand through `workflow_dispatch`, the workflow builds the Next.js site, generates the
redirect pages into `apps/web/out/permalink/`, and publishes the site and redirects together - no separate workflow or
personal access token required.

The one-time setup of GitHub Pages, the custom domain, HTTPS, and Cloudflare DNS is written out step by step in the
[hosting guide](setup.md). Start there once the site looks right locally.

## 🧪 Useful Commands

| Command | What It Does |
| :---: | --- |
| `pnpm dev` | Runs the site locally with live reload at `localhost:3000`. |
| `pnpm build` | Produces the static site in `apps/web/out`. |
| `pnpm lint` | Checks the code for common mistakes. |
| `pnpm typecheck` | Verifies all TypeScript types. |
| `pnpm format` | Formats every file with Prettier. |
| `python permalink/src/build.py` | Generates the redirect pages from `links.toml`. |

## ⚖️ Project Release Names Disclaimer

Our release codenames are inspired by spells from the Harry Potter series created by J.K. Rowling. "Harry Potter" and all
related names, characters, spells, places, and indicia are trademarks of, and copyrighted by, Warner Bros. Entertainment Inc.,
J.K. Rowling, and/or their respective rights holders. **TyPhed - Engineering Tomorrow** is an independent project and is not
affiliated with, endorsed by, sponsored by, or in any way officially connected to Warner Bros. Entertainment Inc., J.K. Rowling,
or any of their subsidiaries or affiliates. These names are used solely as internal release identifiers, in tribute, with no
claim of ownership and no intent to imply any official association. All rights in the original works and marks remain the
property of their respective owners.

## ⚖️ Ownership And License

```text
Copyright © 2026 TyPhed - Engineering Tomorrow
This brand is maintained and owned by Debmalya Pramanik HUF
```

</div>
