import Link from "next/link";
import { Github } from "lucide-react";

import {
  COPYRIGHT_LINES,
  PRIVACY_LINK,
  PRODUCTS,
  SOCIAL_LINKS,
} from "@/lib/platform";
import { SITE } from "@/lib/constants";
import { TOOLS } from "@/lib/tool-registry";
import { BrandMark } from "@/components/brand-mark";
import { ClearLocalDataButton } from "@/components/clear-local-data";
import { CopyrightYear } from "@/components/copyright-year";

/**
 * The lucide glyph for each social icon name. The canonical footer supports
 * github, linkedin, twitter, instagram, youtube, and facebook; add the glyph
 * here when a new network lands in the platform SOCIAL_LINKS.
 */
const SOCIAL_ICONS = {
  github: Github,
} as const;

const columnHeading = "text-sm font-semibold text-foreground";
const columnLink =
  "text-sm text-muted-foreground transition-colors hover:text-brand";

/**
 * The canonical five-column platform footer: brand block, Products,
 * Resources, and Contact Us over a bottom bar with the two copyright lines,
 * the privacy link, and the trading disclaimer as the site-local legal note.
 * Every column renders from the platform and tool registries - never edit
 * this component to change a link.
 */
export function SiteFooter() {
  const products = PRODUCTS.filter((p) => p.live);
  const socialIconLinks = SOCIAL_LINKS.filter((s) => s.icon !== "mail");
  const [beforeYear, afterYear] = COPYRIGHT_LINES[0].split("{year}");

  return (
    <footer className="border-t border-border bg-card bg-gradient-to-b from-brand/5 to-brand-2/5">
      <div className="container grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3 sm:col-span-2">
          <BrandMark />
          <p className="max-w-sm text-sm text-muted-foreground">
            {SITE.description}
          </p>
        </div>

        <nav aria-label="Products" className="space-y-3">
          <h2 className={columnHeading}>Products</h2>
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id}>
                <a
                  href={p.url}
                  className={columnLink}
                  {...(p.openInNewTab
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {p.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Resources" className="space-y-3">
          <h2 className={columnHeading}>Resources</h2>
          <ul className="space-y-2">
            {TOOLS.map((tool) => (
              <li key={tool.id}>
                <Link href={tool.route} className={columnLink}>
                  {tool.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className={columnHeading}>Contact Us</h2>
          <a
            href={`mailto:${SITE.contactEmail}`}
            className={`block ${columnLink}`}
          >
            {SITE.contactEmail}
          </a>
          <h3 className={columnHeading}>Social Connect</h3>
          <ul aria-label="Social media" className="flex items-center gap-2">
            {socialIconLinks.map((social) => {
              const Icon =
                SOCIAL_ICONS[social.icon as keyof typeof SOCIAL_ICONS];
              if (!Icon) return null;
              return (
                <li key={social.label}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    title={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/40 text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand"
                    {...(social.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p>
              {beforeYear}
              <CopyrightYear />
              {afterYear}
            </p>
            <p>{COPYRIGHT_LINES[1]}</p>
          </div>
          <div className="space-y-1 sm:text-right">
            <p className="flex gap-3 sm:justify-end">
              <a href={PRIVACY_LINK.href} className="hover:text-brand">
                {PRIVACY_LINK.label}
              </a>
              <ClearLocalDataButton />
            </p>
            <p>{SITE.disclaimer}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
