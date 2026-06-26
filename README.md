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
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-%20Live-003B57?style=plastic&logo=github)](https://typhed.com/permalink/)

</div>

<div align = "justify">

This repository holds the brand homepage for **TyPhed - Engineering Tomorrow**, a brand maintained and owned by Debmalya Pramanik HUF. Right now the site is a modern, animated "work in progress" landing page with a live countdown to launch. It is built as a `pnpm` monorepo so additional product sites can be added later without starting over.

If you have never run a frontend project before, do not worry. Follow the steps below exactly and you will see the website running on your own computer in a few minutes. To put it live on the internet at your domain, open the hosting guide kept in your project folder at `.claude/setup.md`.

## 🧠 What Is Inside

  * A single live website (`apps/web`) that renders the work in progress landing page.
  * A shared component library (`packages/ui`) that holds the countdown, the animated background, the theme switch and the branding. This is the part that gets reused by future product sites.
  * Shared configuration packages so every app uses the same TypeScript and design settings.
  * A ready to use GitHub Actions workflow that builds the site and publishes it to GitHub Pages on every push.

The page ships with a dark theme (Midnight Indigo) by default and a light theme (Aurora Glass) that visitors can switch to with the toggle button in the top right.

## 🚀 Getting Started

You need two things installed on your computer before you begin.

  1. **Node.js** version 20 or newer. Download it from [nodejs.org](https://nodejs.org). To check what you have, run `node --version`.
  2. **pnpm**, the package manager. The easiest way is to enable it through a tool that already ships with Node called Corepack.

Open a terminal (PowerShell on Windows), move into the project folder, and run these commands one at a time.

```shell
$ corepack enable
$ pnpm install
```

The first command turns on `pnpm`. The second command downloads every library the project needs. This can take a minute the first time. You only need to run `pnpm install` again when the dependencies change.

## 🖥️ See It On Your Local Host

To start the website in development mode, run:

```shell
$ pnpm dev
```

Wait for the line that says it is ready, then open your browser at [http://localhost:3000](http://localhost:3000). You will see the live site. The countdown updates every second, and the theme toggle works immediately. While `pnpm dev` is running, any change you save to the code refreshes the browser automatically. Press `Ctrl + C` in the terminal to stop it.

## 📦 Project Structure

The project is a monorepo, which simply means several related packages live together in one repository.

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
  .github/workflows/     the automated build and deploy to GitHub Pages
```

The single most useful file to know is [packages/ui/lib/constants.ts](packages/ui/lib/constants.ts). It holds the brand name, the tagline, the launch date and the contact links in one place.

## 🎨 Common Changes You Might Want

  * **Change the launch date.** Edit `LAUNCH_DATE` and `LAUNCH_LABEL` in [packages/ui/lib/constants.ts](packages/ui/lib/constants.ts). The date is written in UTC. The current value `2027-03-31T18:30:00.000Z` is exactly `01 April 2027, 00:00 IST`.
  * **Change the brand text or contact links.** Edit the `SITE` and `SOCIAL_LINKS` values in the same file.
  * **Change the colors.** The two themes live as CSS variables in [apps/web/app/globals.css](apps/web/app/globals.css). The light theme is under `:root` and the dark theme is under `.dark`.

## 🧱 Build And Preview The Final Site

When you are ready to produce the exact files that go on the internet, run:

```shell
$ pnpm build
```

This creates a fully static copy of the site in `apps/web/out`. To preview that final build locally, serve the folder with any static server:

```shell
$ pnpm dlx serve apps/web/out
```

Then open the address it prints (usually [http://localhost:3000](http://localhost:3000)).

## 🚢 Putting It Live

The site is designed for GitHub Pages with your Cloudflare domain `typhed.com`. Every time you push to the `master` branch, GitHub automatically builds and publishes it. The one time setup of GitHub Pages, the custom domain, HTTPS, and Cloudflare DNS is written out step by step in the hosting guide at `.claude/setup.md` inside your project folder. Start there once the site looks right on your local host.

## 🧪 Useful Commands

| Command | What It Does |
| :---: | --- |
| `pnpm dev` | Runs the site locally with live reload at `localhost:3000`. |
| `pnpm build` | Produces the static site in `apps/web/out`. |
| `pnpm lint` | Checks the code for common mistakes. |
| `pnpm typecheck` | Verifies all TypeScript types. |
| `pnpm format` | Formats every file with Prettier. |

# Redirect URL

Self-hosted, zero-cost permanent redirect URLs for the [TyPhed](https://github.com/typhed) brand, served from
[GitHub Pages](https://pages.github.com/) as part of the main `typhed.github.io` site. Every redirect is declared once in
a single [TOML](https://toml.io/) file and rendered into a static HTML page that performs the redirect - no servers, no
runtime, and no cost.

### 🧠 About

A redirect is described by a single entry in [config/links.toml](config/links.toml). A small
[Jinja2](https://jinja.palletsprojects.com/) template ([src/templates/redirect.jinja](src/templates/redirect.jinja))
turns each entry into a self-contained HTML page that sends the visitor to the declared target using a canonical link, a
`meta refresh`, and a `location.replace` fallback. The pages also carry `noindex, nofollow` so the redirects are never
indexed.

The generated pages are published under `https://typhed.com/permalink/`. For example, the `config/links.toml` key
`conduct.html` is served at `https://typhed.com/permalink/conduct.html`.

### 🧭 Project Structure

```text
permalink/
├─ src/
│  ├─ build.py                     # the static redirect generator
│  └─ templates/
│     └─ redirect.jinja            # redirect page template
├─ config/
│  └─ links.toml                   # source of truth - one table per redirect
├─ requirements.txt                # build dependency - jinja2
└─ README.md
```

### 🚀 Getting Started

Build the redirect pages locally with [Python 3.13](https://www.python.org/) and
[Jinja2](https://jinja.palletsprojects.com/). Run the commands from the repository root:

```shell
$ pip install -r permalink/requirements.txt
$ python permalink/src/build.py
```

The generator writes one HTML file per redirect. Each path is configurable from the command line:

| Flag | Default | Description |
| :---: | :---: | --- |
| `--config` | `config/links.toml` | The TOML file that declares the redirects |
| `--template` | `src/templates/redirect.jinja` | The Jinja template rendered for each redirect |
| `--output` | `dist` | The directory that receives the generated pages |

```shell
$ python permalink/src/build.py --output build_preview
```

### 📦 Adding Redirects

Add a new table to [config/links.toml](config/links.toml). The table key is the generated filename, and the `target`
must be an absolute `http` or `https` URL:

```toml
[links."conduct.html"]
label = "The Code of Conduct"
target = "https://github.com/typhed/.github/blob/master/.github/CODE_OF_CONDUCT.md"
```

  * **key** - the output filename, served at `https://typhed.com/permalink/<key>`.
  * **target** - the destination URL, validated as `http`/`https` at build time.
  * **label** - optional friendly link text shown on the page (defaults to `destination`).

### 🤖 Deployment

Deployment is automated by the repository-root workflow
[.github/workflows/deploy.yml](../.github/workflows/deploy.yml). On a published GitHub Release, or on demand through
`workflow_dispatch`, the workflow builds the Next.js site, generates the redirect pages into `apps/web/out/permalink/`,
and publishes the site and redirects together to GitHub Pages. No separate workflow or personal access token is
required.

## ⚖️ Ownership And License

```text
Copyright © 2026 TyPhed - Engineering Tomorrow
This brand is maintained and owned by Debmalya Pramanik HUF
```

</div>
