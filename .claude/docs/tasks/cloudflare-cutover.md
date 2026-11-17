<div align = "center">

# Cloudflare Cutover Checklist

</div>

<div align = "justify">

The owner's steps to move typhed.com, trading.typhed.com, and blog.typhed.com from GitHub Pages to Cloudflare
Workers with no downtime, then retire the old repositories. Work top to bottom; every step is reversible until the
DNS records change in step 4.4. The code side is finished on branch `monorepo`; branch `cutover/routes` is the
one-commit switch that points the live hostnames at the Workers.

## 1. Repositories Merged Into This Monorepo

Every commit of these repositories is part of this repository's history with its original SHA, message, and author.
Archive them only after the sites have run from Cloudflare for a stable week (step 7).

<div align = "center">

| Repository | Merged Ref | Tip SHA | Now Lives In |
| :---: | :---: | :---: | --- |
| `typhed/blog.typhed.com` | `master` | `db4b25b` | `apps/blogging` |
| `typhed/trading.typhed.com` | `reviews/20260719` | `fc01566` | `apps/trading`, trading `packages/*` |
| `typhed/shared.documents` | `master` | `6d2dbc4` | `packages/brand`, `docs/brand`, `docs/data`, `docs/design` |
| `typhed/shared.components` | `master` | `9d26b78` | `packages/ui`, `packages/config-*`, `docs/components` |

</div>

Not merged: the seven Dependabot branches of the blog (bot bumps against the old layout) and every tag.

  - [ ] `typhed/typhed.project.data` reads `brand/api.json`, `brand/products.json`, and `brand/profile.json` from a
    `shared.documents` checkout. Point it at `packages/brand/` in `typhed/typhed.github.io` before archiving
    `shared.documents`, or it keeps reading frozen data.

## 2. Prepare Cloudflare And GitHub

  - [ ] **Account ID:** Cloudflare dashboard -> Workers & Pages -> copy the Account ID from the right-hand panel.
  - [ ] **API token:** My Profile -> API Tokens -> Create Token -> template **Edit Cloudflare Workers** -> Account
    Resources: your account; Zone Resources: `typhed.com` -> Create, and copy the token once.
  - [ ] **Secrets:** `typhed/typhed.github.io` -> Settings -> Secrets and variables -> Actions -> New repository secret:
    `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
  - [ ] **Variables:** same page, Variables tab. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` already exists (the production
    key). Copy every `NEXT_PUBLIC_*` Variable from `typhed/blog.typhed.com` (the Google Analytics, AdSense, Clarity, and
    site-verification values the blog uses). Every `NEXT_PUBLIC_*` Variable reaches every build automatically.
  - [ ] **Merge method:** Settings -> General -> Pull Requests -> keep **Allow merge commits** enabled.

## 3. Land The Branch And Check The Workers

  - [ ] Push and merge: `git push origin monorepo`, open a pull request into `master`, and merge it with **Create a
    merge commit**. Never use Squash or Rebase: both rewrite the imported history. A local fast-forward works too:
    `git switch master && git merge --ff-only monorepo && git push origin master`.
  - [ ] The **Deploy to Cloudflare Workers** run publishes `typhed-web`, `typhed-trading`, and `typhed-blogging`. Each
    Worker's `*.workers.dev` URL is under Workers & Pages -> the Worker -> Settings -> Domains & Routes.
  - [ ] Open each `workers.dev` URL: the same header and footer on all three, the trading sidebar expanded and
    collapsible, `/about/` on web, a post under `/blog/` on blogging, `/tools/ipo/` and `/budgeting/mnws/` on trading,
    an unknown path showing the 404 page, `/ads.txt` on blogging, and `/permalink/conduct.html` on web redirecting to
    the Code of Conduct. Sign-in does not work on `workers.dev`: the production Clerk key only works on typhed.com
    hostnames, which is expected.

