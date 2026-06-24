import * as React from "react"

import { LAUNCH_LABEL, SITE } from "../lib/constants"
import { AbstractBackground } from "./abstract-background"
import { BrandMark } from "./brand-mark"
import { CountdownTimer } from "./countdown-timer"
import { SiteFooter } from "./site-footer"
import { ThemeToggle } from "./theme-toggle"

/**
 * The full "work in progress" landing surface. It is intentionally
 * self-contained so the main site and any future product site can render
 * `<WipLanding />` and get an identical, on-brand holding page.
 */
export function WipLanding() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <AbstractBackground />

      <header className="relative z-10 w-full">
        <div className="container flex items-center justify-between py-6">
          <a href="/" aria-label={`${SITE.name} home`} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BrandMark />
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="animate-fade-up font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          <span className="sr-only">{SITE.name} - </span>
          <span className="block text-foreground">Engineering</span>
          <span className="block bg-gradient-to-r from-brand via-brand to-brand-2 bg-clip-text text-transparent">
            Tomorrow
          </span>
        </h1>

        <p className="mt-7 max-w-xl animate-fade-up text-balance text-base text-muted-foreground sm:text-lg">
          Something Extraordinary is in the Making!
        </p>

        <CountdownTimer className="mt-12 animate-fade-up" />

        <p className="mt-10 animate-fade-up text-sm text-muted-foreground">
          Target launch{" "}
          <span className="font-medium text-foreground">{LAUNCH_LABEL}</span>
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
