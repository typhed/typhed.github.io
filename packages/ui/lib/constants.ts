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

export const LAUNCH_LABEL = "01 April 2027, 00:00 IST"

export const COPYRIGHT = {
  line1: `Copyright © ${new Date().getFullYear()} TyPhed - Engineering Tomorrow`,
  line2: "This brand is maintained and owned by Debmalya Pramanik HUF",
} as const

export type SocialLink = {
  label: string
  href: string
  /** lucide-react icon name resolved by the consumer */
  icon: "github" | "mail"
  external: boolean
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    label: "GitHub",
    href: "https://github.com/typhed",
    icon: "github",
    external: true,
  },
  {
    label: "Contact",
    href: "mailto:dpramanik.official@gmail.com",
    icon: "mail",
    external: false,
  },
] as const
