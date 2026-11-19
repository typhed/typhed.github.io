<div align = "center">

# TyPhed Component Library

[![React](https://img.shields.io/badge/React-%2019-61DAFB?style=plastic&logo=react)](https://react.dev)
[![Next.js](https://img.shields.io/badge/Next.js-%2016-000000?style=plastic&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-%206-3178C6?style=plastic&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-%204.3-06B6D4?style=plastic&logo=tailwindcss)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-%2014-0055FF?style=plastic&logo=framer)](https://www.framer.com/motion/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-%20primitives-000000?style=plastic&logo=shadcnui)](https://ui.shadcn.com)

</div>

<div align = "justify">

This folder is the reference manual for the shared UI components of every TyPhed property. The components live in
[packages/ui/components](../../../packages/ui/components) and ship through the `@typhed/ui` workspace package. Each
component has its own page that records its props, variants, anatomy, colour tokens, examples, accessibility contract,
and the do's and don'ts that keep the interface on brand.

Read the relevant page and [colors.yml](../../brand/design/colors.yml) before you touch a component; where a page and
the code disagree, the code wins and the page is fixed. Colour values never live in a component: they
resolve from theme tokens, so a colour edit belongs in [colors.json](../../../packages/brand/tokens/colors.json), never
in a component or in an app's `globals.css`.

## 🧩 Component Index

The library splits into two groups: the branded surface pieces and the shadcn-style primitives. "Type" marks whether a
component runs as a React Server Component or ships a client bundle (`"use client"`).

<div align = "center">

| Component | Source | Type | Documentation |
| :---: | :---: | :---: | :---: |
| AbstractBackground | [abstract-background.tsx](../../../packages/ui/components/abstract-background.tsx) | Server | [abstract-background.md](abstract-background.md) |
| BrandMark | [brand-mark.tsx](../../../packages/ui/components/brand-mark.tsx) | Server | [brand-mark.md](brand-mark.md) |
| BrandLockup | [brand-lockup.tsx](../../../packages/ui/components/brand-lockup.tsx) | Server | [brand-lockup.md](brand-lockup.md) |
| SiteHeader | [site-header.tsx](../../../packages/ui/components/site-header.tsx) | Server | [site-header.md](site-header.md) |
| SiteFooter | [site-footer.tsx](../../../packages/ui/components/site-footer.tsx) | Server | [site-footer.md](site-footer.md) |
| SiteShell | [site-shell.tsx](../../../packages/ui/components/site-shell.tsx) | Server | [site-shell.md](site-shell.md) |
| ProductSidebar | [product-sidebar.tsx](../../../packages/ui/components/product-sidebar.tsx) | Client | [product-sidebar.md](product-sidebar.md) |
| ScrollToTop | [scroll-to-top.tsx](../../../packages/ui/components/scroll-to-top.tsx) | Client | [scroll-to-top.md](scroll-to-top.md) |
| FontSizeToggle | [font-size-toggle.tsx](../../../packages/ui/components/font-size-toggle.tsx) | Client | [font-size-toggle.md](font-size-toggle.md) |
| ThemeToggle | [theme-toggle.tsx](../../../packages/ui/components/theme-toggle.tsx) | Client | [theme-toggle.md](theme-toggle.md) |
| ThemeProvider | [theme-provider.tsx](../../../packages/ui/components/theme-provider.tsx) | Client | [theme-provider.md](theme-provider.md) |
| Button | [ui/button.tsx](../../../packages/ui/components/ui/button.tsx) | Server | [button.md](button.md) |
| Card | [ui/card.tsx](../../../packages/ui/components/ui/card.tsx) | Server | [card.md](card.md) |
| Icon | [icon.tsx](../../../packages/ui/components/icon.tsx) | Server | [icon.md](icon.md) |

</div>

`MobileNav`, the header's small-screen menu, is documented on the [SiteHeader](site-header.md#mobile-navigation) page.
The work-in-progress landing components (`WipLanding`, `CountdownTimer`, and `LaunchProgress`) are temporary and
deliberately have no page.

`Button` renders in `SiteHeader`, in its `MobileNav`, in `AuthControls` from `@typhed/auth`, and across the trading
tools. No surface renders `Card` yet; it stays documented as a ready primitive for the components the products will
build.

## 🎨 Design Tokens

Every colour flows through the theme tokens documented in [colors.yml](../../brand/design/colors.yml). Components
reference them through Tailwind classes such as `bg-brand`, `text-foreground`, and `border-border`, never through raw
hex. The two themes are Midnight Indigo (dark, the default) and Aurora Glass (light), and the accent hue swaps between
them: cyan leads in dark, indigo leads in light. When a component page lists "Colors And Tokens", each entry maps to a
row in that file.

## 🧱 Architecture

  * **Package**: every component exports from `@typhed/ui`. The package map in
    [packages/ui/package.json](../../../packages/ui/package.json) exposes `./components/*` and `./lib/*`.
  * **Import paths**: `import { BrandMark } from "@typhed/ui/components/brand-mark"`. Primitives sit one level deeper,
    for example `@typhed/ui/components/ui/button`.
  * **Class merging**: styled components accept a `className` and fold it in with `cn` from
    [lib/utils.ts](../../../packages/ui/lib/utils.ts). `cn` runs `clsx` then `tailwind-merge`, so a caller's class wins
    over the component default when the two conflict.
  * **Shared copy and dates**: brand strings, the launch target, and contact links come from
    [@typhed/brand](../../../packages/brand/index.ts). Components read from there rather than hardcoding text.
  * **Fonts**: `font-display` is Space Grotesk and `font-sans` is Inter, both loaded in each app's `app/layout.tsx`.
  * **Text size**: every `text-*` utility resolves through the `--font-scale` custom property, which
    [FontSizeToggle](font-size-toggle.md) drives across seven steps of 2.5px each. The property is `1` at `:root` and
    is redefined on `main`, so page content follows the reader while the header, footer, and copyright bar keep the
    stock size. Spacing never references it, so larger type is not page zoom. An arbitrary `text-[...]` value opts out
    by default and needs an explicit `calc` to follow the control.

## ✅ Editing Rules

Read this before changing any component.

  * Read the component's page and [colors.yml](../../brand/design/colors.yml) before editing. Do not infer behaviour
    from the name.
  * Keep colours in tokens. Never paste a hex value into a component; edit the HSL triplet in
    [colors.json](../../../packages/brand/tokens/colors.json) instead, and every TyPhed property picks it up.
  * Respect the runtime boundary. A component marked Client carries `"use client"` for a reason (state, effects, or
    browser APIs). Do not add hooks to a Server component, and do not drop `"use client"` from a Client one.
  * Guard hydration. ThemeToggle and FontSizeToggle render a stable default on the server and settle to the browser's
    value after mount. Keep that pattern for any component whose output depends on the browser.
  * Honour reduced motion. Animated components already respect `motion-reduce`, `motion-safe`, or `useReducedMotion`.
    Match that for any new motion.
  * Preserve the accessibility contract listed on each page: roles, `aria-*` attributes, labels, and focus styles.

## 📐 Page Conventions

Each component page follows the same order so you can scan it fast.

  1. A one-line summary and where it renders.
  2. **Source And Import** with the exact import path.
  3. **Props** as a table of name, type, default, and description.
  4. **Variants** where the component defines them.
  5. **Anatomy** describing the rendered structure.
  6. **Colors And Tokens** linking back to the colour reference.
  7. **Examples** as runnable `tsx` snippets.
  8. **Accessibility** with the concrete contract.
  9. **Usage Guidelines** and a **Do's And Don'ts** table.

</div>
