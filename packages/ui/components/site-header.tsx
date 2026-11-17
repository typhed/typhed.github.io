import * as React from "react"

import { LOGIN_CTA, NAV_LINKS, SITE } from "@typhed/brand"
import { FONT_SCALE_SCRIPT } from "../lib/font-scale"
import { BrandMark } from "./brand-mark"
import { FontSizeToggle } from "./font-size-toggle"
import { MobileNav } from "./mobile-nav"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"

/**
 * The permanent top menu bar: brand logo (left), primary navigation, the
 * Login / Sign Up call-to-action, the text-size control and the light/dark
 * switch (right). It is sticky so it stays available while the single-page
 * layout scrolls, and its translucent backdrop-blur keeps content legible as
 * sections pass beneath it.
 *
 * It is a Server Component. Only the interactive parts are client
 * components: `FontSizeToggle`, `ThemeToggle` and `MobileNav` (the
 * small-screen menu). Both the desktop nav and the mobile menu read
 * `NAV_LINKS` from `@typhed/brand`, so the two never drift. A nav link lifts
 * on hover and on keyboard focus: a translucent brand tint behind it, and its
 * text brightening from muted to full foreground, in either theme.
 *
 * It also inlines one small script, which is why the header rather than the
 * control carries it: being a Server Component this close to the top of the
 * body, its markup is parsed before any text below it paints, so the saved
 * text size is applied without a visible reflow.
 *
 * The header itself never resizes. `FontSizeToggle` only reaches the reading
 * scope the preset opens on `main`, so the toolbar, the footer, and the
 * copyright bar keep the stock type at every step.
 *
 * The call-to-action is a slot: pass `authSlot` (desktop) and
 * `mobileAuthSlot` (forwarded to `MobileNav`) to inject an auth control such
 * as a Clerk Login / UserButton. When omitted, both fall back to a plain
 * link to `LOGIN_CTA`, keeping this package free of any auth dependency.
 */
export function SiteHeader({
  authSlot,
  mobileAuthSlot,
}: {
  authSlot?: React.ReactNode
  mobileAuthSlot?: React.ReactNode
} = {}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-md">
      {/*
        Applies the saved text size before the page below paints. Everything
        readable renders after this point, so a visitor on a non-default size
        never sees 16px first. See lib/font-scale.ts.
      */}
      <script dangerouslySetInnerHTML={{ __html: FONT_SCALE_SCRIPT }} />

      <div className="container flex h-16 items-center justify-between gap-4">
        <a
          href="/"
          aria-label={`${SITE.name} home`}
          className="rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark />
        </a>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-brand/10 hover:text-foreground focus-visible:bg-brand/10 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {authSlot ? (
            <div className="hidden md:flex md:items-center">{authSlot}</div>
          ) : (
            <Button asChild variant="default" size="sm" className="hidden md:inline-flex">
              <a href={LOGIN_CTA.href}>{LOGIN_CTA.label}</a>
            </Button>
          )}

          <FontSizeToggle />
          <ThemeToggle />
          <MobileNav authSlot={mobileAuthSlot} />
        </div>
      </div>
    </header>
  )
}
