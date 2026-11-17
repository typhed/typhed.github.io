<div align = "center">

# Icon

</div>

<div align = "justify">

`Icon` renders every icon on the TyPhed sites: a Font Awesome icon definition drawn as an inline SVG. It wraps Font
Awesome's `FontAwesomeIcon` and switches off the library's runtime style injection. Font Awesome's stylesheet, which
`@typhed/tailwind-config/base.css` places in Tailwind's base layer, is then the only one, and Tailwind utilities size
every icon. It works in Server and Client Components.

## Source And Import

  * **Source**: [packages/ui/components/icon.tsx](../../packages/ui/components/icon.tsx)
  * **Exports**: `Icon`

```tsx
import { faSun } from "@fortawesome/free-solid-svg-icons"
import { Icon } from "@typhed/ui/components/icon"
```

## Props

`Icon` takes every `FontAwesomeIcon` prop.

<div align = "center">

| Prop | Type | Default | Description |
| :---: | :---: | :---: | --- |
| `icon` | `IconDefinition` | required | The icon, from `@fortawesome/free-solid-svg-icons` or `@fortawesome/free-brands-svg-icons`. |
| `className` | `string` | `undefined` | Sizing and colour utilities, such as `h-4 w-4 text-muted-foreground`. |
| `...props` | `FontAwesomeIconProps` | n/a | Any other Font Awesome prop, such as `title`. |

</div>

## Examples

```tsx
<Icon icon={faSun} className="h-4 w-4" />
```

```tsx
// A social logo; the link carries the accessible name.
<a href={href} aria-label="GitHub">
  <Icon icon={faGithub} className="h-4 w-4" />
</a>
```

## Accessibility

Font Awesome marks the SVG `aria-hidden="true"` unless a `title` is passed, so an icon is decorative by default. An
icon-only control needs its own `aria-label`.

## Do's And Don'ts

<div align = "center">

| Do | Don't |
| --- | --- |
| Render every icon through `Icon`. | Import `FontAwesomeIcon` directly, which skips the style setup. |
| Size icons with Tailwind utilities. | Rely on Font Awesome's `1em` default in rows where height matters. |
| Pick a Font Awesome icon, solid or brand. | Draw an icon or a logo as inline SVG. |

</div>

</div>
