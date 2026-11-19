<div align = "center">

# SiteHeader

</div>

<div align = "justify">

`SiteHeader` is the permanent top menu bar. It stays visible while the single-page layout scrolls, stickied with a
translucent backdrop-blur so content remains legible as sections pass beneath it. The left side shows the brand logo;
the desktop right side shows the primary nav links, the Login / Sign Up call-to-action, the text-size control, the
light/dark switch, and the mobile menu button. The mobile menu collapses the nav and CTA into a full-width hamburger
panel.

The header never resizes itself. [FontSizeToggle](font-size-toggle.md) only reaches the reading scope the preset opens
on `main`, so the toolbar keeps the stock type at every step, as do the footer and the copyright bar.

It is a Server Component. Both the desktop and mobile nav read `NAV_LINKS` and `LOGIN_CTA` from
[@typhed/brand](../../../packages/brand/index.ts), so the two never drift. The `FontSizeToggle`, `ThemeToggle`, and
`MobileNav` children are Client Components that handle their own state and interactivity.

## Source And Import

  * **Source**: [packages/ui/components/site-header.tsx](../../../packages/ui/components/site-header.tsx)
  * **Data**: `NAV_LINKS`, `LOGIN_CTA`, and `SITE` from [@typhed/brand](../../../packages/brand/index.ts)
  * **Depends on**: [BrandMark](brand-mark.md), [FontSizeToggle](font-size-toggle.md), [ThemeToggle](theme-toggle.md),
    [Button](button.md), [MobileNav](#mobile-navigation)

```tsx
import { SiteHeader } from "@typhed/ui/components/site-header"
```

## Props

Both props are slots for the sign-in control. They exist so this package carries no auth dependency of its own: a Clerk
import here would couple every TyPhed property to one site's auth choice. When either is omitted, that side falls back
to a plain link to `LOGIN_CTA`, so the header is still complete with no arguments at all.

<div align = "center">

| Prop | Type | Default | Description |
| :---: | :---: | :---: | --- |
| `authSlot` | `React.ReactNode` | `undefined` | The desktop sign-in control, shown from the `md` breakpoint up. Falls back to a `Button` linking to `LOGIN_CTA`. |
| `mobileAuthSlot` | `React.ReactNode` | `undefined` | Forwarded to `MobileNav` as its `authSlot`, for the hamburger panel. Falls back to a full-width `Button` linking to `LOGIN_CTA`. |

</div>

Everything else is read from `@typhed/brand` rather than passed in.

## Anatomy

The root is a sticky `<header>` at `top-0 z-40` spanning the full viewport width. Its first child is an inline
`<script>` carrying `FONT_SCALE_SCRIPT` from [lib/font-scale.ts](../../../packages/ui/lib/font-scale.ts). It applies the
visitor's saved text size before the page below it paints, the same trick `next-themes` uses for the colour theme. The
header rather than the toggle carries it because a Server Component this close to the top of the body is parsed before
any readable text renders; without it, a visitor on the larger setting watches the page render at the default size and
then reflow. The tag is `display: none` and never affects layout.

  1. **Logo link**: an `<a href="/">` wrapping `<BrandMark />` with `aria-label`. It carries a focus ring for keyboard
     navigation. The `/` is relative on purpose. It means the home page of whichever property is rendering, which every
     property has, so it is the one header link the brand contract deliberately leaves alone.
  2. **Desktop nav** (hidden on mobile, shown md and above): a `<nav aria-label="Primary">` row of anchor links,
     `gap-1` apart, one per entry in `NAV_LINKS`. The first link is the brand hub, "TyPhed - Engineering Tomorrow":
     `@typhed/brand` builds it from `site.json`'s name and tagline instead of listing it in `navigation.json`. External
     links get `target="_blank"` and `rel="noopener noreferrer"`. Each link is a `rounded-md px-3 py-2` pill that never
     wraps (`whitespace-nowrap`). It is quiet at rest (`text-muted-foreground`); on hover and on keyboard focus it takes
     a translucent brand tint (`bg-brand/10`) while its text brightens to `text-foreground`, in both themes. The text
     stays foreground rather than turning brand-coloured, which at `text-sm` would miss the AA contrast ratio in the
     light theme. An entry naming a page the brand layer hosts arrives from `@typhed/brand` as a full URL, so the nav
     still reaches `typhed.com` when this header renders on a product subdomain. The row fits one line from 768px up.
  3. **Login / Sign Up** (hidden on mobile, shown md and above): the `authSlot`, which every app fills with
     `AuthControls` from `@typhed/auth`. Without a slot it falls back to a `Button variant="default" size="sm"` as an
     anchor, whose label and href come from `LOGIN_CTA` in [@typhed/brand](../../../packages/brand/index.ts), so desktop
     and mobile share the CTA text and destination. That href is the `#` placeholder in `navigation.json`.
  4. **Font Size Toggle**: a [FontSizeToggle](font-size-toggle.md) pair of buttons, a small "A" and a larger one,
     stepping the page content through seven text sizes, 2.5px apart. It sets `--font-scale-setting`, which only reaches
     `main`, so the header itself never moves. Both buttons show at every breakpoint; the group is the same `h-8 w-14`
     footprint as the theme switch beside it.
  5. **Theme Toggle**: a [ThemeToggle](theme-toggle.md) component that lets users switch between dark and light themes.
  6. **Mobile Menu Button** (hidden md and above): a hamburger `Button variant="ghost" size="icon"` that toggles the
     mobile nav panel. See the **Mobile Navigation** section below.

### Mobile Navigation

The `MobileNav` child component is a Client Component that handles the hamburger menu on small screens. It wraps a
Button (the hamburger toggle) and a conditionally rendered full-width panel.

  * **Toggle button**: a `Button` with `aria-label` ("Open menu" when closed, "Close menu" when open), `aria-expanded`
    (true/false), and `aria-controls="mobile-menu"`. The icon swaps between Font Awesome's `faBars` and `faXmark`.
  * **Menu panel**: a `<div id="mobile-menu">` positioned `absolute inset-x-0 top-full z-50` below the header. It
    contains a `<nav aria-label="Primary">` listing the same `NAV_LINKS` plus a full-width Login button (from
    `LOGIN_CTA`). Each link has an `onClick` that closes the menu, and takes the desktop nav's tint and brighter text on
    hover and keyboard focus. Touch screens show no hover, because Tailwind applies `hover:` only where the device can
    hover.
  * **Keyboard support**: pressing Escape while the menu is open closes it.
  * **State**: the default closed state matches the server render (no hydration mismatch).

## Colors And Tokens

See the `usage.header_backdrop` block in [colors.yml](../../brand/design/colors.yml).

<div align = "center">

| Element | Token / Class |
| :---: | :---: |
| Background | `bg-background/70` with `backdrop-blur-md` |
| Top border | `border-border/40` |
| Logo link focus ring | `focus-visible:ring-2 focus-visible:ring-ring` |
| Nav link resting | `text-muted-foreground` |
| Nav link hover and focus | `bg-brand/10` with `text-foreground`, plus `ring-ring` on focus |
| Mobile menu panel background | `bg-background/95` with `backdrop-blur-md` |
| Mobile menu panel border | `border-border/40` |
| Mobile link hover and focus | `bg-brand/10` with `text-foreground`, plus `ring-ring` on focus |

</div>

## Examples

```tsx
// SiteShell renders SiteHeader once for every page.
import { SiteShell } from "@typhed/ui/components/site-shell"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SiteShell propertyId="web">{children}</SiteShell>
      </body>
    </html>
  )
}
```

```tsx
// With an auth control injected through the slots, which is how a property
// with a sign-in flow calls it. The package still imports no auth library.
<SiteHeader
  authSlot={<AuthControls />}
  mobileAuthSlot={<AuthControls className="w-full" />}
/>
```

```json
// Add a nav link by editing the brand contract, not the component.
// An href starting with "/" is a page the brand layer hosts; @typhed/brand
// expands it to a full https://typhed.com/... URL before this component runs.
// The first link, to the brand hub, is not listed: @typhed/brand builds it
// from site.json's name and tagline and places it ahead of these.
// packages/brand/navigation.json
{
  "nav": [
    { "label": "Our Products", "href": "#" },
    { "label": "About Us", "href": "/about/" }
  ]
}
```

## Accessibility

  * The logo link carries `aria-label={SITE.name + " home"}` so it has an accessible name.
  * The logo link includes `focus-visible:ring-2 focus-visible:ring-ring`, which keeps it visible to keyboard users.
  * The desktop nav has `aria-label="Primary"` so screen readers announce its purpose.
  * Nav links show the same tint and brighter text on keyboard focus as on hover, plus a focus ring
    (`focus-visible:ring-2 focus-visible:ring-ring`), so keyboard users see where they are.
  * Each external link uses `rel="noopener noreferrer"`, a security and privacy safeguard.
  * The hamburger toggle has `aria-label` ("Open menu" / "Close menu"), `aria-expanded` (true/false), and
    `aria-controls="mobile-menu"`, which links the button to the panel it controls.
  * The mobile menu panel has `id="mobile-menu"`, matching the button's `aria-controls`.
  * Each mobile nav link has an `onClick` that closes the menu, so screen reader users are not trapped.
  * The two controls keep their own contracts, recorded on [font-size-toggle.md](font-size-toggle.md) and
    [theme-toggle.md](theme-toggle.md). The text-size control is a `role="group"` of labelled buttons with a live
    region; the theme control is a `role="switch"` with `aria-checked`. Both stay reachable at every breakpoint, so a
    phone reader can still resize the page.
  * The inline script is inert markup with no accessible representation. It sets a CSS custom property and nothing else.

## Usage Guidelines

`SiteShell` renders `SiteHeader` once for every page. The nav links come from `NAV_LINKS` in `@typhed/brand`
(`navigation.json`); add a new route there, never in the header. Keep the focus ring visible on the logo link for
keyboard accessibility. The mobile menu state is local to `MobileNav` and closes on link click or Escape; do not try to
control it from above.

Leave the inline `<script>` as the first child of `<header>`. It is placed there so it parses before any readable text
below it, which is what keeps a saved text size from flashing at the default on load. Moving it later, or into
`FontSizeToggle` itself, reintroduces the reflow.

## Do's And Don'ts

<div align = "center">

| Do | Don't |
| --- | --- |
| Add nav links in `packages/brand/navigation.json`, which `NAV_LINKS` reads. | Hardcode route anchors inside the header. |
| Let `@typhed/brand` build the brand-hub link from `site.json`. | Copy the brand name and tagline into `navigation.json`. |
| Keep hover text at `text-foreground` over the brand tint. | Turn hover text brand-coloured, which misses AA in the light theme. |
| Keep the logo link accessible name and focus ring. | Remove focus styles or make the logo non-clickable. |
| Keep external links with `rel="noopener noreferrer"`. | Open external links without the safe `rel`. |
| Let the mobile menu close itself on link click. | Try to control menu state from the parent. |
| Use the focus ring on the mobile hamburger button. | Remove or hide the focus ring for appearance. |
| Pass the sign-in control through `authSlot`. | Import an auth library into this package. |
| Keep the pre-paint script first inside `<header>`. | Move it below the toolbar and let the text size flash. |

</div>

</div>
