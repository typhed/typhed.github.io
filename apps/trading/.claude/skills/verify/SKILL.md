---
name: verify
description: Build, launch and screenshot the web app (apps/web) to verify UI changes at runtime.
---

# Verifying apps/web changes

## Launch

```powershell
Set-Location -LiteralPath "<repo>\apps\web"   # -LiteralPath: the repo path contains [brackets]
pnpm dev                                       # run in background; port 3000 often busy -> Next picks 3001
```

Routes need a trailing slash (`/budgeting/mnws/` — a bare path returns 308).
The app seeds `DEFAULT_MNWS_DATASET` (first salary 2016-11-30) on first visit, so
budgeting pages render full charts with no data entry.

## Screenshot / drive

No Playwright in the repo. Two working handles:

1. Quick static shot — headless Edge (profile-path errors in stderr are harmless):
   ```powershell
   & "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu `
     --user-data-dir="$env:TEMP\edgeprofile" --hide-scrollbars --window-size=1440,4600 `
     --virtual-time-budget=15000 --screenshot="out.png" "http://localhost:3001/<route>/"
   ```
2. Interactive (theme toggles, viewports) — `npm i puppeteer-core` in a scratch dir and
   launch with `executablePath` pointing at the Edge binary above.

## Gotchas

- Theme: next-themes with `defaultTheme="dark"`. Force via
  `localStorage.setItem("theme", "light" | "dark")` then reload.
- After `page.setViewport(...)` on a loaded page, fullPage screenshots can come out the
  wrong width (charts re-measure via `useElementWidth`). Reload at the target viewport
  instead of resizing.
- `npm run lint` (`next lint`) is unconfigured and prompts interactively — skip it;
  use `npm run typecheck` and root `npx prettier --check` instead.
