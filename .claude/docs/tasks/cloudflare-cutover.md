<div align = "center">

# Cloudflare Go-Live Checklist

</div>

<div align = "justify">

The owner's steps to move typhed.com, trading.typhed.com, and blog.typhed.com from GitHub Pages to their Cloudflare
Workers. The sites are a work in progress with no real users, so a short outage is acceptable and the whole move fits in
one sitting. The order below still avoids an outage, at no extra cost: all four hostnames are already proxied through
Cloudflare, so the Workers take over the moment their routes attach, before any DNS record changes. Each app's
`wrangler.jsonc` on `master` carries its route, so the next push of `master` is the switch.

## Where Things Stand

  - [x] The gates pass on the owner's machine (2026-11-17), with the results in
    [owner-machine-checks.md](owner-machine-checks.md).
  - [x] **First look.** On 2026-11-17 the three Workers went up from the owner's machine on the account's `workers.dev`
    subdomain, `typhed-main`, at `https://typhed-<app>.typhed-main.workers.dev`. Every page check in step 2 passes
    there in both themes and at phone width, apart from the prefetch 404s of a Windows build. The pipeline builds on
    Linux and has none.
  - [x] typhed.com, `www`, `trading`, and `blog` resolve through the Cloudflare proxy to GitHub Pages, which also
    answers the 301 from `www` to the apex. The `clerk` and `accounts` records point at Clerk (checked 2026-11-17).

## 1. Prepare, With Nothing Visible Changing

  - [x] **Clerk users.** Neither instance, production or development, has any users (2026-11-17). All five DNS records
    of the production instance resolve to Clerk: `clerk`, `accounts`, `clkmail`, `clk._domainkey`, and
    `clk2._domainkey`.
  - [ ] **Clerk setup.** Finish the production instance's remaining setup task in the dashboard. With social sign-in
    on, production needs your own OAuth credentials for each provider, while development borrows Clerk's shared ones.
    Copy the production publishable key (`pk_live_...`). Step 2 tests sign-in on typhed.com, so a local check with the
    development key (`pk_test_...` in the root `.env.local`) is optional.
  - [ ] **API token.** Cloudflare: My Profile -> API Tokens -> Create Token -> template **Edit Cloudflare Workers** ->
    Account Resources: the HUF account; Zone Resources: `typhed.com` -> Create, and copy the token once.
  - [ ] **Secrets.** `typhed/typhed.github.io` -> Settings -> Secrets and variables -> Actions -> New repository secret:
    `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCOUNT_ID` with the Account ID from the Workers & Pages page.
  - [ ] **Variables.** Same page, Variables tab: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` with the production key. The deploy
    stops without it. Leave out the blog's analytics Variables until the analytics question in [gaps.md](../gaps.md)
    has an answer, because every `NEXT_PUBLIC_*` Variable reaches every build.
  - [ ] **www redirect.** Rules -> Redirect Rules -> Create rule -> template **Redirect from WWW to root**: hostname
    equals `www.typhed.com`, dynamic target `concat("https://typhed.com", http.request.uri.path)`, status 301, preserve
    query string. The edge then answers the same 301 that GitHub Pages sends today.
  - [ ] **Account backend.** `typhed/typhed.project.data` reads `api.json`, `products.json`, and `profile.json`: point
    it at `packages/brand/` in this repository.

## 2. Go Live With One Push

  - [ ] **Push.** `git push origin master`, once step 1 is done. `master` already carries the routes, so this push is
    the switch: CI runs the gates, and **Deploy to Cloudflare Workers** builds the three apps on Linux and publishes
    them with their routes. Each hostname switches to its Worker as its deploy finishes. If the run fails before a
    deploy, GitHub Pages keeps serving that site.
  - [ ] **Verify.** `curl -sI https://typhed.com/`, and the same for `trading.typhed.com` and `blog.typhed.com`, shows
    `server: cloudflare` and no `x-github-request-id` header. `curl -sI https://www.typhed.com/` answers 301 to
    `https://typhed.com/`, and `curl -sI https://typhed.com/permalink/conduct.html` answers 302 to the Code of Conduct.
    In a browser, check the header, footer, theme toggle, trading sidebar, `/about/`, a blog post, `/tools/ipo/`,
    `/budgeting/mnws/`, the 404 page, and `/ads.txt` on the blog.
  - [ ] **Sign-in.** Sign up with a fresh test account on typhed.com, then open trading.typhed.com and blog.typhed.com:
    you are still signed in. Delete the account afterwards if you like.

## 3. Take GitHub Out Of The Path

  - [ ] **DNS.** Cloudflare -> `typhed.com` -> DNS -> Records. Replace the apex records that point at GitHub
    (A `185.199.108.153` to `185.199.111.153`, AAAA `2606:50c0:8000::153` to `2606:50c0:8003::153`) with one
    `AAAA @ 100::` record, Proxied. Edit `www`, `trading`, and `blog` (CNAME `typhed.github.io`) to `AAAA 100::`,
    Proxied. The routes answer before any origin, so visitors see no change. Leave every Clerk record (`clerk`,
    `accounts`, and the `clk` mail records), the mail records, and the verification records untouched.
  - [ ] **Purge.** Caching -> Configuration -> Purge Everything.

## 4. Turn Off GitHub Pages

  - [ ] `typhed/typhed.github.io`: Settings -> Pages -> remove the custom domain and unpublish the site; Settings ->
    Environments -> delete `github-pages`.
  - [ ] `typhed/blog.typhed.com` and `typhed/trading.typhed.com`: Actions -> the Pages workflow -> Disable workflow;
    Settings -> Pages -> remove the custom domain and unpublish.
  - [ ] Organisation Settings -> Pages -> Verified domains: keep `typhed.com` verified, so nobody else can claim its
    hostnames on GitHub Pages.

## 5. Retire The Merged Repositories

This monorepo holds the code of four older repositories, so they can retire. Archive them rather than delete them: an
archived repository stays readable, so old links, issues, and releases keep working, while deleting removes all of that
for good. Do it after step 4, because the two product repositories serve their subdomains until then.

  - [ ] Archive `typhed/blog.typhed.com` and `typhed/trading.typhed.com` (Settings -> General -> Danger Zone -> Archive
    this repository).
  - [ ] Archive `typhed/shared.components` and `typhed/shared.documents`.
  - [ ] Delete the old tags and releases of `typhed/typhed.github.io`.

These stay: `typhed/typhed.github.io` (this monorepo), `typhed/typhed.project.data` (the account backend's data,
repointed in step 1), and the organisation's `.github` and `.github-private` repositories.

## 6. Redeploy And Roll Back

  * **Redeploy:** Actions -> Deploy to Cloudflare Workers -> Run workflow -> `apps` = `all` (or `web`, `trading`,
    `blogging`).
  * **Deploy from a machine:** `pnpm build`, then `pnpm --filter <app> exec wrangler deploy`, after
    `pnpm exec wrangler login` or with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set. A build on Windows
    carries the prefetch-name issue in [owner-machine-checks.md](owner-machine-checks.md), so prefer the workflow.
  * **Roll back:** Workers & Pages -> the Worker -> Deployments -> Rollback, or
    `pnpm --filter <app> exec wrangler rollback`.
  * **Take one site off its Worker:** Workers & Pages -> the Worker -> Settings -> Domains & Routes -> delete its
    route. Before step 3 the site falls back to GitHub Pages; after it, the hostname has nothing to serve.
  * **Drop the `workers.dev` copies:** once the sites run on their hostnames, `"workers_dev": false` in each
    `wrangler.jsonc` removes the `typhed-main.workers.dev` addresses, if you no longer want them.

</div>
