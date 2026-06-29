import * as React from "react"

import { LOGIN_CTA, NAV_LINKS, SITE } from "../lib/constants"
import { BrandMark } from "./brand-mark"
import { MobileNav } from "./mobile-nav"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"

/**
 * The permanent top menu bar: brand logo (left), primary navigation, the
 * Login / Sign Up call-to-action and the light/dark switch (right). It is
 * sticky so it stays available while the single-page layout scrolls, and
 * its translucent backdrop-blur keeps content legible as sections pass
 * beneath it.
 *
 * It is a Server Component. Only the interactive parts are client
 * components: `ThemeToggle` and `MobileNav` (the small-screen menu). Both
 * the desktop nav and the mobile menu read `NAV_LINKS` from
 * `lib/constants.ts`, so the two never drift.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <a
          href="/"
          aria-label={`${SITE.name} home`}
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark />
        </a>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <Button
            asChild
            variant="default"
            size="sm"
            className="hidden md:inline-flex"
          >
            <a href={LOGIN_CTA.href}>{LOGIN_CTA.label}</a>
          </Button>

          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
