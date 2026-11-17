<div align = "center">

# ProductSidebar

</div>

<div align = "justify">

`ProductSidebar` is a property's own product menu: a column of grouped links on the left of the page content. The
header and footer stay the same brand header and footer on every site, so anything one property needs to navigate lives
here. The menu starts expanded, animates down to a narrow rail with its toggle button, and remembers the visitor's
choice per property. With no groups it renders nothing.

It is a Client Component (uses state, effects, `localStorage`, and `usePathname`). `SiteShell` renders it from the
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
| `label` | `string` | Yes | The property's name: the column's visible title and the menu's accessible name. |

</div>

## Anatomy

The menu has three levels, and each differs from the next in more than one way, so a glance tells them apart:

<div align = "center">

| Level | Element | Style |
| :---: | :---: | --- |
| Title | The property's name above the menu | `text-sm font-semibold text-foreground` |
| Group caption | A labelled group's heading, such as TOOLS | `text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground` |
| Link | One page | `text-sm text-foreground/75`, and `font-medium` in a group without a caption |

</div>

  * **Root**: an `<aside>`, full width above the content on small screens, a left column (`md:w-60`, `md:w-12` when
    collapsed) beside it from the `md` breakpoint, sticky under the `h-16` header. It clips sideways with
    `overflow-x-clip`, which, unlike `overflow-hidden`, leaves the sticky inner column working.
  * **Title row**: `h-12`, with the title on the left and the toggle on the right. The toggle is a button with
    `aria-expanded`, `aria-controls`, and a label that reads "Collapse menu" or "Expand menu". Its arrow points left
    from `md` and up below it, and turns over while the menu is collapsed.
  * **Groups**: a labelled group shows its caption and indents its links (`ml-3`) on a 1px guide line
    (`border-l border-border`). A group without a caption holds top-level links, set flush and one weight heavier.
    Groups sit `space-y-5` apart and links `space-y-0.5`, so proximity alone shows what belongs together.
  * **Current page**: the link to the current page carries `aria-current="page"`, a 2px brand bar on its left
    (`border-brand`, laid over the guide line in a labelled group), a brand tint (`bg-brand/10`), and `font-semibold`.
    Its text stays `text-foreground`, because brand-coloured text at `text-sm` is 4.23:1 on the light background,
    under the AA ratio. Links with a query string never show as current.
  * **Hover and focus**: a link tints (`hover:bg-accent/60`), darkens to `text-foreground`, and shows a faint bar.
    Every link and the toggle show a focus ring (`focus-visible:ring-2 focus-visible:ring-ring`).

## Motion

  * From `md`, collapsing narrows the column from `w-60` to `w-12` over 300ms while the menu fades out over 200ms.
    Expanding widens it over 300ms and fades the menu back in after a 75ms delay. The menu keeps `md:w-60` while the
    column narrows around it, and its text is `whitespace-nowrap`, so nothing rewraps mid-animation.
  * Below `md`, the menu folds up under its title row instead, through a `grid-template-rows` transition from `1fr` to
    `0fr`.
  * The toggle's arrow turns over in step with the menu.
  * Every transition, including its duration and easing, is declared under `motion-safe`, so `prefers-reduced-motion`
    removes them all. They switch on two frames after the stored choice is restored, so loading a page never animates.

## Behaviour

  * Expanded on first visit; the collapse choice is stored as `open` or `closed` under `storageKey`.
  * Storage can be unavailable (private windows, blocked site data), so every read and write is guarded and the menu
    falls back to expanded.

## Accessibility

  * The menu is a `<nav>` labelled by the visible title, and each group's list is labelled by its caption
    (`aria-labelledby`).
  * A collapsed menu is `inert`: it leaves the tab order and the accessibility tree, so keyboard users go straight from
    the header to the page.
  * Every colour meets AA in both themes. Captions are 4.51:1 (light) and 7.52:1 (dark), links 7.77:1 and 8.96:1, and
    the brand bar, a non-text indicator, 4.23:1 and 10.72:1 against the 3:1 it needs. The current page is marked by
    `aria-current` and weight as well as colour.

## Do And Don't

  * **Do** change a property's menu in `properties.json`, never in the component.
  * **Don't** put brand-wide navigation here; that belongs to the shared header.
  * **Don't** colour the current page's text with `brand`; the bar and the tint carry it.

</div>
