<div align = "center">

# SiteFooter

</div>

<div align = "justify">

`SiteFooter` is the site footer. It presents a brand block (logo, tagline, and company links) on the left, two columns of navigation (Product
Documentation, TyPhed Resources), and a Contact column with an email link and social icon subheading, all over a bottom bar carrying the copyright,
legal entity text, and privacy policy link. The legal entity name ("Debmalya Pramanik HUF") stays as visible text so it
contributes to search relevance.

It is a Server Component. The columns, copy, and social links come from [lib/constants.ts](../../packages/ui/lib/constants.ts),
and the colors are pure theme tokens (a faint brand wash over the card surface) so the footer recolors with both light and
dark themes automatically.

## Source And Import

  * **Source**: [packages/ui/components/site-footer.tsx](../../packages/ui/components/site-footer.tsx)
  * **Data**: `COMPANY_LINKS`, `CONTACT_EMAIL`, `COPYRIGHT`, `FOOTER_COLUMNS`, `PRIVACY_LINK`, and `SOCIAL_LINKS` from
    [lib/constants.ts](../../packages/ui/lib/constants.ts)
  * **Depends on**: [BrandMark](brand-mark.md)

```tsx
import { SiteFooter } from "@typhed/ui/components/site-footer"
```

## Props

| Prop | Type | Default | Description |
| :---: | :---: | :---: | --- |
| `className` | `string` | `undefined` | Classes merged onto the `<footer>` root. |

## Anatomy

The root is a `<footer>` with a top border and a faint brand-washed surface. It contains two main blocks:

**Top block** (the multi-column grid):

  1. **Brand column** (spans 2 columns on large screens): `BrandMark`, followed by an inline em-dash separator and "Engineering Tomorrow" tagline (using `font-display`, with "Engineering" in `text-foreground` and "Tomorrow" in the brand gradient `bg-gradient-to-r from-brand via-brand to-brand-2 bg-clip-text text-transparent`, matching the hero wordmark), followed
     by a `<nav aria-label="Company">` list of `COMPANY_LINKS`. Links are quiet at rest (`text-muted-foreground`), brighten on
     hover (`hover:text-brand`).
  2. **Two nav columns** (Product Documentation, TyPhed Resources): each column has a heading (`<h2>`) and a `<nav>` list of links from `FOOTER_COLUMNS`.
     Links follow the same quiet-to-brand hover pattern. External links get `target="_blank"` and `rel="noopener noreferrer"`.
  3. **Contact column**: a heading ("Contact Us"), a `mailto:` link to `CONTACT_EMAIL` (styling as nav links), and below it
     a "Social Connect" subheading with a social icon row.

**Social icon row**:

  * Nested under a "Social Connect" heading (`<h3 class="text-sm font-semibold text-foreground">Social Connect</h3>`), which
    sits in a `<div class="mt-6">` below the email text link.
  * A `<nav aria-label="Social media">` of circular icon buttons, driven by `SOCIAL_LINKS` from constants (excluding the `mail`
    entry, which is shown as a text link above).
  * Each icon button: `h-9 w-9 rounded-full` with `border-border`, `bg-background/40`, and `text-muted-foreground` at rest;
    on hover: `border-brand/50` and `text-brand`.
  * Supported icon names: `github`, `linkedin`, `twitter`, `instagram`, `youtube`, `facebook`. To add a network, add an entry
    to `SOCIAL_LINKS` with one of these names — no component code change is needed.

**Bottom bar**:

  * Left: `COPYRIGHT.line1` (the year-stamped copyright, muted) stacked above `COPYRIGHT.line2` (the legal entity, muted).
  * Right: the privacy policy link (`PRIVACY_LINK`), same muted-to-brand hover as the nav links.
  * Responsive: column on small screens, row on medium and above.

## Colors And Tokens

See the `usage.footer_surface` block in [colors.yml](../design/colors.yml).

