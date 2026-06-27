<div align = "center">

# BrandMark

</div>

<div align = "justify">

`BrandMark` is the TyPhed identity: a geometric SVG glyph paired with the "TyPhed" wordmark. The glyph reads as an upward
node forming a "T", which carries the engineering and forward-motion idea. The glyph fills with the brand gradient, and the
wordmark uses the display font set by the app theme.

It is a Server Component. The same shape ships as a standalone file at
[apps/web/public/logo.svg](../../apps/web/public/logo.svg) for use cases that need a static asset (the manifest icon, for
example).

## Source And Import

  * **Source**: [packages/ui/components/brand-mark.tsx](../../packages/ui/components/brand-mark.tsx)

```tsx
import { BrandMark } from "@typhed/ui/components/brand-mark"
```

## Props

| Prop | Type | Default | Description |
| :---: | :---: | :---: | --- |
| `showWordmark` | `boolean` | `true` | Render the "TyPhed" wordmark next to the glyph. Set `false` for a glyph-only mark. |
| `className` | `string` | `undefined` | Classes for the outer `inline-flex` wrapper. Use it for sizing and spacing. |
| `glyphClassName` | `string` | `undefined` | Classes for the `svg` glyph only. Defaults to `h-9 w-9`; override to resize the glyph. |

## Anatomy

The root is an `inline-flex items-center gap-3` span.

  1. **Glyph**: a `48x48` viewBox `svg` with `role="img"` and an `aria-label` of "TyPhed logo". It defines a diagonal
     `linearGradient` (`#typhed-brand-gradient`) running from `--brand` to `--brand-2`, then draws a rounded square frame,
     a horizontal and a vertical stroke forming the "T", and three node dots, all painted with that gradient.
  2. **Wordmark** (when `showWordmark` is true): a `font-display` span reading "Ty" in `text-foreground` and "Phed" in
     `text-brand`.

## Colors And Tokens

| Element | Token / Class |
| :---: | :---: |
| Glyph gradient start | `--brand` |
| Glyph gradient end | `--brand-2` |
| Frame stroke | brand gradient at `opacity 0.55` |
| Wordmark "Ty" | `text-foreground` |
| Wordmark "Phed" | `text-brand` |

The gradient direction and stops mirror [logo.svg](../../apps/web/public/logo.svg). The SVG asset uses the hardcoded brand
hex pair (`#22D3EE` and `#6366F1`) because static files cannot read CSS variables; see the `static_assets` block in
[colors.yml](../design/colors.yml). Keep the two in sync on any rebrand.

## Examples

```tsx
// Default: glyph plus wordmark, used in the header.
<a href="/" aria-label="TyPhed home">
  <BrandMark />
</a>
```

```tsx
// Glyph only, resized for a compact slot.
<BrandMark showWordmark={false} glyphClassName="h-6 w-6" />
```

## Accessibility

The glyph is a labelled image (`role="img"`, `aria-label="TyPhed logo"`), so it announces as the logo even when the
wordmark is hidden. When you place it inside a link, label the link too, as the header does with `aria-label`. The wordmark
is real text, which also helps search relevance for the brand name.

## Usage Guidelines

Use `BrandMark` for the brand identity wherever it appears in the app. Resize through `glyphClassName` and `className`
rather than scaling transforms, so strokes stay crisp. For a favicon or an OG image, use the raster generators in
[apps/web/app](../../apps/web/app) instead; this component is for in-app rendering.

## Do's And Don'ts

| Do | Don't |
| --- | --- |
| Resize with `glyphClassName` / `className`. | Wrap it in a `scale-*` transform that blurs strokes. |
| Keep the gradient on `--brand` to `--brand-2`. | Recolor the glyph with hardcoded hex. |
| Label the wrapping link when you make it clickable. | Rely on the glyph alone for a link's accessible name. |
| Sync changes with [logo.svg](../../apps/web/public/logo.svg). | Edit one mark and leave the other stale. |

</div>
