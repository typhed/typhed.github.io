"use client"

import { Lock, Sparkles } from "lucide-react"

import { FEATURES, useEntitlements, type FeatureId } from "@/lib/entitlements"

/** Gate a paid tool. Free features pass through; pro features show a lock. */
export function Entitled({ feature, children }: { feature: FeatureId; children: React.ReactNode }) {
  const entitlements = useEntitlements()

  if (!entitlements.isLoaded) {
    return <div className="bg-muted h-40 animate-pulse rounded-lg" />
  }

  if (entitlements.has(feature)) {
    return <>{children}</>
  }

  return <LockedCard feature={feature} />
}

function LockedCard({ feature }: { feature: FeatureId }) {
  const meta = FEATURES[feature]

  return (
    <div className="border-border bg-card rounded-lg border border-dashed p-10 text-center">
      <span className="bg-brand/10 text-brand mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <Lock className="h-5 w-5" />
      </span>
      <h3 className="font-display text-lg font-semibold">{meta.label} is a Pro tool</h3>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
        Unlock it on your TyPhed account. After payment your access is approved and appears here
        automatically - no reinstall, no new login.
      </p>
      <p className="border-border text-muted-foreground mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
        <Sparkles className="text-brand h-3.5 w-3.5" />
        Granted to the Pro tier or the &quot;{meta.id}&quot; entitlement
      </p>
    </div>
  )
}
