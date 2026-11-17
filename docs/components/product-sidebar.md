<div align = "center">

# ProductSidebar

</div>

<div align = "justify">

`ProductSidebar` is a property's own product menu: a column of grouped links on the left of the page content. The
header and footer stay the same brand header and footer on every site, so anything one property needs to navigate lives
here. The menu starts expanded, collapses to a narrow rail with its toggle button, and remembers the visitor's choice
per property. With no groups it renders nothing.

It is a Client Component (uses state, an effect, `localStorage`, and `usePathname`). `SiteShell` renders it from the
property's `sidebar` groups in `properties.json`, so apps rarely mount it directly.

## Source And Import

  * **Source**: [packages/ui/components/product-sidebar.tsx](../../packages/ui/components/product-sidebar.tsx)

```tsx
import { ProductSidebar } from "@typhed/ui/components/product-sidebar"
```

## Props

<div align = "center">

| Prop | Type | Required | Description |
| :---: | :---: | :---: | --- |
| `groups` | `readonly SidebarGroup[]` | Yes | The groups to render; each has an optional `label` and its `links`. |
| `storageKey` | `string` | Yes | The `localStorage` key that remembers the collapse choice. |
| `label` | `string` | Yes | The accessible name of the navigation landmark. |

</div>

## Anatomy

  * **Root**: an `<aside>`, full width above the content on small screens, a left column (`md:w-60`, `md:w-12` when
    collapsed) beside it from the `md` breakpoint, sticky under the `h-16` header.
  * **Toggle**: a button with `aria-expanded`, `aria-controls`, and a label that reads "Collapse menu" or "Expand menu".
  * **Menu**: a `<nav>` holding each group's heading and its links; the link to the current page carries
    `aria-current="page"`. Links with a query string never show as current.

## Behaviour

  * Expanded on first visit; the collapse choice is stored as `open` or `closed` under `storageKey`.
  * Storage can be unavailable (private windows, blocked site data), so every read and write is guarded and the menu
    falls back to expanded.

## Do And Don't

  * **Do** change a property's menu in `properties.json`, never in the component.
  * **Don't** put brand-wide navigation here; that belongs to the shared header.

</div>
