import * as React from "react"

import { LAUNCH_LABEL, SITE } from "../lib/constants"
import { AbstractBackground } from "./abstract-background"
import { BrandMark } from "./brand-mark"
import { CountdownTimer } from "./countdown-timer"
import { LaunchProgress } from "./launch-progress"
import { SiteFooter } from "./site-footer"
import { ThemeToggle } from "./theme-toggle"

/**
 * The full "work in progress" landing surface. It is intentionally
 * self-contained so the main site and any future product site can render
 * `<WipLanding />` and get an identical, on-brand holding page.
 */
export function WipLanding() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <AbstractBackground />

      <header className="relative z-10 w-full">
        <div className="container flex items-center justify-between py-[clamp(0.75rem,2vh,1.5rem)]">
          <a href="/" aria-label={`${SITE.name} home`} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BrandMark />
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-[clamp(1rem,3vh,3rem)] text-center sm:px-6">
        <h1 className="animate-fade-up font-display text-[clamp(2.25rem,8vmin,4.5rem)] font-semibold leading-[1.05] tracking-tight">
          <span className="sr-only">{SITE.name} - </span>
          <span className="block text-foreground">Engineering</span>
          <span className="block bg-gradient-to-r from-brand via-brand to-brand-2 bg-clip-text text-transparent">
            Tomorrow
          </span>
        </h1>

        <p className="mt-[clamp(0.75rem,2.5vh,1.75rem)] max-w-xl animate-fade-up text-balance text-base text-muted-foreground sm:text-lg">
          Something Extraordinary is in the Making!
        </p>

        <CountdownTimer className="mt-[clamp(1rem,4vh,3rem)] animate-fade-up" />

        <LaunchProgress className="mt-[clamp(0.75rem,3vh,2.5rem)] w-full max-w-md animate-fade-up" />

        <p className="mt-[clamp(0.5rem,2.5vh,2rem)] animate-fade-up text-sm text-muted-foreground">
          Target Launch Date{" "}
          <span className="font-medium text-foreground">{LAUNCH_LABEL}</span>
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
