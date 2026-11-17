/**
 * `@typhed/brand` - the single source of truth for brand copy, the launch
 * schedule, navigation, and contact links across every TyPhed property.
 *
 * The values live in the JSON files beside this one so that a non-React
 * subdomain can read them directly. This module is the typed view of that
 * data, and it keeps the export names the component library has always used,
 * so consuming code does not care where the values came from.
 *
 * Every value is written down once. A link in navigation.json names another
 * file's value instead of copying it - a property from properties.json, a
 * social account, the contact address, the brand's name and tagline - and this
 * module resolves the reference, stopping the build when it names nothing.
 *
 * Edit the JSON, never this file, to change what the site says.
 */

import launchData from "./launch.json"
import navigationData from "./navigation.json"
import propertiesData from "./properties.json"
import siteData from "./site.json"
import type {
  Copyright,
  FooterColumnGroup,
  LinkEntry,
  NavLink,
  Property,
  PropertyId,
  Site,
  SocialEntry,
  SocialLink,
} from "./types"

export type {
  Property,
  PropertyId,
  SidebarGroup,
  ColorTokens,
  Copyright,
  FooterColumn,
  FooterColumnGroup,
  NavLink,
  Site,
  SocialLink,
  ThemeTokens,
} from "./types"

/** Brand identity: name, tagline, canonical URL, description. */
export const SITE: Site = siteData

/**
 * The deployed properties, one per app under apps/. Each app reads its own
 * entry for its name, canonical URL, description and keywords, and the shared
 * shell renders the entry's sidebar groups as the property's product menu.
 * Footer links reach a property by its id, so its URL lives only here.
 */
export const PROPERTIES: Readonly<Record<PropertyId, Property>> =
  propertiesData.properties as Record<PropertyId, Property>

/** One property by id. */
export function getProperty(id: PropertyId): Property {
  return PROPERTIES[id]
}

/**
 * The brand layer's own origin, with any trailing slash removed so a path
 * appends cleanly. Every absolute link this module hands out is built from
 * it, which keeps the domain written down exactly once, in `site.json`.
 */
const BRAND_ORIGIN = SITE.url.replace(/\/+$/, "")

/**
 * Expand one contract `href` into a destination that still works when the
 * link is rendered on another property.
 *
 * The contract is written from the brand site's point of view, so a page
 * `typhed.com` hosts is stored as the root-relative path it has there, such
 * as `/about` or `/permalink/conduct.html`. That path is only correct while
 * the page carrying it is also on `typhed.com`. Rendered by the shared header
 * or footer on `blog.typhed.com`, the browser resolves it against the blog
 * and lands on a page that was never deployed there. Expanding it against
 * `BRAND_ORIGIN` points every property at the one page that exists.
 *
 * Anything already unambiguous is returned untouched: an absolute URL, a
 * protocol-relative URL, a `mailto:`, and the `#` placeholder that stands in
 * until a destination exists.
 *
 * Exported so a subdomain can build its own link to a brand page the same
 * way, rather than writing the domain down a second time.
 */
export function resolveBrandHref(href: string): string {
  const isBrandPath = href.startsWith("/") && !href.startsWith("//")
  return isBrandPath ? `${BRAND_ORIGIN}${href}` : href
}

/**
 * Launch target, expressed in UTC with the IST offset already applied so the
 * countdown reads correctly from every timezone. See `launch.json`.
 */
export const LAUNCH_DATE = new Date(launchData.date)

/** Start of the journey, used as the 0% point of the launch progress bar. */
export const LAUNCH_START_DATE = new Date(launchData.startDate)

/** Human-readable launch instant, shown beside the countdown. */
export const LAUNCH_LABEL: string = launchData.label

/**
 * The ownership line for the footer's bottom bar. The template's `{year}` is
 * stamped at module load, so no annual maintenance is needed, and `{name}` and
 * `{tagline}` come from site.json rather than a second copy of them.
 */
export const COPYRIGHT: Copyright = {
  line1: navigationData.copyright.line1Template
    .replace("{year}", String(new Date().getFullYear()))
    .replace("{name}", SITE.name)
    .replace("{tagline}", SITE.tagline),
}

/** Contact address surfaced in the footer (no phone / postal address yet). */
export const CONTACT_EMAIL: string = navigationData.contactEmail

/**
 * Social and contact links shown as the footer's icon row. To add a network,
 * append an entry to `navigation.json` with one of the supported `icon` names
 * in `types.ts` - no component change is needed. The `mail` entry is the
 * contact address: it carries no `href`, because its mailto: is built from
 * `CONTACT_EMAIL`, and the footer renders it as a text link, not an icon.
 */
