"use client"

import * as React from "react"
import { SignInButton, SignedInGate } from "@typhed/auth"
import { ACCESS_CATEGORIES } from "@/lib/constants"

function SignInCard() {
  return (
    <div className="border-border bg-card/50 my-8 rounded-xl border p-8 text-center">
      <p className="text-2xl" aria-hidden="true">
        {ACCESS_CATEGORIES.freemium.emoji}
      </p>
      <h2 className="font-display text-foreground mt-3 text-xl font-semibold">
        Sign in to keep reading
      </h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
        This is a freemium post. Sign in with a free TyPhed account, the same login as the main
        site, to read the rest.
      </p>
      <div className="mt-5 flex justify-center">
        <SignInButton mode="modal">
          <button
            type="button"
            className="bg-brand text-brand-foreground rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Sign in to read
          </button>
        </SignInButton>
      </div>
    </div>
  )
}

/**
 * Gate for a freemium post body: signed-in readers see the content, everyone
 * else gets a sign-in card. It is the shared SignedInGate with the blog's own
 * card; with Clerk not configured, the body renders ungated so an
 * unauthenticated build still shows every post.
 *
 * This is a soft gate. The body is compiled at build time and travels in the
 * page payload, so it is hidden, not secret - which is the right trade for
 * freemium. Genuine paid content would need a server or edge check instead.
 */
export function FreemiumGate({ children }: { children: React.ReactNode }) {
  return (
    <SignedInGate
      fallback={<SignInCard />}
      loading={
        <div className="border-border bg-card/30 my-8 h-40 animate-pulse rounded-xl border" />
      }
    >
      {children}
    </SignedInGate>
  )
}
