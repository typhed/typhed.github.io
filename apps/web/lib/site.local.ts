/**
 * Trading-local facts. Per the centralization plan this file holds only what
 * is genuinely local to trading.typhed.com; nothing here may duplicate a
 * `platform.ts` field.
 */

import type { ProductId } from "@/lib/platform";

/** This site's identity in the platform product registry. */
export const PRODUCT_ID: ProductId = "trading";

/** SEO description for this site only. */
export const SITE_DESCRIPTION =
  "Upload your own market data and answer the questions retail charts skip - how much quantity, how much risk, how to size and allocate capital.";

/** Site-internal navigation links; cross-product links come from the registry. */
export const INTERNAL_NAV_LINKS: ReadonlyArray<{
  label: string;
  href: string;
}> = [
  { label: "Workspace", href: "/" },
  { label: "IPO", href: "/tools/ipo" },
  { label: "50-30-20", href: "/budgeting/mnws" },
];

/** Site-local legal note rendered beside the canonical copyright lines. */
export const DISCLAIMER_NOTE =
  "Not investment advice. Verify every figure before you trade.";
