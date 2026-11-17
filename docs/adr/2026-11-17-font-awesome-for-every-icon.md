<div align = "center">

# ADR 2026-11-17: Font Awesome For Every Icon

</div>

<div align = "justify">

<div align = "center">

| Status | Date | Scope |
| :---: | :---: | :---: |
| Accepted | 2026-11-17 | Icons on every property |

</div>

## Context

The three sites show interface icons, such as the theme toggle, the menus, and the trading tools' actions and states,
and the shared footer shows the logos of the social networks the brand links to. Lucide supplied all of them until its
1.0 release removed every company logo, the footer's six included. Keeping lucide for the interface would have meant a
second library for the logos. The blog also drew its trading-platform marks by hand, which the project rules forbid.

## Decision

Every icon comes from Font Awesome Free, and lucide is not a dependency:

  * Interface icons use the free solid set; social networks use the free brand set.
  * Components render every icon through `Icon` in `@typhed/ui`, a wrapper around Font Awesome's React component.
  * No icon or logo is drawn in code. Where Font Awesome has no logo, a neutral icon stands in, as the blog's chart icon
    does for each trading platform.

## Consequences

  * One library covers the interface icons and the social logos, with one look across the three sites.
  * Icons are filled rather than outlined, because the free set is mostly solid.
  * Font Awesome's stylesheet sits in Tailwind's base layer and its runtime style injection stays off, so Tailwind
    utilities size every icon.
  * A new icon is one import from `@fortawesome/free-solid-svg-icons` or `@fortawesome/free-brands-svg-icons`.

</div>