| Element | Token / Class |
| :---: | :---: |
| Root background | `bg-card` with gradient `from-brand/5 to-brand-2/5` (a faint on-brand wash) |
| Top border | `border-border` |
| Bottom bar border | `border-border` |
| Column headings | `text-foreground` (emphasized) |
| Link text (resting) | `text-muted-foreground` |
| Link text (hover) | `hover:text-brand` |
| Tagline "Engineering" | `text-foreground` |
| Tagline "Tomorrow" | `bg-gradient-to-r from-brand via-brand to-brand-2 bg-clip-text text-transparent` |
| Copyright text | `text-muted-foreground` |
| Social icon button border (resting) | `border-border` |
| Social icon button background (resting) | `bg-background/40` |
| Social icon button icon (resting) | `text-muted-foreground` |
| Social icon button border (hover) | `border-brand/50` |
| Social icon button icon (hover) | `hover:text-brand` |

The gradient layers a subtle brand tint over the card surface without obscuring readability, and tracks both themes
automatically through tokens. No hardcoded hex is used.

## Examples

```tsx
// Typical usage at the bottom of the page.
<SiteFooter />
```

```tsx
// Edit the company links and footer columns in constants, not the component.
// lib/constants.ts
export const COMPANY_LINKS: readonly NavLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Our Products", href: "#" },
] as const

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  { heading: "Product Documentation", links: PRODUCT_LINKS },
  { heading: "TyPhed Resources", links: RESOURCE_LINKS },
] as const
```

```tsx
// Update contact email in constants.
// lib/constants.ts
export const CONTACT_EMAIL = "pramanik.huf@gmail.com" as const
```

## Accessibility

  * Each nav column has an `aria-label` matching its heading, so screen readers announce the section purpose.
  * The social icon row has `aria-label="Social media"` to label the group.
  * Each social icon button carries `aria-label` and `title` matching its network name, so screen readers announce the link.
  * The brand mark inside the footer is not wrapped in a link; it is a visual marker of context (already at the bottom).
  * All links are real text, readable by screen readers and searchable by engines.
  * The legal entity name is visible text in the copyright bar, not an image.
  * External links use `rel="noopener noreferrer"`, a security and privacy safeguard.

## Usage Guidelines

The brand column links come from `COMPANY_LINKS` and the middle columns from `FOOTER_COLUMNS` (Product Documentation and TyPhed Resources); the contact email from `CONTACT_EMAIL`; and the social icons from `SOCIAL_LINKS` in constants. Add new brand links by editing `COMPANY_LINKS`, and new product or resource links by editing the arrays in `FOOTER_COLUMNS` — do not edit the footer component. To add a social network, append an entry to `SOCIAL_LINKS` with a supported icon name; the footer automatically renders it. The `mail` entry in `SOCIAL_LINKS` is always excluded from the icon row (shown as a text link instead). Keep the legal entity line as visible text in the copyright bar. The copyright year updates automatically through JavaScript (`new Date().getFullYear()`), so no annual maintenance is needed.

## Do's And Don'ts

| Do | Don't |
| --- | --- |
| Add brand links via `COMPANY_LINKS` in constants. | Hardcode brand column links into the footer. |
| Add product or resource links via `FOOTER_COLUMNS` in constants. | Hardcode nav column links into the footer. |
| Add social networks via `SOCIAL_LINKS` in constants. | Hardcode social links or icon buttons. |
| Drive the email from `CONTACT_EMAIL`. | Paste an email address into the component. |
| Keep the legal entity as visible text in the copyright bar. | Replace it with a logo or hide it. |
| Use one of the supported icon names (github, linkedin, twitter, instagram, youtube, facebook). | Invent new icon names. |
| Keep `rel="noopener noreferrer"` on external links. | Open external links without the safe `rel`. |
| Use the subtle brand gradient over `bg-card`. | Add a dark, opaque background. |

</div>
