/** Site-wide constants for the trading platform shell. */
export const SITE = {
  name: "TyPhed Trading",
  shortName: "Trading",
  tagline: "Engineering Tomorrow",
  description:
    "Upload your own market data and answer the questions retail charts skip - how much quantity, how much risk, how to size and allocate capital.",
  url: "https://trading.typhed.com",
  parentUrl: "https://typhed.com",
  blogUrl: "https://blog.typhed.com",
  entity: "Debmalya Pramanik HUF",
  contactEmail: "pramanik.huf@gmail.com",
  github: "https://github.com/typhed",
} as const;

/** Primary navigation links shown in the header. */
export const NAV_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Workspace", href: "/" },
  { label: "IPO", href: "/tools/ipo" },
  { label: "MNWS", href: "/budgeting/mnws" },
  { label: "Main Site", href: SITE.parentUrl },
  { label: "Blog", href: SITE.blogUrl },
];

export const LOGIN_CTA = "Login / Sign Up";
