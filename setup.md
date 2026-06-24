<div align = "center">

# Hosting Setup Guide

</div>

<div align = "justify">

This guide takes the finished website live at `typhed.com` using GitHub Pages and your Cloudflare account. It is written for someone who has not configured hosting before, so each step says exactly what to click and type. Work through the parts in order. The whole process is mostly waiting for DNS and certificates, so set aside about an hour, most of which is idle.

Before you start, confirm two facts. The repository is `github.com/typhed/typhed.github.io`, which is your account home page repository, so it serves the root of the domain. The domain `typhed.com` is already in your Cloudflare account.

## How The Pieces Fit Together

  * Your code lives in GitHub. A GitHub Actions workflow builds the static site and publishes it to GitHub Pages automatically on every push to `master`.
  * GitHub Pages serves the files and provides a free HTTPS certificate for your custom domain.
  * Cloudflare holds the DNS for `typhed.com` and points the domain at GitHub Pages.

You do not run any build yourself for production. Pushing to `master` is the deploy.

---

## Part 1 - Turn On GitHub Pages

This is a one time setting.

  1. Open `https://github.com/typhed/typhed.github.io` in your browser.
  2. Click **Settings**, then in the left sidebar click **Pages**.
  3. Under **Build and deployment**, set **Source** to **GitHub Actions**. Do not pick a branch. The workflow in this repository already knows how to publish.
  4. Push any commit to `master`, or open the **Actions** tab and run the **Deploy main site to GitHub Pages** workflow with the **Run workflow** button.
  5. Wait for the workflow to finish with a green check. Your site is now live at the temporary address `https://typhed.github.io`. Open it to confirm the page looks right before adding the domain.

## Part 2 - Tell GitHub About Your Domain

The file [apps/web/public/CNAME](../apps/web/public/CNAME) already contains `typhed.com`, so the domain stays attached on every deploy. You still set it once in the interface so GitHub requests the HTTPS certificate.

  1. Back in **Settings**, then **Pages**.
  2. In the **Custom domain** box, type `typhed.com` and click **Save**.
  3. GitHub now runs a DNS check. It will fail until you finish Part 3. That is expected. Leave this tab open.

## Part 3 - Point Cloudflare At GitHub Pages

Now you add the DNS records in Cloudflare. The most important detail for beginners is the grey cloud. During setup, every record must be **DNS only**, not **Proxied**, so that GitHub can verify the domain and issue the certificate. You can switch the proxy on later.

  1. Log in to Cloudflare and select the `typhed.com` domain.
  2. Open the **DNS** section in the left sidebar.
  3. Add the apex record. Cloudflare can point the root of your domain at GitHub using a feature called CNAME flattening.

| Field | Value |
| :---: | --- |
| Type | `CNAME` |
| Name | `@` |
| Target | `typhed.github.io` |
| Proxy status | DNS only (grey cloud) |

  4. Add the `www` record so the `www` version also works.

| Field | Value |
| :---: | --- |
| Type | `CNAME` |
| Name | `www` |
| Target | `typhed.github.io` |
| Proxy status | DNS only (grey cloud) |

If Cloudflare does not allow a CNAME at the apex on your plan, delete that record and add these four **A** records instead, all with name `@` and proxy status DNS only. They are the official GitHub Pages addresses.

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

  5. Set the encryption mode. Open **SSL/TLS**, then **Overview**, and choose **Full**. Never choose **Flexible**, because it causes an endless redirect loop with GitHub Pages.

## Part 4 - Wait, Then Lock In HTTPS

  1. Go back to the GitHub **Pages** settings tab. Within a few minutes to an hour the DNS check turns green and a message says the certificate is being created.
  2. Once the **Enforce HTTPS** checkbox is no longer greyed out, tick it. This makes every visitor use a secure connection.
  3. Visit `https://typhed.com`. You should see the site with a padlock in the address bar.

If it is not ready yet, wait and refresh. Certificate creation sometimes takes up to an hour the first time.

## Part 5 - Optional Cloudflare Polish

