<div align = "center">

# Brand Guidelines

</div>

<div align = "justify">

The brand guidelines of **TyPhed - Engineering Tomorrow**: its story, colour palette, type and spacing systems, voice,
and the rules for applying them. The values live as JSON in [packages/brand](../../packages/brand), and the
[design references](design/) document them. The JSON files are the system and the YAML files document it. Change a
value in the JSON, then update the YAML in the same commit.

## 📜 Brand Story

<!-- Intentionally blank: the owner writes the brand story. -->

## 🎨 Color Palette

TyPhed ships two themes, and dark is the default. **Midnight Indigo** dresses the site in deep indigo-navy surfaces
with soft slate text; **Aurora Glass** turns it into cool near-white surfaces with slate ink. The two themes swap their
accent hue on purpose: cyan leads in dark and indigo leads in light, and the other hue becomes the secondary accent,
which the brand gradient blooms into at its tail. In both themes `primary`, `brand`, and the focus `ring` share one
value.

<div align = "center">

| Role | Token | Midnight Indigo (Dark) | Aurora Glass (Light) |
| :---: | :---: | :---: | :---: |
| Page canvas | `background` | `#080C1C` | `#F8FAFC` |
| Body and heading ink | `foreground` | `#E1E7EF` | `#0F1729` |
| Primary accent | `brand` | Cyan `#20D3EE` | Indigo `#6467F2` |
| Secondary accent | `brand-2` | Violet `#806EF7` | Cyan `#11C3DF` |
| Card surface | `card` | `#10182D` | `#FFFFFF` |
| Secondary copy | `muted-foreground` | `#96A2B6` | `#65758B` |
| Borders and grid lines | `border` | `#222B44` | `#E5E7EB` |
| Positive state | `success` | `#10B77F` | `#047756` |
| Caution state | `warning` | `#F59F0A` | `#B35309` |
| Danger state | `destructive` | `#BA2C2C` | `#DC2828` |

</div>

Each hex above is the computed value of an HSL triplet. The triplet is the real value, and it lives in
[colors.json](../../packages/brand/tokens/colors.json). Four rules keep the palette whole:

  * Change a colour by editing its HSL triplet in `colors.json`, never by pasting a hex. `typhed-brand-sync` writes both
    themes into every app's `app/theme.css` before each dev run and build, so one edit reaches every property.
  * Components use token classes such as `bg-brand` and `text-foreground`, never a raw hex or a stock Tailwind colour
    such as `text-cyan-400`. A new token goes into both themes in `colors.json` and into the Tailwind preset's colours.
  * Baked assets cannot read a CSS variable: the two social cards, the web app manifests, the browser and tile colours,
    and the artwork in `packages/brand/assets` carry literal hex in the same cyan-to-indigo family. They use the
    dedicated brand navy `#0B1020`, which is not the dark canvas `#080C1C`. Update them by hand on any rebrand.
  * Keep contrast intact: the dark theme's ink on the bright cyan button is the dark canvas colour, and brand-coloured
    text at small sizes misses the AA ratio in the light theme, so small text over a brand tint stays `foreground`.

<div align = "center">

| Reference | Covers | Token File |
| :---: | --- | :---: |
| [design/colors.yml](design/colors.yml) | Every theme token, its computed hex, where it is used, and the change rules | [colors.json](../../packages/brand/tokens/colors.json) |

</div>

## ✍️ Typography & Spacing

Two typefaces carry the brand. **Space Grotesk** is the display voice (`font-display`), used for headlines and the
wordmark; **Inter** sets the body copy (`font-sans`, the default on every page). Each app loads both through
`next/font/google`, which self-hosts the files at build time, so no font is fetched from Google at runtime. Every
`text-*` utility is the stock Tailwind size on a 16px root, multiplied by the reader's text-size setting inside the page
content.

Spacing sits on Tailwind's stock 4px step scale, with no custom scale. The container centres content with 1.5rem
gutters and caps at 1400px, the corner radius is 0.85rem in both themes, and full-height sections use fluid `clamp()`
spacing so each one still fits a single viewport on a short screen.

<div align = "center">

| Reference | Covers | Token File |
| :---: | --- | :---: |
| [design/spacing.yml](design/spacing.yml) | Step scale, container, breakpoints, vertical rhythm, component sizes, radius | [spacing.json](../../packages/brand/tokens/spacing.json) |
| [design/typography.yml](design/typography.yml) | Fonts and how they load, the size scale, weights, tracking, heading semantics | [typography.json](../../packages/brand/tokens/typography.json) |

</div>

## 🗣️ Voice Attributes

<!-- Intentionally blank: the owner writes the voice attributes. -->

## ⚖️ Application Rules

<!-- Intentionally blank: the owner writes the application rules. -->

</div>
