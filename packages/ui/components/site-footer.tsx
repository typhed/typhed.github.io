import * as React from "react"
import {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  type LucideIcon,
  Mail,
  Twitter,
  Youtube,
} from "lucide-react"

import {
  COMPANY_LINKS,
  CONTACT_EMAIL,
  COPYRIGHT,
  FOOTER_COLUMNS,
  PRIVACY_LINK,
  SOCIAL_LINKS,
  type SocialLink,
} from "../lib/constants"
import { cn } from "../lib/utils"
import { BrandMark } from "./brand-mark"

/**
 * Resolves the `icon` name stored on each `SOCIAL_LINKS` entry to its lucide
 * glyph, so a new social network is added by editing constants alone.
 */
const SOCIAL_ICONS: Record<SocialLink["icon"], LucideIcon> = {
  github: Github,
  mail: Mail,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
}

// The email already appears as a text link in the Contact column, so the
// `mail` entry is excluded from the social icon row to avoid showing it twice.
const SOCIAL_ICON_LINKS = SOCIAL_LINKS.filter((link) => link.icon !== "mail")

/**
 * The site footer: a brand block beside the navigation columns
 * (`FOOTER_COLUMNS`) and a Contact column (email link + social icon row),
 * over a bottom bar carrying the ownership copyright and the privacy link.
 * The legal entity name lives in the copyright bar as visible text, so it
 * still contributes to search relevance for "Debmalya Pramanik HUF".
 *
 * It is a Server Component. Columns, copy, and the social row come from
 * `lib/constants.ts`; colours come only from theme tokens (a faint brand
 * wash over `bg-card`), never hardcoded hex, so it tracks both themes.
 */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "relative z-10 w-full border-t border-border bg-card bg-gradient-to-b from-brand/5 to-brand-2/5",
        className,
      )}
    >
      <div className="container py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <BrandMark />
              <span aria-hidden="true" className="text-muted-foreground">
                —
              </span>
              {/* Matches the hero wordmark: "Engineering" in foreground,
                  "Tomorrow" in the brand gradient. */}
              <span className="font-display text-sm font-semibold tracking-tight">
                <span className="text-foreground">Engineering </span>
                <span className="bg-gradient-to-r from-brand via-brand to-brand-2 bg-clip-text text-transparent">
                  Tomorrow
                </span>
              </span>
            </div>
            <nav
              aria-label="Company"
              className="mt-6 flex flex-col gap-3"
            >
              {COMPANY_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  {...(link.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="text-sm font-semibold text-foreground">
                {column.heading}
              </h2>
              <nav
                aria-label={column.heading}
                className="mt-4 flex flex-col gap-3"
              >
                {column.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-sm text-muted-foreground transition-colors hover:text-brand"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          ))}

          <div>
            <h2 className="text-sm font-semibold text-foreground">Contact Us</h2>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-block text-sm text-muted-foreground transition-colors hover:text-brand"
            >
              {CONTACT_EMAIL}
            </a>

            {SOCIAL_ICON_LINKS.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground">
                  Social Connect
                </h3>
                <nav
                  aria-label="Social media"
                  className="mt-4 flex items-center gap-3"
                >
                  {SOCIAL_ICON_LINKS.map((link) => {
                    const Icon = SOCIAL_ICONS[link.icon]
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        aria-label={link.label}
                        title={link.label}
                        {...(link.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/40 text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    )
                  })}
                </nav>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col gap-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p>{COPYRIGHT.line1}</p>
            <p>{COPYRIGHT.line2}</p>
          </div>
          <a
            href={PRIVACY_LINK.href}
            className="transition-colors hover:text-brand"
          >
            {PRIVACY_LINK.label}
          </a>
        </div>
      </div>
    </footer>
  )
}
