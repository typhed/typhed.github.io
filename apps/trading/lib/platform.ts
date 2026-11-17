/**
 * The platform control file: the single source of every cross-site fact.
 *
 * Canonical source: `packages/ui/lib/platform.ts` on `master` of
 * `typhed/typhed.github.io`. This file is the adopted copy for
 * trading.typhed.com - all edits happen in the canonical repository, bump
 * `PLATFORM_CONFIG_VERSION` there, and propagate here as a one-file phase.
 * The deploy workflow diffs this copy against the canonical raw file and
 * fails the build on drift.
 */

/** Version stamp: bump on every change so drift is detectable at a glance. */
export const PLATFORM_CONFIG_VERSION = "1.0.0";

export const BRAND = {
  name: "TyPhed",
  tagline: "Engineering Tomorrow",
  legalEntity: "Debmalya Pramanik HUF",
} as const;

export const CONTACT_EMAIL = "pramanik.huf@gmail.com";

export type ProductId = "home" | "blog" | "trading";

export type Product = {
  id: ProductId;
  /** Nav label on sibling sites, e.g. "Blog". */
  label: string;
  /** Full site name, e.g. "TyPhed Blog". */
  name: string;
  url: string;
  /** Chip text in the site's own header; the main site has none. */
  chip?: string;
  live: boolean;
  /** Cross-product links open in the same tab by default. */
  openInNewTab: boolean;
};

export const PRODUCTS: readonly Product[] = [
  {
    id: "home",
    label: "Main Site",
    name: "TyPhed",
    url: "https://typhed.com",
    live: true,
    openInNewTab: false,
  },
  {
    id: "blog",
    label: "Blog",
    name: "TyPhed Blog",
    url: "https://blog.typhed.com",
    chip: "Blog",
    live: true,
    openInNewTab: false,
  },
  {
    id: "trading",
    label: "Trading",
    name: "TyPhed Trading",
    url: "https://trading.typhed.com",
    chip: "Trading",
    live: true,
    openInNewTab: false,
  },
] as const;

/** The product switcher for a site: every live product except itself. */
export const productSwitcherFor = (current: ProductId) =>
  PRODUCTS.filter((p) => p.live && p.id !== current);

export const SOCIAL_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/typhed",
    icon: "github",
    external: true,
  },
  {
    label: "Contact",
    href: `mailto:${CONTACT_EMAIL}`,
    icon: "mail",
    external: false,
  },
] as const;

export const COPYRIGHT_LINES = [
  "Copyright © {year} TyPhed - Engineering Tomorrow",
  "This Brand is Maintained and Owned by Debmalya Pramanik HUF",
] as const;

export const PRIVACY_LINK = {
  label: "Privacy Policy",
  href: "https://typhed.com/privacy",
} as const;
