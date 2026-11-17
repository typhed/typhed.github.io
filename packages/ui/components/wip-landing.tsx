import * as React from "react"

import { LAUNCH_LABEL, SITE } from "@typhed/brand"
import { CountdownTimer } from "./countdown-timer"
import { LaunchProgress } from "./launch-progress"

/**
 * The "work in progress" hero: the first full-height section of the
 * single-page layout. The site chrome (header, footer, animated backdrop)
 * is supplied by the app layout, so this renders only the holding-page
 * content and snaps into view as its own viewport-height section.
 */
export function WipLanding() {
  return (
    <section className="relative flex min-h-dvh snap-start flex-col items-center justify-center px-4 py-[clamp(1rem,3vh,3rem)] text-center sm:px-6">
      {/*
        The floor and the fluid term follow the text-size control; the 4.5rem
        ceiling deliberately does not. This clamp exists so the headline fits
        inside one min-h-dvh section, and scaling the ceiling wraps it to three
        lines on a short laptop window, pushing the countdown out of view.
      */}
      <h1 className="animate-fade-up font-display text-[clamp(calc(2.25rem*var(--font-scale,1)),calc(8vmin*var(--font-scale,1)),4.5rem)] font-semibold leading-[1.05] tracking-tight">
        <span className="sr-only">{SITE.name} - </span>
        <span className="text-foreground block">Engineering</span>
        <span className="from-brand via-brand to-brand-2 block bg-gradient-to-r bg-clip-text text-transparent">
          Tomorrow
        </span>
      </h1>

      <p className="animate-fade-up text-muted-foreground mt-[clamp(0.75rem,2.5vh,1.75rem)] max-w-xl text-balance text-base sm:text-lg">
        Something Extraordinary is in the Making!
      </p>

      <CountdownTimer className="animate-fade-up mt-[clamp(1rem,4vh,3rem)]" />

      <LaunchProgress className="animate-fade-up mt-[clamp(0.75rem,3vh,2.5rem)] w-full max-w-md" />

      <p className="animate-fade-up text-muted-foreground mt-[clamp(0.5rem,2.5vh,2rem)] text-sm">
        Target Launch Date <span className="text-foreground font-medium">{LAUNCH_LABEL}</span>
      </p>
    </section>
  )
}