## 4. Cut Over, In This Order

  - [ ] **4.1 www redirect first.** Rules -> Redirect Rules -> Create rule -> template **Redirect from WWW to root**:
    hostname equals `www.typhed.com`, dynamic target `concat("https://typhed.com", http.request.uri.path)`, status
    301, preserve query string. GitHub Pages does this today; the rule must exist before Pages stops.
  - [ ] **4.2 Routes.** Merge branch `cutover/routes` into `master`. Its run attaches `typhed.com/*`,
    `trading.typhed.com/*`, and `blog.typhed.com/*` to the three Workers. The existing proxied DNS records stay, so
    traffic moves to the Workers with no gap.
  - [ ] **4.3 Verify.** `curl -sI https://typhed.com/` (and the trading and blog hosts) shows no
    `x-github-request-id` header; `curl -sI https://www.typhed.com/` answers 301 to `https://typhed.com/`;
    `curl -sI https://typhed.com/permalink/conduct.html` answers 302 to the Code of Conduct. Sign in on typhed.com,
    then open trading.typhed.com: you are still signed in.
  - [ ] **4.4 DNS.** Cloudflare -> `typhed.com` -> DNS -> Records. Delete the apex records that point at GitHub Pages
    (A `185.199.108.153` to `185.199.111.153`, AAAA `2606:50c0:8000::153` to `2606:50c0:8003::153`) and add one
    `AAAA @ 100::` record, Proxied. Edit `www`, `trading`, and `blog` (CNAME `typhed.github.io`) to `AAAA 100::`,
    Proxied. Leave `clerk`, `accounts`, mail, and verification records untouched.
  - [ ] **4.5 Purge.** Caching -> Configuration -> Purge Everything.

## 5. Stop GitHub Pages

  - [ ] `typhed/typhed.github.io`: Settings -> Pages -> remove the custom domain, then unpublish the site;
    Settings -> Environments -> delete `github-pages`.
  - [ ] `typhed/blog.typhed.com` and `typhed/trading.typhed.com`: Actions -> the Pages deploy workflow -> Disable
    workflow; Settings -> Pages -> remove the custom domain and unpublish.
  - [ ] Organisation Settings -> Pages -> Verified domains: keep `typhed.com` verified (add the TXT record GitHub
    shows if it is missing), so nobody else can claim the hostnames on GitHub Pages.

## 6. Tags And Releases

  - [ ] Delete the old tags and releases in each repository (the owner's own step; none were carried over).

## 7. Archive The Old Repositories (After A Stable Week)

  - [ ] Settings -> General -> Danger Zone -> **Archive this repository** for `blog.typhed.com`,
    `trading.typhed.com`, `shared.documents`, and `shared.components`. Archived repositories stay readable, so old
    links keep working.

## 8. Restart, Redeploy, Roll Back

  - [ ] **Redeploy:** Actions -> Deploy to Cloudflare Workers -> Run workflow -> `apps` = `all` (or `web`, `trading`,
    `blogging`).
  - [ ] **Deploy from a machine:** `pnpm build`, then `pnpm --filter <app> exec wrangler deploy` with
    `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set.
  - [ ] **Roll back:** Workers & Pages -> the Worker -> Deployments -> Rollback, or
    `pnpm --filter <app> exec wrangler rollback`.
  - [ ] **Take one site off the Worker:** Workers & Pages -> the Worker -> Settings -> Domains & Routes -> delete its
    route.

## 9. View The Sites Locally

  - [ ] Once: `corepack enable` and `pnpm install` at the repository root. Python 3.13 with
    `pip install -r permalink/requirements.txt` is needed for the web build.
  - [ ] Copy `.env.example` to `.env.local` at the repository root and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to the
    Clerk **development** key; the production key only works on typhed.com hostnames. One file configures all three
    apps.
  - [ ] Development servers: `pnpm dev` starts web on `http://localhost:3000`, trading on `http://localhost:3001`, and
    blogging on `http://localhost:3002`. One app: `pnpm --filter trading dev`.
  - [ ] Production preview, exactly as Cloudflare serves it: `pnpm build`, then `pnpm --filter web preview`
    (`http://localhost:8787`), `pnpm --filter trading preview` (`8788`), `pnpm --filter blogging preview` (`8789`).

</div>
