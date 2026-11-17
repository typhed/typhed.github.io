/**
 * Blog-only constants.
 *
 * Anything brand-level - the brand name, the tagline, the legal entity, the
 * canonical brand URL, the contact address, the copyright lines - comes from
 * `@typhed/brand` in the `shared.documents` submodule, so a change there
 * reaches every TyPhed property. Only what is genuinely specific to
 * blog.typhed.com is declared here: this site's own name, URL, description and
 * author, its access tiers, and its Clerk wiring.
 *
 * Every metadata, canonical, sitemap, robots, and JSON-LD value derives from
 * `SITE`.
 */
import { CONTACT_EMAIL, COPYRIGHT, SITE as BRAND } from "@typhed/brand"

export { CONTACT_EMAIL, COPYRIGHT }

export const SITE = {
  /** Human-facing site name (used in titles and the title template). */
  name: `${BRAND.name} Blog`,
  /** Parent brand / Organization name for JSON-LD. */
  brand: BRAND.name,
  tagline: BRAND.tagline,
  legalEntity: BRAND.legalEntity,
  /** Canonical origin of the blog. Drives metadataBase and all absolute URLs. */
  url: "https://blog.typhed.com",
  /** The main brand homepage this blog belongs to. */
  mainSiteUrl: BRAND.url,
  description:
    "Notes, essays, and deep dives from TyPhed - Engineering Tomorrow. Writing on engineering, data, and the craft of building, by Debmalya Pramanik HUF.",
  locale: "en_US",
  /** Default author for posts that do not set one in frontmatter. */
  author: "Debmalya Pramanik",
} as const

/**
 * Clerk publishable key, shared with the main typhed.com site so a session on
 * either domain is recognised on the other (they are subdomains of the same
 * root, so Clerk syncs the session automatically). It ships to the browser, so
 * it lives in a `NEXT_PUBLIC_*` variable, not a secret. When it is unset -
 * local dev without auth - `CLERK_ENABLED` is false and freemium posts render
 * ungated, matching the analytics no-op convention.
 */
export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""
export const CLERK_ENABLED = CLERK_PUBLISHABLE_KEY.length > 0

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
