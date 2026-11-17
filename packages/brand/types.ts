/**
 * Types for the TyPhed brand contract.
 *
 * The contract itself is plain JSON so that any stack can read it: a Next.js
 * app imports it through this package, and a generator in another language
 * reads the same files off disk. These types describe that JSON for the
 * TypeScript consumers.
 */

/**
 * A navigable link, as a component receives it. `external` opens it in a new
 * tab with safe rel attributes. Placeholder destinations use `href: "#"` until
 * the real route or section exists, so markup and intent stay in one place.
 *
 * Every `href` here is final: `index.ts` resolves each `LinkEntry` of the
 * JSON, so a brand page arrives as its absolute URL and the destination is the
 * same from every property.
 */
export type NavLink = {
  label: string
  href: string
  external?: boolean
}

/**
 * A link as navigation.json writes it. It names its destination in exactly
 * one way, so every URL is written down once, in the file that owns it:
 *
 *   href      a page the brand layer hosts, written as its path on typhed.com
 *             ("/about/"), a full URL, a mailto:, or "#" until the page exists
 *   property  the id of a property in properties.json; the link takes that
 *             property's URL and opens in a new tab unless it is the brand site
 *   social    the icon key of an entry in the social list; the link takes that
 *             account's URL and its external flag
 *
 * `index.ts` stops the build when an entry names no destination, more than
 * one, or a property or account that does not exist.
 */
export type LinkEntry = {
  label: string
  href?: string
  property?: string
  social?: string
  external?: boolean
}

/** A titled group of links rendered under one footer heading. */
export type FooterColumn = {
  heading: string
  links: readonly NavLink[]
}

/**
 * One column of the footer grid. A column usually holds a single group, but
 * it may stack two under one another (DISCLAIMER over COMMUNITY) when the
 * grid has fewer columns than the brand has link groups.
 */
export type FooterColumnGroup = readonly FooterColumn[]

/** A contact or social destination rendered as an icon in the footer. */
export type SocialLink = {
  label: string
  href: string
  /** Icon key; the footer's icon map resolves it to a Font Awesome icon. */
  icon: "github" | "mail" | "linkedin" | "twitter" | "instagram" | "youtube" | "facebook"
  external: boolean
}

/**
 * A social or contact entry as navigation.json writes it. The `mail` entry
 * carries no `href`: `index.ts` builds its mailto: from `contactEmail`, so the
 * address is written once.
 */
export type SocialEntry = Omit<SocialLink, "href"> & { href?: string }

/** Brand identity strings that fan out into metadata, JSON-LD, and copy. */
export type Site = {
  name: string
  tagline: string
  url: string
  description: string
}

/** The ownership line rendered in the footer's bottom bar. */
export type Copyright = {
  line1: string
}

/** One theme's CSS custom property values, as bare HSL triplets. */
export type ThemeTokens = {
  label: string
  selector: string
  vars: Record<string, string>
}

/** Both palettes, keyed by theme name. */
export type ColorTokens = {
  themes: {
    light: ThemeTokens
    dark: ThemeTokens
  }
}

/** The id of a deployed property: the folder name of its app under apps/. */
export type PropertyId = "web" | "trading" | "blogging"

/** A group of links in a property's left-hand product menu. */
export type SidebarGroup = {
  /** Group heading; a group without one renders its links ungrouped. */
  label?: string
  links: readonly NavLink[]
}

/** One deployed property, as recorded in properties.json. */
export type Property = {
  id: PropertyId
  /** Canonical origin of the property, without a trailing slash. */
  url: string
  name: string
  description: string
  keywords: readonly string[]
  /** The property's product menu; empty when it has none. */
  sidebar: readonly SidebarGroup[]
}