export const SOCIAL_LINKS: readonly SocialLink[] = (
  navigationData.social as readonly SocialEntry[]
).map((entry) => ({
  ...entry,
  href: entry.icon === "mail" ? `mailto:${CONTACT_EMAIL}` : resolveBrandHref(entry.href ?? "#"),
}))

/**
 * Turn one navigation.json entry into the link a component renders. An entry
 * names its destination in exactly one way (see `LinkEntry` in `types.ts`): a
 * path or URL in `href`, a property by id, or a social account by icon key.
 * An entry that names no destination, more than one, or one that does not
 * exist throws at module load, so the build stops instead of shipping a dead
 * link.
 */
function resolveEntry(entry: LinkEntry): NavLink {
  const { label, href, property, social } = entry
  const destinations = [href, property, social].filter((value) => value !== undefined)
  if (destinations.length !== 1) {
    throw new Error(`navigation.json: "${label}" needs exactly one of href, property, or social`)
  }

  if (property !== undefined) {
    const target = PROPERTIES[property as PropertyId]
    if (!target) throw new Error(`navigation.json: "${label}" names unknown property "${property}"`)
    const origin = target.url.replace(/\/+$/, "")
    return { label, href: `${origin}/`, ...(origin === BRAND_ORIGIN ? {} : { external: true }) }
  }

  if (social !== undefined) {
    const account = SOCIAL_LINKS.find((link) => link.icon === social)
    if (!account) {
      throw new Error(`navigation.json: "${label}" names unknown social account "${social}"`)
    }
    return { label, href: account.href, ...(account.external ? { external: true } : {}) }
  }

  return {
    label,
    href: resolveBrandHref(href as string),
    ...(entry.external ? { external: true } : {}),
  }
}

/** `resolveEntry` mapped over a list of entries, preserving their order. */
function resolveEntries(entries: readonly LinkEntry[]): readonly NavLink[] {
  return entries.map(resolveEntry)
}

/**
 * Primary header navigation. The first link is the brand hub itself, labelled
 * with the brand's name and tagline from site.json rather than a second copy of
 * them; the rest come from navigation.json.
 */
export const NAV_LINKS: readonly NavLink[] = [
  { label: `${SITE.name} - ${SITE.tagline}`, href: resolveBrandHref("/") },
  ...resolveEntries(navigationData.nav),
]

/**
 * The header's primary call-to-action, shared by the desktop bar and the
 * mobile menu so the label and destination stay in one place.
 */
export const LOGIN_CTA: NavLink = resolveEntry(navigationData.loginCta)

/**
 * The products the brand layer points visitors at. Each entry names its
 * property by id, so its URL comes from properties.json and, being another
 * subdomain, it opens in a new tab.
 */
export const PRODUCT_LINKS: readonly NavLink[] = resolveEntries(
  navigationData.footer.products.links,
)

/**
 * Reading, evidence, hiring, and pricing. The blog is named by its property
 * id and the career page by the LinkedIn social entry, so neither URL is
 * written twice; pricing is a page on the brand site and stays a placeholder
 * until it exists.
 */
export const RESOURCE_LINKS: readonly NavLink[] = resolveEntries(
  navigationData.footer.resources.links,
)

/** Legal link shown on the right of the footer's bottom bar. */
export const PRIVACY_LINK: NavLink = resolveEntry(navigationData.privacy)

/**
 * Legal reading. The privacy policy heads this column rather than being
 * repeated in `navigation.json`, so the column and the bottom bar link can
 * never end up pointing at different pages.
 */
export const DISCLAIMER_LINKS: readonly NavLink[] = [
  PRIVACY_LINK,
  ...resolveEntries(navigationData.footer.disclaimer.links),
]

/**
 * How the outside contributes: the code of conduct and the contributing
 * guidelines, both placeholders until the published pages exist.
 */
export const COMMUNITY_LINKS: readonly NavLink[] = resolveEntries(
  navigationData.footer.community.links,
)

/**
 * The three middle footer columns, in render order. Each entry is one column
 * of the grid: PRODUCTS and RESOURCES carry a single group each, and the third
 * stacks DISCLAIMER over COMMUNITY so the footer keeps five equal columns. The
 * brand column (the lockup alone) and the Contact column are rendered
 * separately, as they hold non-list content.
 */
export const FOOTER_COLUMN_GROUPS: readonly FooterColumnGroup[] = [
  [{ heading: navigationData.footer.products.heading, links: PRODUCT_LINKS }],
  [{ heading: navigationData.footer.resources.heading, links: RESOURCE_LINKS }],
  [
    { heading: navigationData.footer.disclaimer.heading, links: DISCLAIMER_LINKS },
    { heading: navigationData.footer.community.heading, links: COMMUNITY_LINKS },
  ],
]
