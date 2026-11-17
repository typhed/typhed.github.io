<div align = "center">

# ADR 2026-11-17: Shared Auth And Navigation

</div>

<div align = "justify">

<div align = "center">

| Status | Date | Scope |
| :---: | :---: | :---: |
| Accepted | 2026-11-17 | Page shell and sign-in |

</div>

## Context

The three sites wired Clerk three ways and rendered three headers. A shared UI package must not force one auth choice on
every property. The owner wants the same header and footer on every site, and trading needs its own tool navigation.

## Decision

  * `@typhed/auth` is the only package that imports Clerk: provider, header control, sign-in gate, and entitlements.
    `@typhed/ui` stays auth-free and takes the auth control as a slot.
  * One Clerk production instance (`clerk.typhed.com`) and one publishable key serve every subdomain, with no
    satellite domains.
  * The header and footer are identical on every property. A property's own menu renders in a left, collapsible
    sidebar, expanded by default, fed from `properties.json`.
  * Trading's server-side entitlement gate stays in `packages/entitlement-gate`, dormant and not deployed.

## Consequences

  * A new property gets sign-in by rendering `AuthProvider` and `AuthControls`.
  * One sign-in on any `*.typhed.com` property is recognised on all of them.
  * The header changes once for every site; product menus change through data, not markup.
  * Paid features stay a client-side soft gate until the entitlement gate is deployed.

</div>
