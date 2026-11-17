import type { Metadata } from "next"

import { SITE } from "@typhed/brand"

export const metadata: Metadata = {
  title: "About Us",
  description: `About ${SITE.name} - ${SITE.tagline}.`,
  alternates: { canonical: "/about/" },
}

export default function AboutPage() {
  return (
    <section className="relative flex min-h-dvh snap-start flex-col items-center justify-center px-4 py-[clamp(1rem,3vh,3rem)] text-center sm:px-6">
      <h1 className="animate-fade-up font-display text-[clamp(2rem,7vmin,4rem)] leading-[1.05] font-semibold tracking-tight">
        <span className="block text-foreground">About</span>
        <span className="block bg-linear-to-r from-brand via-brand to-brand-2 bg-clip-text text-transparent">
          {SITE.name}
        </span>
      </h1>

      <p className="mt-[clamp(0.75rem,2.5vh,1.75rem)] max-w-xl animate-fade-up text-base text-balance text-muted-foreground sm:text-lg">
        Our story is being written. {SITE.tagline} — more about {SITE.name} is coming soon.
      </p>
    </section>
  )
}
