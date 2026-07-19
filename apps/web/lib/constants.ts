/**
 * Site-wide constants for the trading platform shell. Every cross-site fact
 * derives from the platform control file (`platform.ts`); only genuinely
 * trading-local facts come from `site.local.ts`.
 */

import {
  BRAND,
  CONTACT_EMAIL,
  PRODUCTS,
  SOCIAL_LINKS,
  productSwitcherFor,
} from "@/lib/platform";
import {
  DISCLAIMER_NOTE,
  INTERNAL_NAV_LINKS,
  PRODUCT_ID,
  SITE_DESCRIPTION,
} from "@/lib/site.local";
import { TOOL_CATEGORIES, toolsInCategory } from "@/lib/tool-registry";

/** Registry lookups are compile-time data; a miss is a build defect. */
function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`platform registry is missing ${what}`);
  }
  return value;
}

const product = required(
  PRODUCTS.find((p) => p.id === PRODUCT_ID),
  `product "${PRODUCT_ID}"`,
);

export const SITE = {
  name: product.name,
  shortName: product.chip ?? product.label,
  tagline: BRAND.tagline,
  description: SITE_DESCRIPTION,
  url: product.url,
  entity: BRAND.legalEntity,
  contactEmail: CONTACT_EMAIL,
  github: required(
    SOCIAL_LINKS.find((s) => s.icon === "github"),
    "the GitHub social link",
  ).href,
  disclaimer: DISCLAIMER_NOTE,
} as const;

export type NavLink = {
  label: string;
  href: string;
  /** Rendered as a plain anchor (cross-product / external), not a Next Link. */
  external: boolean;
  /** Open in a new tab - registry-driven, never inferred from the URL. */
  newTab: boolean;
};

export type NavGroup = {
  label: string;
  items: ReadonlyArray<{ label: string; href: string }>;
};

/** Site-internal links rendered before the dropdown groups. */
export const SITE_NAV_LINKS = INTERNAL_NAV_LINKS;

/** One dropdown group per tool category, fed by the tool registry. */
export const NAV_GROUPS: ReadonlyArray<NavGroup> = TOOL_CATEGORIES.map(
  (category) => ({
    label: category.label,
    items: toolsInCategory(category.id).map((tool) => ({
      label: tool.name,
      href: tool.route,
    })),
  }),
);

/** Cross-product switcher links; same-tab per the registry flag. */
export const PRODUCT_NAV_LINKS: ReadonlyArray<NavLink> = productSwitcherFor(
  PRODUCT_ID,
).map((p) => ({
  label: p.label,
  href: p.url,
  external: true,
  newTab: p.openInNewTab,
}));

export const LOGIN_CTA = "Login / Sign Up";
