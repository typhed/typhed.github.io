<div align = "center">

# SiteShell

</div>

<div align = "justify">

`SiteShell` is the page frame every property renders: the shared `SiteHeader`, the page content, and the shared
`SiteFooter`. When the property's entry in `properties.json` has sidebar groups, it also renders `ProductSidebar` to the
left of the content; otherwise the content runs full width. Each app's root layout wraps its pages in it, inside the
theme and auth providers.

It is a Server Component. Auth stays a slot, exactly as on `SiteHeader`, so `@typhed/ui` never imports an auth
provider.

## Source And Import

  * **Source**: [packages/ui/components/site-shell.tsx](../../../packages/ui/components/site-shell.tsx)

```tsx
import { SiteShell } from "@typhed/ui/components/site-shell"

<SiteShell propertyId="trading" authSlot={<AuthControls />} mobileAuthSlot={<AuthControls className="w-full" />}>
  {children}
</SiteShell>
```

## Props

<div align = "center">

| Prop | Type | Default | Description |
| :---: | :---: | :---: | --- |
| `propertyId` | `PropertyId` | - | The property whose entry supplies the sidebar groups and its accessible name. |
| `authSlot` | `ReactNode` | - | The desktop auth control, forwarded to `SiteHeader`. |
| `mobileAuthSlot` | `ReactNode` | - | The mobile auth control, forwarded to `SiteHeader`'s mobile menu. |
| `background` | `boolean` | `true` | Renders the animated `AbstractBackground` behind the page. |
| `scrollToTop` | `boolean` | `false` | Renders the floating `ScrollToTop` button. |
| `children` | `ReactNode` | - | The page content, rendered inside `<main>`. |

</div>

## Anatomy

  * `AbstractBackground` (optional), then a `relative z-10 flex min-h-dvh flex-col` column holding the header, the
    content, and the footer.
  * With sidebar groups: a `flex-col md:flex-row` row of `ProductSidebar` and `<main class="min-w-0 flex-1">`.
  * Without: `<main class="flex-1">`.
  * `ScrollToTop` (optional) after the column.

## Do And Don't

  * **Do** keep providers (`ThemeProvider`, `AuthProvider`) in the app layout, around the shell.
  * **Don't** fork the header or footer for one property; give the property sidebar groups instead.

</div>
