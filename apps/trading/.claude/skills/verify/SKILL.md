---
name: verify
description: >-
  Build, launch, and screenshot the trading app (apps/trading) to verify UI changes at runtime. Use when a change to
  apps/trading needs to be seen working in a browser. Trigger phrases: "verify the trading app", "screenshot the
  trading app", "check the trading UI".
---

<div align = "center">

# Verify

</div>

<div align = "justify">

Run the trading app locally and look at a change in a real browser before calling it done.

## Getting Started

  1. Work from the repository root, and quote its path: it can contain spaces or brackets.
  2. Use the development server for quick checks and the production preview for anything Cloudflare serves.
  3. Run the gates before and after the visual check.

## Launch

```shell
$ pnpm --filter trading dev
```

The development server listens on `http://localhost:3001`. For the build exactly as Cloudflare serves it, run
`pnpm --filter trading build`, then `pnpm --filter trading preview` on `http://localhost:8788`.

Routes keep a trailing slash: `/budgeting/mnws/` loads and `/budgeting/mnws` redirects. The app seeds
`DEFAULT_MNWS_DATASET` (first salary 2016-11-30) on the first visit, so the budgeting pages render full charts with no
data entry.

## Screenshot And Drive

The repository has no browser automation. Two handles work:

  1. **A static shot** with headless Edge or Chrome:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu `
  --user-data-dir="$env:TEMP\edgeprofile" --hide-scrollbars --window-size=1440,4600 `
  --virtual-time-budget=15000 --screenshot="out.png" "http://localhost:3001/<route>/"
```

  2. **An interactive session** (theme toggles, the sidebar, viewports): install `puppeteer-core` in a scratch folder
     and launch it with `executablePath` pointing at the Edge or Chrome binary.

## Gotchas

  * The theme comes from `next-themes` with `defaultTheme="dark"`. Force one with
    `localStorage.setItem("theme", "light")` (or `"dark"`), then reload.
  * The left menu remembers its collapse choice in `localStorage` under `typhed:sidebar:trading`.
  * After `page.setViewport(...)` on a loaded page, full-page screenshots can come out the wrong width, because the
    charts re-measure through `useElementWidth`. Reload at the target viewport instead of resizing.
  * `pnpm --filter trading lint`, `pnpm --filter trading typecheck`, and `pnpm --filter trading test` are the gates.

## Quick Checklist

  - [ ] Did the change render on `http://localhost:3001` (or the `8788` preview) with no console errors?
  - [ ] Did I check both themes and a narrow viewport?
  - [ ] Did lint, typecheck, and the tests pass?

</div>
