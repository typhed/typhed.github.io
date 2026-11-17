<div align = "center">

# ADR 2026-11-17: Deployment On Cloudflare Workers

</div>

<div align = "justify">

<div align = "center">

| Status | Date | Scope |
| :---: | :---: | :---: |
| Accepted | 2026-11-17 | Hosting and CI |

</div>

## Context

Each site deployed through its own GitHub Pages workflow: two on a published release, one on every push. The
`typhed.com` zone already runs on Cloudflare. Every site is a static export with no server code, and the public URL
`/permalink/conduct.html` must keep working.

## Decision

  * Each app deploys as an assets-only Cloudflare Worker (`typhed-web`, `typhed-trading`, `typhed-blogging`) that
    serves its static export.
  * One GitHub Actions workflow deploys on push to `master` and on manual dispatch. It discovers every
    `apps/*/wrangler.jsonc` and deploys the apps Turborepo marks as affected.
  * The cutover attaches Workers Routes to the existing proxied hostnames, then points their DNS records at
    originless placeholders. A Cloudflare Redirect Rule sends `www` to the apex.
  * The permalink generator writes a `_redirects` 302 rule next to each HTML redirect page.

## Consequences

  * A new subdomain needs an app folder with a `wrangler.jsonc` and no workflow change.
  * Traffic moves to the Workers with no gap, and removing a route steps a site back.
  * `/permalink/conduct.html` answers one edge 302, whatever the asset `html_handling` does.
  * Deploys need the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets in the repository.

</div>
