<div align = "center">

# Known Gaps

</div>

<div align = "justify">

Open questions and missing values, recorded instead of guessed. Each one needs the owner's answer before anyone acts on
it. Remove an entry when it is resolved.

## Brand And Legal

  * **Privacy principle versus blog analytics.** The README promises that the free and freemium products are free of
    tracking, yet `apps/blogging`, a free resource, loads GA4, AdSense, and Microsoft Clarity whenever their
    `NEXT_PUBLIC_*` ids are set. Keep, gate behind consent, or remove?
  * **AdSense publisher id.** `apps/blogging/public/ads.txt` carries the placeholder `pub-0000000000000000`.
  * **Owning entity.** The README names *Debmalya Pramanik HUF* as the UDYAM-registered owner of the brand, while the
    footer and the design references present TyPhed as an autonomous brand with no owning entity, and the blog's
    description and keywords in `packages/brand/properties.json` name the HUF. Which rule holds for brand copy?
  * **Registration certificate.** The README's Ownership section refers readers to the registration certificate, but
    links to none.
  * **License.** The README says the code is open source, but the repository has no `LICENSE` file. Four packages
    (`brand`, `ui`, `config-tailwind`, and `config-typescript`) declare `"license": "MIT"` in their `package.json`.
  * **Legal pages and contributing guidelines.** No Terms and Conditions, Legal Disclaimer, or contributing guidelines
    exist yet. The README links to the `conditions.html`, `disclaimer.html`, and `contributing.html` permalinks, but
    `permalink/config/links.toml` defines only `conduct.html`, so those three links reach the 404 page until each has a
    target. The footer's Legal Disclaimer and Contributing Guidelines links in `packages/brand/navigation.json` point at
    `#`.
  * **Brand guidelines copy.** The Brand Story, Voice Attributes, and Application Rules sections of
    `docs/brand/README.md` stay blank until the owner writes them.
  * **Trading and blog logos.** Neither site has its own artwork yet; the owner designs it and adds it under
    `packages/brand/assets`. Until then both sites show the TyPhed mark and favicon set, and no logo is drawn in code.
  * **Sidebar entry icons.** The icon-rail sidebar the owner chose as the model shows one icon per entry, with a
    tooltip, when collapsed. The sidebar entries in `packages/brand/properties.json` carry no icon, so the collapsed
    rail shows only its toggle. The owner picks a Font Awesome icon per entry, stored as a key the way `SOCIAL_LINKS`
    stores its icons.

## Design Tokens

  * **Blog chart colours.** `apps/blogging/app/globals.css` defines the `--chart-1` to `--chart-4` series colours for
    both themes, while the architecture allows no `:root` or `.dark` palette in any `globals.css` and `colors.yml`
    documents only the tokens in `packages/brand/tokens/colors.json`. Move the four series colours into `colors.json`,
    or record them as the one allowed exception?

## Trading Platform

  * **Tool links in the sidebar.** Audit finding 17: on `/?view=emalab` and `/?view=montecarlo` the sidebar marks
    "Workspace" as the current page, because it compares the pathname only. The same choice settles two smaller cases:
    after a visitor switches tabs in the workspace, the sidebar link for the view already in the address bar does
    nothing, and loading a saved analysis opens the chart. Keep the `?view=` links, or give each tool its own route?
  * **Negative IPO corpus.** The Total Amount cell sets `min={0}`, but `NumberCell` does not enforce it, so a typed
    negative corpus gives negative lots and a negative best-case profit in `apps/trading/lib/ipo/applications.ts`.
    Clamp the corpus at zero, or reject the value in the cell?
  * **Inline clamps.** `components/tools/monte-carlo.tsx` and `components/budgeting/mnws/mnws-inputs.tsx` clamp with
    inline `Math.min` and `Math.max` instead of `clamp` from `lib/utils.ts`. Fold them in?

## Documentation

A review on 2026-11-19 flagged the items below; none is verified against the code yet, and no page changed for them.

  * **Unchecked contradictions.** `docs/brand/subdomain-model.md`: the new-subdomain checklist leaves out extending the
    `PropertyId` union in `packages/brand/types.ts` and the wiring every app has (`typhed-brand-sync` before `dev` and
    `build`, a `typecheck` script). `docs/data/typhed-project-data.dbml`: says "Four schemas in one database" but
    defines three. `docs/architecture.md`: the brand tests "guard all of this". `apps/blogging/README.md`: what
    `app/globals.css` holds. The `_comment` in `packages/brand/tokens/colors.json` and the static-assets note in
    `colors.yml`: how the preset emits the tokens. Component pages: ThemeToggle's anatomy, the SiteHeader layout
    example, the page-order conventions in the components README, and the motion claim on ProductSidebar. Check each
    against the code and fix the page?
  * **Undocumented behaviour.** The sticky header's `h-16` also sets other offsets; `transpilePackages` is missing from
    the steps for a new package; and the component pages leave out the storage keys, the Button brand tokens, the
    header's sign-in fallback with auth off, ScrollToTop's callers, and AbstractBackground as the SiteShell default.
    Document them?
  * **Header controls and touch targets.** `spacing.yml` sets 36px as the smallest interactive control, while the
    FontSizeToggle buttons are 28 by 32px and the ProductSidebar toggle is 32px square. Enlarge the controls, or lower
    the documented minimum?
  * **Light-theme caption contrast.** `colors.yml` rates the light sidebar caption at 4.51:1 from unrounded values; the
    rendered hexes give 4.49:1, under the 4.5:1 minimum for small text. Adjust the muted foreground, or the rating?
  * **Brand strings in components.** `BrandMark` writes the wordmark as literal text instead of reading `SITE.name`.
    Derive it, or record the wordmark as artwork?
  * **Duplicate brand files.** Nothing links `packages/brand/assets/favicon/site.webmanifest`, a second copy of the
    manifest values, and `apps/web/public/favicon.ico` repeats the brand favicon. Delete them, or keep them for another
    consumer?
  * **The `www` redirect.** `docs/brand/subdomain-model.md` and `docs/architecture.md` describe the `www.typhed.com` 301
    through a Cloudflare Redirect Rule, which the go-live checklist has not created yet; GitHub Pages answers the 301
    today. Reword the pages until the rule exists, or leave them for the go-live?

## Tooling

  * **flake8 and `.venv`.** `.flake8` excludes `venv/` but not `.venv/`, the folder the owner-machine checklist has
    developers create at the root, so `flake8` run from the root lints the virtual environment. Its header points at a
    workflow, but no workflow runs flake8. Add `.venv/` and a CI step, or drop the header line?
  * **CSV fixture line endings.** On Windows, both `gen:fixtures` scripts write their CSV fixtures with CRLF endings;
    git normalises them, so the diff stays empty. Open the CSV files with `newline=""` in the generators?

</div>
