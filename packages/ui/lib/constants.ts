/**
 * Single source of truth for brand copy, the launch countdown target,
 * contact links and SEO strings. Every app and component reads from
 * here so the main site and future product sites stay consistent.
 */

export const SITE = {
  name: "TyPhed",
  tagline: "Engineering Tomorrow",
  legalEntity: "Debmalya Pramanik HUF",
  url: "https://typhed.com",
  description:
    "TyPhed - Engineering Tomorrow. The brand homepage of Debmalya Pramanik HUF. Something precise and ambitious is under construction.",
} as const

/**
 * Launch target: 2027-04-01 00:00 IST (Asia/Kolkata, UTC+05:30),
 * expressed in UTC as 2027-03-31T18:30:00Z so the countdown is correct
 * for every visitor regardless of their local timezone.
 */
export const LAUNCH_DATE = new Date("2027-03-31T18:30:00.000Z")

/**
 * Start of the journey, used as the 0% point of the launch progress bar:
 * 2026-05-01 00:00 IST (= 2026-04-30T18:30:00Z).
 */
export const LAUNCH_START_DATE = new Date("2026-04-30T18:30:00.000Z")

export const LAUNCH_LABEL = "01 April 2027, 00:00 IST"

export const COPYRIGHT = {
  line1: `Copyright © ${new Date().getFullYear()} TyPhed - Engineering Tomorrow`,
  line2: "This Brand is Maintained and Owned by Debmalya Pramanik HUF",
} as const

export type SocialLink = {
  label: string
  href: string
  /** lucide-react icon name; resolved to a glyph by the footer's icon map. */
  icon:
    | "github"
    | "mail"
    | "linkedin"
    | "twitter"
    | "instagram"
    | "youtube"
    | "facebook"
  external: boolean
}

/**
 * Social / contact links shown as the footer's icon row. To add a network,
 * append an entry here with one of the supported `icon` names above — no
 * component change is needed. (The `mail` entry is the contact address; the
 * footer renders it as a text link, not an icon, to avoid duplication.)
 *
 * Example: { label: "YouTube", href: "https://youtube.com/@typhed",
 *            icon: "youtube", external: true }
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    label: "GitHub",
    href: "https://github.com/typhed",
    icon: "github",
    external: true,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/typhed/",
    icon: "linkedin",
    external: true,
  },
  {
    label: "Contact",
    href: "mailto:pramanik.huf@gmail.com",
    icon: "mail",
    external: false,
  },
] as const

/** Contact address surfaced in the footer (no phone / postal address yet). */
export const CONTACT_EMAIL = "pramanik.huf@gmail.com" as const

/**
 * A navigable link. `external` opens in a new tab with safe rel attributes,
 * and the footer marks such a link with a trailing ↗ glyph. Placeholder
 * destinations use `href: "#"` until the real route or section exists, so
 * markup and intent stay in one place.
 */
export type NavLink = {
  label: string
  href: string
  external?: boolean
}

/** Primary header navigation. "Our Products" points to the in-page product
 * section once it lands (currently a placeholder). */
export const NAV_LINKS: readonly NavLink[] = [
  { label: "Our Products", href: "#" },
  { label: "About Us", href: "/about" },
] as const

/** A titled group of links rendered as one footer column. */
export type FooterColumn = {
  heading: string
  links: readonly NavLink[]
}

/** The products the brand layer points visitors at. Each live product sits on
 * its own subdomain, so those entries are external; pricing is a page on this
 * site and stays a placeholder until it exists. */
export const PRODUCT_LINKS: readonly NavLink[] = [
  { label: "TyPhed Trading", href: "https://trading.typhed.com/", external: true },
  { label: "Products Pricing", href: "#" },
] as const

/** Reading, evidence, and hiring. The blog runs on its own subdomain and the
 * career page is the LinkedIn company page, so both leave the site. */
export const RESOURCE_LINKS: readonly NavLink[] = [
  { label: "TyPhed BLOG", href: "https://blog.typhed.com/", external: true },
  { label: "Case Studies", href: "#" },
  {
    label: "Career Page",
    href: "https://www.linkedin.com/company/typhed/",
    external: true,
  },
] as const

/** The two middle footer columns. The brand column (the lockup alone) and the
 * Contact column are rendered separately, as they hold non-list content. */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  { heading: "PRODUCTS", links: PRODUCT_LINKS },
  { heading: "RESOURCES", links: RESOURCE_LINKS },
] as const

/** Legal link shown on the right of the footer's bottom bar. */
export const PRIVACY_LINK: NavLink = { label: "Privacy Policy", href: "#" } as const

/** The header's primary call-to-action, shared by the desktop bar and the
 * mobile menu so the label and destination stay in one place. */
export const LOGIN_CTA: NavLink = { label: "Login / Sign Up", href: "#" } as const
