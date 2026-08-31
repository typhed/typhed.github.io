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

This repository holds the brand homepage for **TyPhed - Engineering Tomorrow**, an autonomous technology brand. It is a
`pnpm` monorepo containing two things that build to static files and publish to GitHub Pages together:
an animated "work in progress" landing page with a live launch countdown, and a self-hosted permanent redirect service served
under `typhed.com/permalink/`. The workspace is laid out so additional product sites can be added later without restructuring.

`typhed.com` is the brand, marketing, SEO, and informational hub for the wider TyPhed ecosystem rather than a home for the products
themselves. Each product runs on its own subdomain and is maintained in a separate repository, so it may not be visible from this
one at all; `blog.typhed.com` is already live, carrying the blog, product notes, and example documentation. What the site is for
and what belongs on it are set out in this repository's own [product requirements document](docs/PRD.md); every other
TyPhed property keeps its own, in its own repository.

The one-time hosting setup - GitHub Pages, the custom domain, HTTPS, and Cloudflare DNS - is documented in the [hosting guide](setup.md).

## 🧠 What Is Inside

  * The live website (`apps/web`) that renders the work in progress landing page.
  * Two **shared repositories**, borrowed into this one as git submodules under `shared/`, holding everything that every
    TyPhed site has in common: the components (countdown, animated background, theme switch, header, footer), the brand
    text and links, the colours, and the logo files. Change one of those in the shared repository and every TyPhed site
    picks it up. See [Shared Code](#-shared-code) below.
  * A redirect generator (`permalink`) that renders zero-cost permanent redirects from a single TOML file into static HTML,
    served under `typhed.com/permalink/`.
  * A GitHub Actions workflow that builds the site, generates the redirects, and publishes both to GitHub Pages in one deploy.

The page ships with a dark theme (Midnight Indigo) by default and a light theme (Aurora Glass), switchable through the toggle
in the top right.

## 🚀 Getting Started

The frontend requires **Node.js 20+** and **pnpm** (package manager), enabled through Corepack. The redirect generator requires
**Python 3.13** and **Jinja2** (templating engine).

Clone the repository **with its submodules**. The `--recurse-submodules` flag is what fills in the `shared/` folder; a
plain clone leaves it empty and nothing builds:

```shell
$ git clone --recurse-submodules https://github.com/typhed/typhed.github.io.git
```

If you already cloned it the plain way, this fixes it:

```shell
$ git submodule update --init --recursive
```

Then install:

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
  shared/                <-- BORROWED. Two other repositories live here.
    documents/           github.com/typhed/shared.documents
      brand/             the brand text, links, dates and colours (JSON)
      assets/brand/      the logo, the mark and the favicons
      docs/              the subdomain model and the colour / spacing / type references
      claude/            shared notes loaded by Claude Code in every repo
    components/          github.com/typhed/shared.components
      packages/ui/       the reusable components (the @typhed/ui package)
      packages/config-*  the shared Tailwind and TypeScript settings
      docs/components/   one reference page per component
  permalink/             the permanent redirect generator
    src/                 build.py and the redirect.jinja template
    config/              links.toml, the single source of truth for redirects
    requirements.txt     the redirect builder dependency (Jinja2)
  .github/workflows/     the automated build and deploy to GitHub Pages
```

The single most useful folder to know is [shared/documents/brand](shared/documents/brand); it holds the brand name, the
tagline, the launch date, the footer links, and the colours in one place, as plain JSON files you can edit by hand.

## 🔁 Shared Code

Everything under `shared/` belongs to a **different repository**. Git calls this a submodule: the files sit in this
folder, but they are checked out from somewhere else and are not part of this repository.

| Folder | Repository | What it holds |
| :---: | :---: | --- |
| `shared/documents` | [typhed/shared.documents](https://github.com/typhed/shared.documents) | Brand text, links, colours, logo files, brand docs |
| `shared/components` | [typhed/shared.components](https://github.com/typhed/shared.components) | The reusable React components and build settings |

This is what makes one edit reach every TyPhed site. Change the footer in `shared/components` once, and `typhed.com`,
`blog.typhed.com`, and `trading.typhed.com` all get it: each site rebuilds against the latest shared code automatically.

Two things follow from that, and both matter:

  * **A change under `shared/` affects every site, not just this one.** Make sure it is right for the brand as a whole.
  * **A change under `shared/` needs its own commit, inside that folder.** Committing here does not save it. Run
    `pnpm shared:status` to see whether either folder has work you have not committed or pushed yet.

To pull the latest shared code into your own copy:

```shell
$ pnpm shared:update
```

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

Almost all of these are edits to a **shared** file, so remember the two rules above: the change reaches every TyPhed
site, and it needs its own commit inside `shared/`.

  * **Change the launch date.** Edit [launch.json](shared/documents/brand/launch.json). The value is UTC; the current
    `2027-03-31T18:30:00.000Z` is `01 April 2027, 00:00 IST`.
  * **Change the brand text.** Edit [site.json](shared/documents/brand/site.json) for the name, tagline, canonical
    URL, and description.
  * **Change the menu bar, footer links, social accounts, or contact email.** Edit
    [navigation.json](shared/documents/brand/navigation.json). Write a page this site hosts as its path with a leading
    slash, such as `/about/` or `/permalink/conduct.html`; the shared contract turns that into the full
    `https://typhed.com/...` URL, so the same header and footer still work on `blog.typhed.com` and
    `trading.typhed.com`. Write anything else as a full URL and give it an `"external": true`, which is what opens it in
    a new tab and marks it with a trailing arrow.
  * **Change the colors.** Edit [colors.json](shared/documents/brand/tokens/colors.json), which holds both themes. Do
    not add colours to `globals.css`; the shared setup builds them from that one file.
  * **Change the logo or favicon.** Replace the files in [shared/documents/assets/brand](shared/documents/assets/brand).
    They are copied into the site automatically before every build.
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
| `pnpm shared:update` | Pulls the latest shared components and brand files into your copy. |
| `pnpm shared:status` | Shows uncommitted or unpushed work inside the `shared/` folders. |
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
```

</div>
