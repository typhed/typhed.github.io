<div align = "center">

# Cloudflare Go-Live Checklist

</div>

<div align = "justify">

The owner's steps to put typhed.com, trading.typhed.com, and blog.typhed.com live on Cloudflare Workers with no
downtime. Work top to bottom; every step is reversible until the DNS records change in step 4.4. Branch
`cutover/routes` is the one commit that points the live hostnames at the Workers.

## 1. Before You Start

  - [ ] On a machine without network restrictions, run the gates with no workarounds:
    `pnpm install --frozen-lockfile && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
  - [ ] With a Clerk **development** key in the root `.env.local`, sign in on all three apps locally.
  - [ ] `typhed/typhed.project.data` reads `api.json`, `products.json`, and `profile.json`: point it at
    `packages/brand/` in this repository.

## 2. Prepare Cloudflare And GitHub

  - [ ] **Account ID:** Cloudflare dashboard -> Workers & Pages -> copy the Account ID from the right-hand panel.
  - [ ] **API token:** My Profile -> API Tokens -> Create Token -> template **Edit Cloudflare Workers** -> Account
    Resources: your account; Zone Resources: `typhed.com` -> Create, and copy the token once.
  - [ ] **Secrets:** `typhed/typhed.github.io` -> Settings -> Secrets and variables -> Actions -> New repository secret:
    `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
  - [ ] **Variables:** same page, Variables tab: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (the production key) and the
    blog's analytics values listed in `.env.example`. Every `NEXT_PUBLIC_*` Variable reaches every build.

## 3. Land The Branch And Check The Workers

  - [ ] Push `master` and `cutover/routes`: `git push origin master cutover/routes`.
  - [ ] The **Deploy to Cloudflare Workers** run publishes `typhed-web`, `typhed-trading`, and `typhed-blogging`. Each
    Worker's `*.workers.dev` URL is under Workers & Pages -> the Worker -> Settings -> Domains & Routes.
  - [ ] Open each `workers.dev` URL and check the header, footer, theme toggle, trading sidebar, `/about/`, a blog post,
    `/tools/ipo/`, `/budgeting/mnws/`, the 404 page, `/ads.txt` on the blog, and `/permalink/conduct.html` on web.
    Sign-in does not work on `workers.dev`: the production Clerk key only works on typhed.com hostnames.

## 4. Go Live, In This Order

  - [ ] **4.1 www redirect.** Rules -> Redirect Rules -> Create rule -> template **Redirect from WWW to root**:
    hostname equals `www.typhed.com`, dynamic target `concat("https://typhed.com", http.request.uri.path)`, status
    301, preserve query string.
  - [ ] **4.2 Routes.** Merge `cutover/routes` into `master`. Its run attaches `typhed.com/*`, `trading.typhed.com/*`,
    and `blog.typhed.com/*` to the Workers while the proxied DNS records stay in place, so there is no gap.
  - [ ] **4.3 Verify.** `curl -sI https://typhed.com/` (and the trading and blog hosts) shows no
    `x-github-request-id` header; `curl -sI https://www.typhed.com/` answers 301 to `https://typhed.com/`;
    `curl -sI https://typhed.com/permalink/conduct.html` answers 302 to the Code of Conduct. Sign in on typhed.com, then
    open trading.typhed.com: you are still signed in.
  - [ ] **4.4 DNS.** Cloudflare -> `typhed.com` -> DNS -> Records. Replace the apex records that point at GitHub
    (A `185.199.108.153` to `185.199.111.153`, AAAA `2606:50c0:8000::153` to `2606:50c0:8003::153`) with one
    `AAAA @ 100::` record, Proxied. Edit `www`, `trading`, and `blog` (CNAME `typhed.github.io`) to `AAAA 100::`,
    Proxied. Leave `clerk`, `accounts`, mail, and verification records untouched.
  - [ ] **4.5 Purge.** Caching -> Configuration -> Purge Everything.

## 5. Turn Off GitHub Pages

  - [ ] `typhed/typhed.github.io`: Settings -> Pages -> remove the custom domain and unpublish the site; Settings ->
    Environments -> delete `github-pages`.
  - [ ] `typhed/blog.typhed.com` and `typhed/trading.typhed.com`: Actions -> the Pages workflow -> Disable workflow;
    Settings -> Pages -> remove the custom domain and unpublish.
  - [ ] Organisation Settings -> Pages -> Verified domains: keep `typhed.com` verified, so nobody else can claim its
    hostnames on GitHub Pages.

## 6. Clean Up

  - [ ] Delete the old tags and releases.
  - [ ] After a stable week, archive `typhed/blog.typhed.com`, `typhed/trading.typhed.com`, `typhed/shared.documents`,
    and `typhed/shared.components` (Settings -> General -> Danger Zone -> Archive this repository). Archived
    repositories stay readable, so old links keep working.

## 7. Redeploy And Roll Back

  - [ ] **Redeploy:** Actions -> Deploy to Cloudflare Workers -> Run workflow -> `apps` = `all` (or `web`, `trading`,
    `blogging`).
  - [ ] **Deploy from a machine:** `pnpm build`, then `pnpm --filter <app> exec wrangler deploy` with
    `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set.
  - [ ] **Roll back:** Workers & Pages -> the Worker -> Deployments -> Rollback, or
    `pnpm --filter <app> exec wrangler rollback`.
  - [ ] **Take one site off its Worker:** Workers & Pages -> the Worker -> Settings -> Domains & Routes -> delete its
    route.

</div>
