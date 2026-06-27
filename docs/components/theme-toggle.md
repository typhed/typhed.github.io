<div align = "center">

# ThemeToggle

</div>

<div align = "justify">

`ThemeToggle` is the light and dark switch in the header. It shows a sun in dark mode and a moon in light mode, and a click
flips between the two themes. Until the component mounts it shows a neutral placeholder, because the resolved theme is only
known in the browser and a guess would cause a hydration mismatch.

It is a Client Component (`"use client"`) that reads and sets the theme through `next-themes`. It renders a
[Button](button.md) under the hood.

## Source And Import

  * **Source**: [packages/ui/components/theme-toggle.tsx](../../packages/ui/components/theme-toggle.tsx)
  * **Depends on**: [Button](button.md), `useTheme` from `next-themes`, `Sun` and `Moon` from `lucide-react`
  * **Requires**: a [ThemeProvider](theme-provider.md) ancestor

```tsx
import { ThemeToggle } from "@typhed/ui/components/theme-toggle"
```

## Props

`ThemeToggle` takes no props. It reads the active theme from context and toggles it.

| Prop | Type | Default | Description |
| :---: | :---: | :---: | --- |
| none | n/a | n/a | Behavior is fully driven by the `next-themes` context. |

## Behavior

  * **Mount guard**: a `mounted` flag stays false during server render and the first client paint, so the button shows a
    `size-4` placeholder span instead of an icon. After mount it shows the real icon. This is what prevents the hydration
    warning.
  * **Toggle**: `onClick` calls `setTheme(isDark ? "light" : "dark")`, where `isDark` is `resolvedTheme === "dark"`.
  * **Icon logic**: dark shows `Sun` (tap to go light); light shows `Moon` (tap to go dark).

## Anatomy

It is a single icon `Button` (`variant="default"`, `size="icon"`) with brand-tinted styling layered on through
`className`.

## Colors And Tokens

See the `usage.theme_toggle` block in [colors.yml](../design/colors.yml).

| Element | Token / Class |
| :---: | :---: |
| Fill | `bg-primary` |
| Icon color | `text-primary-foreground` |
| Border | `border-brand/40` |
| Glow | `shadow-lg shadow-brand/30` |
| Hover | `hover:scale-110 hover:bg-primary/90` |

Because `primary` equals `brand` in both themes, the button is cyan in dark mode and indigo in light mode.

## Examples

```tsx
// In a header, opposite the brand mark.
<header className="flex items-center justify-between">
  <BrandMark />
  <ThemeToggle />
</header>
```

The component must sit inside a `ThemeProvider`. The app wires that in
[layout.tsx](../../apps/web/app/layout.tsx) with `defaultTheme="dark"`.

## Accessibility

The button carries `aria-label="Toggle color theme"` and a matching `title`. The pre-mount placeholder is
`aria-hidden="true"` so screen readers do not announce an empty control before the icon resolves. The focus ring comes
from the [Button](button.md) base classes.

## Usage Guidelines

Render it once, inside a `ThemeProvider`. Do not duplicate it across the page; two toggles fight over the same context and
confuse users. Style tweaks go through the existing `className`; keep the contrast between `bg-primary` and
`text-primary-foreground` intact.

## Do's And Don'ts

| Do | Don't |
| --- | --- |
| Keep it inside a `ThemeProvider`. | Render it with no theme context, leaving it inert. |
| Keep the mount guard and placeholder. | Render an icon on the server and trigger a mismatch. |
| Keep `aria-label` and `title`. | Ship an icon-only button with no accessible name. |
| Use one toggle per page. | Place multiple toggles that conflict. |

</div>
