<div align = "center">

# Deployment

</div>

<div align = "justify">

How the sites reach production. Read this before touching `.github/workflows/` or any `wrangler.jsonc`.

## Decisions

  * 2026-11-17: each app deploys as an assets-only Cloudflare Worker serving its static export, because the apps have
    no server code and the `typhed.com` zone already runs on Cloudflare.
  * 2026-11-17: one GitHub Actions workflow deploys on push to `master` (plus manual dispatch), discovers every
    `apps/*/wrangler.jsonc`, and deploys only affected apps, because a new subdomain then needs no workflow edit.
  * 2026-11-17: cutover uses Workers Routes on the existing proxied hostnames, then switches their DNS records to
    originless placeholders, because routes take traffic with no gap; `www` redirects to the apex with a Redirect Rule.
  * 2026-11-17: `/permalink/<key>` keeps its HTML redirect pages and also gets a `_redirects` 302 rule, because
    `/permalink/conduct.html` is a live URL that must keep working whatever the asset `html_handling` does.

</div>
