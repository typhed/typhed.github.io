"use client"

import { faLock, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons"
import { Icon } from "@typhed/ui/components/icon"

import { FEATURES, useEntitlements, type FeatureId } from "@/lib/entitlements"

/** Gate a paid tool. Free features pass through; pro features show a lock. */
export function Entitled({ feature, children }: { feature: FeatureId; children: React.ReactNode }) {
  const entitlements = useEntitlements()

  if (!entitlements.isLoaded) {
    return <div className="h-40 animate-pulse rounded-lg bg-muted" />
  }

  if (entitlements.has(feature)) {
    return <>{children}</>
  }

  return <LockedCard feature={feature} />
}

function LockedCard({ feature }: { feature: FeatureId }) {
  const meta = FEATURES[feature]

  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon icon={faLock} className="h-5 w-5" />
      </span>
      <h3 className="font-display text-lg font-semibold">{meta.label} is a Pro tool</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Unlock it on your TyPhed account. After payment your access is approved and appears here
        automatically - no reinstall, no new login.
      </p>
      <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
        <Icon icon={faWandMagicSparkles} className="h-3.5 w-3.5 text-brand" />
        Granted to the Pro tier or the &quot;{meta.id}&quot; entitlement
      </p>
    </div>
  )
}
