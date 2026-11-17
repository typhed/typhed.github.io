"use client"

import type { ReactNode } from "react"
import { faLock } from "@fortawesome/free-solid-svg-icons"
import { Icon } from "@typhed/ui/components/icon"
import { SignInButton, SignedInGate } from "@typhed/auth"
import { Button } from "@typhed/ui/components/ui/button"

/**
 * Section-level members-only gate: a free feature that requires sign-in. Unlike
 * the whole-page AuthGate, this keeps the surrounding page fully usable and
 * swaps just one section for a locked teaser when the visitor is signed out, so
 * the feature stays visible (and advertises itself) beside the free tools.
 *
 * This is distinct from the paid `Entitled` gate: it asks only "is anyone
 * signed in", never reads `publicMetadata`, and costs nothing to unlock.
 *
 * When Clerk is disabled (no key configured) the gate is transparent so local
 * and CI builds render the feature. Like the rest of the auth surface this is a
 * client-side gate: it controls feature access and sign-in, not data secrecy.
 */
export function MembersOnly({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <SignedInGate
      fallback={<LockedFeature title={title} description={description} />}
      loading={<div className="h-40 animate-pulse rounded-lg bg-muted" />}
    >
      {children}
    </SignedInGate>
  )
}

function LockedFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon icon={faLock} className="h-5 w-5" />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        A free members-only feature. Sign in to unlock it - every other tool on this page stays
        free.
      </p>
      <div className="mt-5">
        <SignInButton mode="modal">
          <Button variant="brand" size="sm">
            Sign in to unlock
          </Button>
        </SignInButton>
      </div>
    </div>
  )
}
