<div align = "center">

# Auth And Navigation

</div>

<div align = "justify">

Why the shell and auth are split the way they are. Read this before changing the header, the sidebar, or sign-in.

## Decisions

  * 2026-11-17: `@typhed/auth` is the only package that imports Clerk, while `@typhed/ui` stays auth-free and takes
    the auth control as a slot, because a shared UI package must not force one auth choice on every property.
  * 2026-11-17: one Clerk production instance (`clerk.typhed.com`) serves every subdomain with the same publishable
    key; subdomains of one root share the session, so no satellite domains are configured.
  * 2026-11-17: the header and footer are the same brand header and footer on every site (owner rule). A property's
    own menu renders in a left, collapsible sidebar, expanded by default, fed from `properties.json`.
  * 2026-11-17: trading's Clerk entitlement gate stays in `packages/entitlement-gate`, dormant and never deployed,
    until the owner wires it up (owner choice).

</div>
