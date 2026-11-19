<div align = "center">

# Serverless Entitlement Gate

</div>

<div align = "justify">

Reference for the **hard gate** that protects a high-value paid tool whose
computation is the product. It is not part of the static export -
deploy it separately and have the paid tool call it.

## Why This Exists

The in-app `<Entitled>` component is a **soft gate**: it hides a Pro tool in the
UI, but that tool's JavaScript still ships in the static bundle and a determined
user can reach it. That is acceptable for tools whose value is convenience.

When the maths itself must be protected, the computation cannot live in the
browser. This function is the escalation: the browser sends the user's Clerk
session token, the function verifies the token and the entitlement server-side,
and only then runs and returns the protected result. The frontend stays a static
export; only this one function runs on a server.

## Flow

  1. The handler rejects any request whose `Origin` is not on the configured allowlist (403), and answers CORS
     preflights only for allowed origins.
  2. The browser gets the current Clerk session token client-side and calls the gate with
     `Authorization: Bearer <token>` plus the tool inputs.
  3. The handler verifies the token via `@clerk/backend` `verifyToken` (JWKS-backed signature and lifetime checks).
  4. A fixed-window per-user rate limit (default 30 requests/minute) brakes hot callers before any computation runs.
  5. It checks `publicMetadata.tier` / `entitlements` for the requested feature.
  6. Only a verified, entitled, in-budget caller receives the computed result; others get 400 for a malformed request,
     401, 403, 405 for a method other than POST, or 429.

## Deploying

  * Host on Cloudflare Workers, Vercel Edge, or any runtime with a `fetch(Request) -> Response` shape; wire it via
    `createGateHandler({ secretKey, allowedOrigins })` as shown in the file's doc comment.
  * Set `CLERK_SECRET_KEY` (or the instance's PEM `CLERK_JWT_KEY` for networkless verification) as a deployment
    secret - never in the client bundle.
  * Customise the Clerk session token to include `{"publicMetadata": "{{user.public_metadata}}"}` (Dashboard >
    Sessions), or the entitlement claims this gate reads will be absent and every caller gets 403.
  * Set `allowedOrigins` to exactly the sites that may call the gate (for example `https://trading.typhed.com`).
  * The bundled rate limiter is in-memory and per isolate - a brake, not a distributed quota. Move the counters to
    KV / Durable Objects / Redis before the gate fronts real spend.

## Status

**Implemented but not deployed.** The handler compiles and typechecks as the `@typhed/entitlement-gate` workspace
package, with real token verification, an origin allowlist, and rate limiting - but nothing hosts it yet and no tool
calls it. Until it is deployed, the Pro tools (Monte Carlo, Advanced analytics) remain **convenience-gated only**:
their code ships in the static bundle behind the soft `<Entitled>` gate, and Pro must not be marketed as
hard-protected. Move a tool behind this function when its IP genuinely needs protection.

</div>
