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

## Part 7 - Add Login And Sign Up With Clerk

The **Login / Sign Up** button in the top bar is powered by [Clerk](https://clerk.com), a managed service that handles accounts and sign-in for you. Because this homepage is a static export with no server, Clerk runs entirely in the browser using a single **public** key. There is no secret to guard and no server to run. These steps make the button work on your computer first, then on the live site.

The application already exists in Clerk; its id is `app_3FoX5bGicBgpEdV4YrQFAredA7k`. Each Clerk application has two instances: a **development** one for `localhost` and a **production** one for `typhed.com`. They have different keys, so you will use one key on your computer and a different key on the live site.

  1. Get your key. Open [the Clerk Dashboard](https://dashboard.clerk.com), select this application, then open **Configure**, then **API keys**. Copy the **Publishable key** (it begins with `pk_test_` for development). Leave the **Secret key** untouched, because this project never uses it.
  2. Create your local key file. From the repo root, copy the example file:

```shell
$ cp apps/web/.env.example apps/web/.env.local
```

  3. Paste your development key into `apps/web/.env.local` after the `=` sign. This file is git-ignored, so the key is never committed.

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

  4. Start the site with `$ pnpm dev`, open `http://localhost:3000`, and click **Login / Sign Up**. Clerk's window opens. Create your first account. When it succeeds, the button becomes your profile avatar.

The key is required to build the site. If it is missing, the build stops on purpose with the message `Missing publishableKey`, so a broken button can never ship.

## Part 8 - Test From Your Localhost With ngrok

Some parts of authentication only work over a real public address. Social sign-in callbacks need one, and Clerk webhooks (Part 10) have to reach your machine from the internet. [ngrok](https://ngrok.com) solves this by giving `localhost:3000` a temporary public HTTPS URL, so you can try the whole flow before anything is deployed.

  1. Create a free ngrok account, then register your authtoken once. After installing ngrok, run `$ ngrok config add-authtoken <your-token>`. You only do this on the first use.
  2. Start the site in one terminal:

```shell
$ pnpm dev
```

  3. Open a second terminal and point ngrok at the dev server's port:

```shell
$ ngrok http 3000
```

  4. ngrok prints a forwarding URL such as `https://lively-otter-1234.ngrok-free.app`. Open it in any browser. The homepage loads from your machine, and **Login / Sign Up** runs against your Clerk development instance exactly as it does on `localhost`.

A free ngrok URL changes every time you restart it. If you reserve a free **static domain** in the ngrok dashboard, you can keep one fixed address with `$ ngrok http --url=<your-domain>.ngrok-free.app 3000`, which saves you from re-pasting the URL into Clerk after each restart. If a social provider rejects the ngrok address, add that domain to the allowed origins for your development instance in the Clerk Dashboard.

## Part 9 - Take Clerk Live On typhed.com

Once the button works locally, going live takes two things: the production key inside the deployed build, and Clerk pointed at your real domain.

  1. Give GitHub Actions the production key. Open `https://github.com/typhed/typhed.github.io`, then **Settings**, then **Secrets and variables**, then **Actions**. On the **Variables** tab, click **New repository variable**, name it `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and paste your **production** key (it begins with `pk_live_`). A publishable key is public, so a Variable, not a Secret, is the right place for it. The deploy workflow already reads this variable when it builds.
  2. Point Clerk at the domain. In the Clerk Dashboard, switch the application to its **Production** instance, open **Configure**, then **Domains**, and enter `typhed.com`.
  3. Add the DNS records Clerk gives you. They are CNAME records on names such as `clerk` and `accounts`, plus a couple of mail records. In Cloudflare **DNS**, add each one exactly as shown and set it to **DNS only (grey cloud)** while Clerk verifies, the same rule as Part 3.
  4. Wait for Clerk to mark every record as verified. Like the GitHub certificate in Part 4, this can take a few minutes to an hour.
  5. Publish a GitHub Release to deploy the site, the same trigger described in Parts 1 and 4. Then open `https://typhed.com`, sign in, and confirm your avatar appears.

The deployed build needs that Variable. If it is missing, the build stops with `Missing publishableKey` instead of shipping a dead button, which is the safer failure.

## Part 10 - Sync Clerk Users To Your Database With Webhooks

Clerk owns the account, but your own features (saved data, roles, billing) need a matching user row in your database. Webhooks keep the two in step: Clerk calls an endpoint of yours whenever a user is created, updated, or deleted, and your code writes that change. The official walkthrough is [Clerk's syncing guide](https://clerk.com/docs/guides/development/webhooks/syncing).

This receiver is a small server, so it lives outside the static homepage, for the same reason the product subdomains below do. The example below is Python on Flask. It verifies that each request genuinely came from Clerk using Clerk's webhook signatures, which are powered by [Svix](https://www.svix.com), then mirrors the change into a `users` table.

First, register the endpoint in Clerk.

  1. In the Clerk Dashboard, open **Webhooks**, then **Add Endpoint**.
  2. In **Endpoint URL**, paste your public URL followed by `/api/webhooks`. Use your ngrok URL from Part 8 while testing, and your server's real URL in production.
  3. Under **Subscribe to events**, select `user.created`, `user.updated`, and `user.deleted`, then select **Create**.
  4. Open the new endpoint, copy its **Signing Secret** (it begins with `whsec_`), and store it in the service's environment as `CLERK_WEBHOOK_SIGNING_SECRET`.

Then create the receiver as `clerk_sync.py`.

```python
# -*- encoding: utf-8 -*-

"""
Clerk Webhook Receiver - Sync Users To The Application Database

A minimal Flask service that receives Clerk user webhooks, verifies their
Svix signature, and mirrors the user record into the application's own
database. Clerk emits `user.created`, `user.updated` and `user.deleted`
events; this service upserts on the first two and removes the row on the
last, keeping the local `users` table in step with Clerk.

Run it behind a public HTTPS URL (ngrok in development, a real host in
production) and register that URL as the endpoint in the Clerk Dashboard.

:NOTE: The signing secret is read from `CLERK_WEBHOOK_SIGNING_SECRET`, and
    the route must stay public so Clerk can reach it.
"""

import os

from flask import Flask, Response, request
from svix.webhooks import Webhook, WebhookVerificationError

app = Flask(__name__)

SIGNING_SECRET : str = os.environ["CLERK_WEBHOOK_SIGNING_SECRET"]


def upsert_user(user : dict) -> None:
    """
    Insert or update one user in the application database.

    Maps the Clerk user payload onto the local `users` table. Replace the
    body with a real query for your database, for example a parameterised
    `INSERT ... ON CONFLICT` for PostgreSQL.

    :type  user: dict
    :param user: The `data` object from a Clerk `user.created` or
        `user.updated` event.

    :rtype: None
    :returns: Nothing; the row is written as a side effect.
    """

    clerk_id : str = user["id"]
    primary_id = user.get("primary_email_address_id")
    email : str | None = next(
        (
            address["email_address"]
            for address in user.get("email_addresses", [])
            if address["id"] == primary_id
        ),
        None,
    )

    # ! replace this with a real, parameterised write for your database
    print(f"upsert {clerk_id} <{email}>")


def delete_user(clerk_id : str) -> None:
    """
    Remove one user from the application database.

    :type  clerk_id: str
    :param clerk_id: The Clerk user id from a `user.deleted` event.

    :rtype: None
    :returns: Nothing; the row is deleted as a side effect.
    """

    # ! replace with a real DELETE, or set a `deleted = true` flag instead
    print(f"delete {clerk_id}")


@app.post("/api/webhooks")
def clerk_webhook() -> Response:
    """
    Receive, verify, and dispatch a single Clerk webhook event.

    Verifies the Svix signature on the raw request body, then routes the
    event to the matching database operation. A bad signature returns
    `400`; an unhandled event still returns `200` so Clerk does not retry.

    :rtype:   flask.Response
    :returns: An empty `2xx` response on success, `400` on a bad signature.
    """

    headers = {
        "svix-id" : request.headers.get("svix-id", ""),
        "svix-timestamp" : request.headers.get("svix-timestamp", ""),
        "svix-signature" : request.headers.get("svix-signature", ""),
    }

    try:
        event : dict = Webhook(SIGNING_SECRET).verify(request.data, headers)
    except WebhookVerificationError:
        return Response("invalid signature", status = 400)

    event_type : str = event["type"]
    data : dict = event["data"]

    if event_type in ("user.created", "user.updated"):
        upsert_user(data)
    elif event_type == "user.deleted":
        delete_user(data["id"])

    return Response(status = 200)
```

Finally, run it and connect the two.

  5. Install the dependencies:

```shell
$ pip install flask svix
```

  6. Set the secret and start the server on its own port:

```shell
$ export CLERK_WEBHOOK_SIGNING_SECRET=whsec_your_secret_here
$ flask --app clerk_sync run --port 4000
```

  7. Expose that port with ngrok, as in Part 8, and paste the resulting URL plus `/api/webhooks` into the endpoint you registered:

```shell
$ ngrok http 4000
```

Create a test user in the app and watch the `user.created` event arrive and `upsert_user` run. Keep the route public and answer quickly with a `2xx`. If the handler returns a `4xx` or `5xx`, Clerk retries the event later.

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

### Single Sign-On Across Subdomains With Clerk

When you add product subdomains later, you will usually want one login to cover all of them, so a visitor who signs in on `typhed.com` stays signed in everywhere. Clerk does this with a feature called **satellite domains**.

The shape is simple. One Clerk application serves every site. `typhed.com` is the **primary domain**, the one you set up in Part 9, and each product subdomain joins that same application as a **satellite**. Sign-in always happens on the primary domain's Clerk screens, and the visitor is then recognised on every satellite. One account, one session, every subdomain.

There is a catch worth knowing now. This homepage signs people in entirely in the browser, because it is a static export with no server. A real product behind a subdomain usually has to check the login on the server to protect private pages and data, and a static GitHub Pages export cannot do that. So a product subdomain belongs on a host that runs server code:

  * **Cloudflare Pages or Workers.** You already use Cloudflare, and it runs the small amount of server code Clerk needs at the edge. This pairs naturally with the Cloudflare Pages option above.
  * **Vercel.** The company behind Next.js runs Clerk's server features with no extra setup.

The homepage itself stays on GitHub Pages either way. When you build a product subdomain, the outline is:

  1. In the Clerk Dashboard, under **Configure**, then **Domains**, add the subdomain as a **satellite** and add the DNS records it shows you in Cloudflare, the same DNS-only routine as Part 3 and Part 9.
  2. Configure that app as a satellite: it shares the same publishable key, marks itself as a satellite, names its own domain, and points its sign-in link back to `typhed.com`. Clerk's documentation on [satellite domains](https://clerk.com/docs) lists the exact settings.
  3. Because that app runs on a server, it can use Clerk's full server-side protection, the middleware and `auth()` checks that this static homepage deliberately leaves out.

That difference in hosting is the real reason the homepage and a product subdomain stay separate projects: they share one login but have different needs.

---

## Troubleshooting

| Symptom | Likely Cause And Fix |
| :---: | --- |
| GitHub DNS check stays red | A record is still Proxied. Set every record to DNS only while GitHub verifies. |
| Browser shows a redirect loop | SSL/TLS mode is Flexible. Change it to Full in Cloudflare. |
| Site loads but assets are missing | The custom domain changed. Confirm `apps/web/public/CNAME` still reads `typhed.com` and redeploy. |
| Enforce HTTPS is greyed out | The certificate is not ready yet. Wait up to an hour and refresh the Pages settings. |
| Old content keeps showing | Cloudflare cache. Under Caching, use **Purge Everything** once. |
| Login button never appears or sign-in fails | The publishable key is missing or wrong. Locally, check `apps/web/.env.local`; for the live site, check the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` Actions Variable. A missing key also stops the build with `Missing publishableKey`. |
| Signed in on the homepage but not on a subdomain | The subdomain is not set up as a Clerk satellite, or it still uses the development instance. See "Single Sign-On Across Subdomains With Clerk". |
| Webhook events never arrive | The endpoint URL is wrong or not public, or the signing secret is unset. Confirm the URL ends in `/api/webhooks` and `CLERK_WEBHOOK_SIGNING_SECRET` is set; a `4xx` or `5xx` reply makes Clerk keep retrying. |

</div>
