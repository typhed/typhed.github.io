<div align = "center">

# Serverless Entitlement Gate

</div>

<div align = "justify">

Reference for the **hard gate** that protects a high-value paid tool whose
computation is the product. It is not part of the static GitHub Pages build -
deploy it separately and have the paid tool call it.

## Why This Exists

The in-app `<Entitled>` component is a **soft gate**: it hides a Pro tool in the
UI, but that tool's JavaScript still ships in the static bundle and a determined
user can reach it. That is acceptable for tools whose value is convenience.

When the maths itself must be protected, the computation cannot live in the
browser. This function is the escalation: the browser sends the user's Clerk
session token, the function verifies the token and the entitlement server-side,
and only then runs and returns the protected result. The frontend stays static
on GitHub Pages; only this one function runs on a server.

## Flow

  1. The browser gets the current Clerk session token client-side.
  2. It calls this function with `Authorization: Bearer <token>` and the tool inputs.
  3. The function verifies the token against Clerk (`@clerk/backend` `verifyToken`, JWKS-backed).
  4. It checks `publicMetadata.tier` / `entitlements` for the requested feature.
  5. Only a verified, entitled caller receives the computed result; others get 401 or 403.

## Deploying

  * Host on Cloudflare Workers, Vercel Edge, or any Node/edge runtime.
  * Set `CLERK_SECRET_KEY` (or `CLERK_JWT_KEY`) as a secret - never in the client bundle.
  * Add the function's origin to the site's allowed fetch targets.
  * Replace the placeholder `verifyClerkToken` with the real `@clerk/backend` call.

## Status

This is a documented pattern, wired for Phase 5 but not yet deployed. The
current Pro tools (Monte Carlo, Advanced analytics) use the soft gate; move a
tool behind this function when its IP genuinely needs protection.

</div>
