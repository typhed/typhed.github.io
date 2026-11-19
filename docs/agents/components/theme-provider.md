<div align = "center">

# ThemeProvider

</div>

<div align = "justify">

`ThemeProvider` is the brand's theme provider: the `next-themes` provider with the settings every property shares,
written once. The apps import it from the shared package and render it with no props.

It is a Client Component (`"use client"`).

## Source And Import

  * **Source**: [packages/ui/components/theme-provider.tsx](../../../packages/ui/components/theme-provider.tsx)
  * **Wraps**: `ThemeProvider` from `next-themes`
  * **Used by**: each app's `app/layout.tsx`

```tsx
import { ThemeProvider } from "@typhed/ui/components/theme-provider"
```

## Props

It accepts the full prop set of the `next-themes` provider (`React.ComponentProps<typeof NextThemesProvider>`) and sets
four defaults that carry the brand's theme rules. A caller can still override any of them; no layout does.

<div align = "center">

| Prop | Type | Default | Description |
| :---: | :---: | :---: | --- |
| `children` | `React.ReactNode` | - | Everything that reads the theme. |
| `attribute` | `string` | `"class"` | Switches theme by toggling the `.dark` class on `<html>`, which the Tailwind tokens rely on. |
| `defaultTheme` | `string` | `"dark"` | Midnight Indigo is the default theme. |
| `enableSystem` | `boolean` | `true` | Allows a `"system"` theme that follows the OS colour preference. No app selects it, so a first visit opens in dark. |
| `disableTransitionOnChange` | `boolean` | `true` | Skips CSS transitions during a theme switch to avoid a flash. |

</div>

Any other `next-themes` prop (`storageKey`, `themes`, `forcedTheme`, and so on) passes through unchanged.

## How It Connects To The Tokens

`attribute="class"` is the link between this provider and the colour system. The dark palette in
[colors.json](../../../packages/brand/tokens/colors.json) is written under the `.dark` selector into each app's
`app/theme.css` by `typhed-brand-sync`, so the provider toggling that class is what swaps Midnight Indigo for Aurora
Glass. See [colors.yml](../../brand/design/colors.yml) for the token tables.

## Examples

```tsx
// As wired in each app's root layout: the brand's four options are the defaults.
<ThemeProvider>{children}</ThemeProvider>
```

Render it high in the tree, in the root layout, so every component below can read and switch the theme. The `<html>`
element sets `suppressHydrationWarning`, as each app layout does, because `next-themes` updates the class after
hydration.

## Accessibility

The provider has no UI and no direct accessibility surface, but it does shape perceived behaviour. Every first visit
opens in dark, whatever the OS preference, because the provider defaults to `defaultTheme="dark"` and no app selects
the `"system"` theme that `enableSystem` allows. A visitor who prefers light switches once with
[ThemeToggle](theme-toggle.md), and `next-themes` remembers the choice.

## Usage Guidelines

Use one provider near the root and let its defaults carry the brand's theme rules; set the theme strategy there rather
than in child components. To read or set the theme in a component, call `useTheme` from `next-themes` inside a Client
Component nested under this provider, the way [ThemeToggle](theme-toggle.md) does.

## Do's And Don'ts

<div align = "center">

| Do | Don't |
| --- | --- |
| Render it once at the app root. | Scatter multiple providers down the tree. |
| Rely on the defaults in every layout. | Override one layout's options and let that property drift from the brand. |
| Keep `attribute="class"` for the token system. | Switch to an attribute the Tailwind tokens do not read. |
| Set `suppressHydrationWarning` on `<html>`. | Omit it and accept theme-class hydration warnings. |
| Configure the theme strategy at the provider. | Hardcode theme decisions inside leaf components. |

</div>

</div>
