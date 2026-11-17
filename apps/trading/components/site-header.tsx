import Link from "next/link";

import {
  NAV_GROUPS,
  PRODUCT_NAV_LINKS,
  SITE,
  SITE_NAV_LINKS,
} from "@/lib/constants";
import { BrandMark } from "@/components/brand-mark";
import { AuthButtons } from "@/components/auth-buttons";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavDropdown } from "@/components/nav-dropdown";
import { MobileNav } from "@/components/mobile-nav";

const linkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

/**
 * Sticky, blurred top bar matching the sibling TyPhed sites. Right-cluster
 * order is a platform decision: primary nav, auth control, theme toggle,
 * mobile menu - do not reorder per site.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="rounded-md bg-brand/15 px-1.5 py-0.5 text-xs uppercase tracking-wider text-brand">
            {SITE.shortName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <nav
            className="hidden items-center gap-6 md:flex"
            aria-label="Primary"
          >
            {SITE_NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
            {NAV_GROUPS.map((group) => (
              <NavDropdown
                key={group.label}
                label={group.label}
                items={group.items}
              />
            ))}
            {PRODUCT_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={linkClass}
                {...(link.newTab
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <AuthButtons />
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
