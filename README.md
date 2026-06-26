<div align = "center">

# Permalink

[![Python](https://img.shields.io/badge/Python-%203.13-003B57?style=plastic&logo=python)](https://www.python.org/)
[![Jinja2](https://img.shields.io/badge/Jinja2-%203.1.6-003B57?style=plastic&logo=jinja)](https://jinja.palletsprojects.com/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-%20Live-003B57?style=plastic&logo=github)](https://typhed.com/permalink/)

</div>

<div align = "justify">

Self-hosted, zero-cost permanent redirect URLs for the [TyPhed](https://github.com/typhed) brand, served from
[GitHub Pages](https://pages.github.com/) as part of the main `typhed.github.io` site. Every redirect is declared once in
a single [TOML](https://toml.io/) file and rendered into a static HTML page that performs the redirect - no servers, no
runtime, and no cost.

## 🧠 About

A redirect is described by a single entry in [config/links.toml](config/links.toml). A small
[Jinja2](https://jinja.palletsprojects.com/) template ([src/templates/redirect.jinja](src/templates/redirect.jinja))
turns each entry into a self-contained HTML page that sends the visitor to the declared target using a canonical link, a
`meta refresh`, and a `location.replace` fallback. The pages also carry `noindex, nofollow` so the redirects are never
indexed.

The generated pages are published under `https://typhed.com/permalink/`. For example, the `config/links.toml` key
`conduct.html` is served at `https://typhed.com/permalink/conduct.html`.

## 🧭 Project Structure

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

## 🚀 Getting Started

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

## 📦 Adding Redirects

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

## 🤖 Deployment

Deployment is automated by the repository-root workflow
[.github/workflows/deploy.yml](../.github/workflows/deploy.yml). On a published GitHub Release, or on demand through
`workflow_dispatch`, the workflow builds the Next.js site, generates the redirect pages into `apps/web/out/permalink/`,
and publishes the site and redirects together to GitHub Pages. No separate workflow or personal access token is
required.

</div>
