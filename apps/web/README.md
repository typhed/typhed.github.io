<div align = "center">

# TyPhed Brand Hub

[![Next.js](https://img.shields.io/badge/Next.js-%2016-000000?style=plastic&logo=nextdotjs)](https://nextjs.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-%20Workers-F38020?style=plastic&logo=cloudflareworkers)](https://workers.cloudflare.com)

</div>

<div align = "justify">

The brand, marketing, SEO, and informational home of TyPhed, served at `typhed.com`. It introduces the brand and
points visitors to the product subdomains. Today it shows a work-in-progress landing page with a live launch
countdown, an `/about/` page, and the permanent redirects under `/permalink/`.

## 🚀 Getting Started

From the repository root:

```shell
$ pnpm install
$ pnpm --filter web dev
```

The site runs at `http://localhost:3000`. `pnpm --filter web build` writes the static export to `apps/web/out/` and
renders the `/permalink/` redirects into it, which needs Python 3.13 with `permalink/requirements.txt` installed.
`pnpm --filter web preview` then serves it at `http://localhost:8787` exactly as Cloudflare does.

## 🗂️ Project Structure

```text
apps/web/
  app/            routes: home, about, metadata files, the OG image
  public/         static files (brand/ is generated)
  wrangler.jsonc  the typhed-web Worker
```

The shell, sign-in, and brand content come from `packages/`; the
[developer guide](../../docs/developers.md#-common-changes-you-might-want) lists the common changes and where to make
them.

</div>
