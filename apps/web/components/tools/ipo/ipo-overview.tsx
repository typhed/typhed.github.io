"use client";

import { cn } from "@/lib/utils";
import { fmtInr, fmtNumber, fmtPercent } from "@/lib/format";
import type { IpoMeta } from "@/lib/ipo/types";
import type { IpoMetrics } from "@/lib/ipo/analytics";
import { StatTile } from "@/components/tools/controls";

function countdownLabel(days: number): string | null {
  if (!Number.isFinite(days)) return null;
  if (days > 1) return `Lists in ${days} days`;
  if (days === 1) return "Lists tomorrow";
  if (days === 0) return "Lists today";
  if (days === -1) return "Listed yesterday";
  return `Listed ${Math.abs(days)} days ago`;
}

export function IpoOverview({ meta, metrics }: { meta: IpoMeta; metrics: IpoMetrics }) {
  const countdown = countdownLabel(metrics.daysToListing);
  const gainTone = metrics.listingGainPct >= 0 ? "positive" : "negative";

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {meta.companyName || "Untitled IPO"}
            </h2>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                meta.applicationType === "SME"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  : "border-brand/30 bg-brand/10 text-brand",
              )}
            >
              {meta.applicationType}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Price band {fmtInr(meta.priceBand.min, 0)} - {fmtInr(meta.priceBand.max, 0)} &middot; Lot{" "}
            {fmtNumber(meta.lotSize, 0)} shares &middot; Min investment {fmtInr(metrics.minInvestment, 0)}
          </p>
        </div>
        {countdown && (
          <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            {countdown}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Price band"
          value={`${fmtInr(meta.priceBand.min, 0)} - ${fmtInr(meta.priceBand.max, 0)}`}
          note="per share"
        />
        <StatTile label="Lot size" value={fmtNumber(meta.lotSize, 0)} note="shares per lot" />
        <StatTile
          label="Min investment"
          value={fmtInr(metrics.minInvestment, 0)}
          note="at upper band"
        />
        <StatTile label="Latest GMP" value={fmtInr(metrics.latestGmp, 0)} tone="brand" />
        <StatTile
          label="Est. listing gain"
          value={Number.isFinite(metrics.listingGainPct) ? fmtPercent(metrics.listingGainPct, 1) : "-"}
          tone={gainTone}
          note={`est. ${fmtInr(metrics.estListingPrice, 0)}`}
        />
        <StatTile
          label="Est. profit / lot"
          value={fmtInr(metrics.profitPerLot, 0)}
          tone={metrics.profitPerLot >= 0 ? "positive" : "negative"}
          note="if GMP holds"
        />
      </div>
    </section>
  );
}
