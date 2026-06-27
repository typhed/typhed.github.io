<div align = "center">

# SiteFooter

</div>

<div align = "justify">

`SiteFooter` is the page footer. It shows a row of contact links as icon buttons and the exact ownership copyright. The
legal entity name stays as visible text rather than an image, so it counts toward search relevance for "Debmalya Pramanik
HUF".

It is a Server Component. The links and copyright come from [lib/constants.ts](../../packages/ui/lib/constants.ts).

## Source And Import

  * **Source**: [packages/ui/components/site-footer.tsx](../../packages/ui/components/site-footer.tsx)
  * **Data**: `SOCIAL_LINKS` and `COPYRIGHT` from [lib/constants.ts](../../packages/ui/lib/constants.ts)

```tsx
import { SiteFooter } from "@typhed/ui/components/site-footer"
```

## Props

| Prop | Type | Default | Description |
| :---: | :---: | :---: | --- |
| `className` | `string` | `undefined` | Classes merged onto the `<footer>` root. |

## Anatomy

The root is a `<footer>` with a top hairline border (`border-border/40`) and a centered `container` column.

  1. **Contact nav**: a `<nav aria-label="Contact links">` row of round icon buttons, one per entry in `SOCIAL_LINKS`.
     External links get `target="_blank"` and `rel="noopener noreferrer"`.
  2. **Copyright block**: two muted lines, `COPYRIGHT.line1` (the year-stamped brand line) and `COPYRIGHT.line2` (the
     ownership statement).

### Icon Mapping

Icons come from `lucide-react` through a small lookup, so the constants file stays free of component imports.

| `icon` value | Rendered icon |
| :---: | :---: |
| `github` | `Github` |
| `mail` | `Mail` |

To add a link type, add the entry to `SOCIAL_LINKS` and extend the `ICONS` map in this file with the matching lucide icon.

## Colors And Tokens

See the `usage.footer_social_icons` block in [colors.yml](../design/colors.yml).

| Element | Token / Class |
| :---: | :---: |
| Top border | `border-border/40` |
| Icon button border | `border-border/50` |
| Icon button fill | `bg-background/40` with `backdrop-blur-md` |
| Icon resting color | `text-muted-foreground` |
| Icon hover | `hover:border-brand/50 hover:text-brand` |
| Copyright text | `text-muted-foreground` |

## Examples

```tsx
// Typical usage at the bottom of a page.
<SiteFooter />
```

```tsx
// Add a contact link by editing constants, not the component.
// lib/constants.ts
export const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/typhed", icon: "github", external: true },
  { label: "Contact", href: "mailto:dpramanik.official@gmail.com", icon: "mail", external: false },
] as const
```

## Accessibility

  * The nav has `aria-label="Contact links"`, and each link carries both `aria-label` and `title` so the icon-only buttons
    have an accessible name and a hover tooltip.
  * External links use `rel="noopener noreferrer"`, which is a security and privacy safeguard, not optional styling.
  * The ownership text is real text, readable by assistive tech and indexable by search engines.

## Usage Guidelines

Drive the links from `SOCIAL_LINKS`. The `icon` field is a typed union (`"github" | "mail"`); widen that union and the
`ICONS` map together when you add a new platform. Keep the legal entity line as text.

## Do's And Don'ts

| Do | Don't |
| --- | --- |
| Add links via `SOCIAL_LINKS` in constants. | Hardcode anchors inside the footer. |
| Extend the `ICONS` map when adding a platform. | Reference an icon name with no map entry. |
| Keep `rel="noopener noreferrer"` on external links. | Open external links without the safe `rel`. |
| Keep the entity name as visible text. | Replace the copyright text with an image. |

</div>