These steps are nice to have once the site works.

  * **Turn the proxy on.** In Cloudflare DNS you can switch the records to **Proxied** (orange cloud) for caching and analytics. Keep SSL/TLS on **Full**. If anything breaks, switch back to DNS only.
  * **Always use HTTPS.** Under **SSL/TLS**, then **Edge Certificates**, turn on **Always Use HTTPS**.
  * **Send www to the root.** Under **Rules**, add a redirect so `www.typhed.com` forwards to `typhed.com`, which keeps a single clean address.

## Part 6 - Help People Find It

To make a search for "Debmalya Pramanik HUF" return your site, tell Google it exists.

  1. Open [Google Search Console](https://search.google.com/search-console) and add `typhed.com` as a property.
  2. Verify ownership. The DNS TXT record method is easiest, since you already control Cloudflare DNS.
  3. Submit your sitemap by entering `sitemap.xml` in the **Sitemaps** section. The site already publishes one at `https://typhed.com/sitemap.xml`.

Indexing takes days, not minutes. The structured data already built into the page helps Google connect the site to the brand name.

---

## Understanding Subdomains And Future Product Sites

You asked how to register a subdomain such as `products.typhed.com`. Here is the plain answer and the common practice.

### You Do Not Register Subdomains

A subdomain is not something you buy or register with a registrar. You already own `typhed.com`. A subdomain is simply a new DNS record inside that domain, created in Cloudflare in seconds. For example, a record named `products` creates `products.typhed.com`. That is the entire idea.

### Why The Main Site And A Product Site Are Separate Repositories

GitHub Pages serves one website per repository, and each repository can carry only one custom domain through its `CNAME` file. So `typhed.com` is served by this repository, and a product site at `products.typhed.com` needs its own repository with its own `CNAME` file containing `products.typhed.com`. This is the standard pattern, and it is why a `products` host under `github.io` itself is not possible.

The recommended professional setup keeps a single source monorepo (this one) and lets the build send each app to its own GitHub Pages repository. The source stays together, while the published sites stay independent.

### Steps To Add products.typhed.com Later

When you have real product content, do this.

  1. In this monorepo, create `apps/products` as a copy of `apps/web`. Have its page import from `@typhed/ui` so it reuses the same components. Put `products.typhed.com` in its `public/CNAME`.
  2. Create a second GitHub repository, for example `typhed/typhed-products`, and turn on GitHub Pages with **Source** set to **GitHub Actions**.
  3. Add a deploy step that publishes the built `apps/products/out` into that second repository. The action `JamesIves/github-pages-deploy-action` does this with a deploy key or token.
  4. In Cloudflare DNS, add one record, DNS only at first.

| Field | Value |
| :---: | --- |
| Type | `CNAME` |
| Name | `products` |
| Target | `typhed.github.io` |
| Proxy status | DNS only (grey cloud) |

  5. In the second repository's **Pages** settings, set the custom domain to `products.typhed.com`, wait for the certificate, and enforce HTTPS, exactly as in Parts 2 and 4.

### A Simpler Alternative

If managing two repositories feels heavy, two other paths exist.

  * **Path based.** Serve the products section at `typhed.com/products` from this single repository. No second repository and no extra DNS, but the address is a path, not a subdomain.
  * **Cloudflare Pages.** Cloudflare can build the monorepo directly and host multiple projects, each on its own subdomain, from this one repository. Since you already use Cloudflare, this is the cleanest way to get true subdomains without juggling GitHub repositories.

---

## Troubleshooting

| Symptom | Likely Cause And Fix |
| :---: | --- |
| GitHub DNS check stays red | A record is still Proxied. Set every record to DNS only while GitHub verifies. |
| Browser shows a redirect loop | SSL/TLS mode is Flexible. Change it to Full in Cloudflare. |
| Site loads but assets are missing | The custom domain changed. Confirm `apps/web/public/CNAME` still reads `typhed.com` and redeploy. |
| Enforce HTTPS is greyed out | The certificate is not ready yet. Wait up to an hour and refresh the Pages settings. |
| Old content keeps showing | Cloudflare cache. Under Caching, use **Purge Everything** once. |

</div>
