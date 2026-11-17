/**
 * Blog-only constants.
 *
 * The blog's own name, URL, description and keywords live in its entry in
 * @typhed/brand properties.json; brand-level values (the brand name, tagline
 * and the main site URL) come from @typhed/brand too, so a change there
 * reaches every TyPhed property. Only what is genuinely specific to
 * blog.typhed.com is declared here: the default author and the access tiers.
 *
 * Every metadata, canonical, sitemap, robots, and JSON-LD value derives from
 * `SITE`.
 */
import { SITE as BRAND, getProperty } from "@typhed/brand"

const BLOG = getProperty("blogging")

export const SITE = {
  /** Human-facing site name (used in titles and the title template). */
  name: BLOG.name,
  /** Parent brand / Organization name for JSON-LD. */
  brand: BRAND.name,
  tagline: BRAND.tagline,
  /** Canonical origin of the blog. Drives metadataBase and all absolute URLs. */
  url: BLOG.url,
  /** The main brand homepage this blog belongs to. */
  mainSiteUrl: BRAND.url,
  description: BLOG.description,
  locale: "en_US",
  /** Default author for posts that do not set one in frontmatter. */
  author: "Debmalya Pramanik",
} as const

/** Access tier a post declares in its frontmatter. */
export type AccessCategory = "public" | "freemium"

export type AccessCategoryMeta = {
  /** Emoji glyph rendered as the post's access badge. */
  emoji: string
  /** Short human label shown beside the glyph. */
  label: string
  /** One-line explanation, used for the badge tooltip and the gate copy. */
  description: string
}

/**
 * The two access tiers, single-sourced so the glyph and label stay identical
 * on the index, the post header, and the sign-in gate. A post without an
 * `accessCategory` defaults to `public`. Paid tiers are deliberately absent
 * until they exist.
 *
 * This is blog-only: no other TyPhed property gates content this way, so it
 * does not belong in the shared brand contract.
 */
export const ACCESS_CATEGORIES: Record<AccessCategory, AccessCategoryMeta> = {
  public: {
    emoji: "👥",
    label: "Public",
    description: "Free for everyone. No account needed.",
  },
  freemium: {
    emoji: "🔓",
    label: "Freemium",
    description: "Sign in with a free account to read the full post.",
  },
} as const
