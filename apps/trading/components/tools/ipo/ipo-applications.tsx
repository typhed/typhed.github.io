"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"

import { cn } from "@typhed/ui/lib/utils"
import { fmtInr, fmtPercent } from "@/lib/format"
import type {
  Application,
  ApplicationCategory,
  ContributionMode,
  SubscriptionCategory,
  SubscriptionRow,
} from "@/lib/ipo/types"
import { APPLICATION_CATEGORIES } from "@/lib/ipo/types"
import type { ApplicationMetrics } from "@/lib/ipo/applications"
import { probabilityOfAllotment } from "@/lib/ipo/applications"
import { makeApplication, makeContributor, makeSubscriptionRow } from "@/lib/ipo/defaults"
import { NumberField, Segmented, StatTile, ToolCard } from "@/components/tools/controls"
import {
  AddRowButton,
  dropRow,
  NumberCell,
  patchRow,
  RemoveRowButton,
  SelectCell,
  TextCell,
} from "@/components/tools/editable-table"

const CATEGORY_OPTIONS = APPLICATION_CATEGORIES.map((c) => ({ value: c, label: c }))

// Shared by the corpus-input and allotment segmented controls.
const ENTRY_MODE_OPTIONS = [
  { value: "total", label: "Total Amount" },
  { value: "detailed", label: "Quantity & Price" },
] as const

// Fixed-category display labels: uppercase throughout except sHNI / bHNI.
const SUB_LABEL: Record<SubscriptionCategory, string> = {
  RETAIL: "RETAIL",
  sHNI: "sHNI",
  bHNI: "bHNI",
  SHAREHOLDER: "SHAREHOLDER",
  QIB: "QIB",
  EMPLOYEE: "EMPLOYEE",
  OVERALL: "OVERALL",
  CUSTOM: "CUSTOM",
}

function isApplicationCategory(c: SubscriptionCategory): c is ApplicationCategory {
  return (APPLICATION_CATEGORIES as readonly string[]).includes(c)
}

/** Compact probability for the narrow subscription panel. */
function formatPercentShort(p: number | null): string {
  if (p === null) return "-"
  if (p >= 1) return "100%"
  return `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`
}

/** Long, badge-friendly probability label for the application header. */
function formatProbability(category: ApplicationCategory, p: number | null): string {
  if (p === null || p >= 1) return formatPercentShort(p)
  const pct = formatPercentShort(p)
  if (category === "RETAIL") return `${pct} · ~1 in ${Math.round(1 / p)}`
  if (category === "SHAREHOLDER") return pct
  return `>= ${pct}`
}

export function IpoApplications({
  applications,
  subscription,
  metrics,
  lotSize,
  onApplicationsChange,
  onSubscriptionChange,
}: {
  applications: Application[]
  subscription: SubscriptionRow[]
  metrics: ApplicationMetrics[]
  lotSize: number
  onApplicationsChange: (next: Application[]) => void
  onSubscriptionChange: (next: SubscriptionRow[]) => void
}) {
  const metricsById = React.useMemo(() => new Map(metrics.map((m) => [m.id, m])), [metrics])

  const updateApp = (id: string, patch: Partial<Application>) =>
    onApplicationsChange(patchRow(applications, id, patch))

  const updateContributors = (appId: string, next: Application["contributors"]) =>
    updateApp(appId, { contributors: next })

  return (
    <ToolCard
      title="IPO Application Tracker"
      description="Track your IPO Application, Expected & Actual Profit (on allotment); Allotment Probability is as per SEBI Rules."
    >
      <div className="grid gap-6 lg:grid-cols-[70fr_30fr]">
        {/* LEFT - applications */}
        <div className="min-w-0 space-y-4">
          {applications.length === 0 && (
            <p className="border-border text-muted-foreground rounded-md border border-dashed p-4 text-sm">
              No applications yet. Add one to start tracking. Each application can carry multiple
              contributors - for example, a ₹50L bHNI application funded by two people - and every
              contributor&apos;s share, expected profit and, once allotted, take-home profit is
              split by their contribution automatically.
            </p>
          )}
          {applications.map((app) => {
            const m = metricsById.get(app.id)
            return (
              <ApplicationCard
                key={app.id}
                app={app}
                metrics={m}
                lotSize={lotSize}
                onNameChange={(name) => updateApp(app.id, { name })}
                onCategoryChange={(category) => updateApp(app.id, { category })}
                onContributionModeChange={(contributionMode) =>
                  updateApp(app.id, { contributionMode })
                }
                onAllottedChange={(allotted) => updateApp(app.id, { allotted })}
                onAllotmentChange={(allotment) => updateApp(app.id, { allotment })}
                onContributorsChange={(next) => updateContributors(app.id, next)}
                onRemove={() => onApplicationsChange(dropRow(applications, app.id))}
              />
            )
          })}
          <AddRowButton
            label="Add New Application"
            onClick={() =>
              onApplicationsChange([
                ...applications,
                makeApplication({
                  name: "New Application",
                  category: "RETAIL",
                  contributionMode: "total",
                  allotted: false,
                  allotment: {
                    mode: "total",
                    quantityAllotted: 0,
                    sellingPrice: 0,
                    totalAmount: 0,
                  },
                  contributors: [
                    makeContributor({ name: "Contributor Name", units: 0, price: 0, amount: 0 }),
                  ],
                }),
              ])
            }
          />
        </div>

        {/* RIGHT - subscription status */}
        <SubscriptionPanel subscription={subscription} onChange={onSubscriptionChange} />
      </div>
    </ToolCard>
  )
}

function ApplicationCard({
  app,
  metrics,
  lotSize,
  onNameChange,
  onCategoryChange,
  onContributionModeChange,
  onAllottedChange,
  onAllotmentChange,
  onContributorsChange,
  onRemove,
}: {
  app: Application
  metrics: ApplicationMetrics | undefined
  lotSize: number
  onNameChange: (name: string) => void
  onCategoryChange: (category: ApplicationCategory) => void
  onContributionModeChange: (mode: ContributionMode) => void
  onAllottedChange: (allotted: boolean) => void
  onAllotmentChange: (allotment: Application["allotment"]) => void
  onContributorsChange: (next: Application["contributors"]) => void
  onRemove: () => void
}) {
  const contributors = app.contributors
  const isTotalMode = app.contributionMode === "total"
  const contribMetricsById = new Map((metrics?.contributors ?? []).map((c) => [c.id, c]))
  const applicationTotal = metrics?.applicationTotal ?? 0
  const probText = metrics ? formatProbability(app.category, metrics.probabilityOfWinning) : "-"
  const actualTone = (metrics?.actualProfit ?? 0) >= 0 ? "positive" : "negative"

  return (
    <div className="border-border bg-background rounded-lg border p-4">
      {/* header */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[10rem] flex-1">
          <TextCell ariaLabel="Application Name" value={app.name} onChange={onNameChange} />
        </div>
        <div className="w-36">
          <SelectCell
            ariaLabel="Application Category"
            value={app.category}
            options={CATEGORY_OPTIONS}
            onChange={onCategoryChange}
          />
        </div>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={app.allotted}
            onChange={(e) => onAllottedChange(e.target.checked)}
            className="border-input h-4 w-4 rounded"
            style={{ accentColor: "hsl(var(--brand))" }}
          />
          ALLOTTED
        </label>
        <RemoveRowButton label={`Remove ${app.name}`} onClick={onRemove} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="border-brand/30 bg-brand/10 text-brand rounded-full border px-2 py-0.5 font-medium">
          Win Probability: {probText}
        </span>
        {(metrics?.flags ?? []).map((flag) => (
          <span key={flag} className="text-warning inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {flag}
          </span>
        ))}
      </div>

      {/* corpus input mode */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Corpus Input
        </p>
        <Segmented
          options={ENTRY_MODE_OPTIONS}
          value={app.contributionMode}
          onChange={onContributionModeChange}
        />
      </div>

      {/* contributor table */}
      <div className="mt-3">
        <div className="text-muted-foreground hidden items-center gap-2 px-1 pb-1 text-[11px] font-medium sm:flex">
          <span className="w-6" />
          <span className="min-w-[8rem] flex-1">Contributor(s) Details</span>
          <span className="w-16 text-right">QTY</span>
          <span className="w-20 text-right">PRICE</span>
          <span className="w-24 text-right">TOTAL</span>
          <span className="w-16 text-right">% SHARE</span>
          <span className="w-8" />
        </div>
        <div className="space-y-2">
          {contributors.map((c, i) => {
            const cm = contribMetricsById.get(c.id)
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground w-6 text-xs tabular-nums">#{i + 1}</span>
                <div className="min-w-[8rem] flex-1">
                  <TextCell
                    ariaLabel="Contributor Name"
                    value={c.name}
                    onChange={(name) =>
                      onContributorsChange(patchRow(contributors, c.id, { name }))
                    }
                  />
                </div>
                <div className="w-16">
                  <NumberCell
                    ariaLabel="# Units"
                    value={c.units}
                    min={0}
                    disabled={isTotalMode}
                    onChange={(units) =>
                      onContributorsChange(patchRow(contributors, c.id, { units }))
                    }
                  />
                </div>
                <div className="w-20">
                  <NumberCell
                    ariaLabel="Price/Share"
                    value={c.price}
                    min={0}
                    disabled={isTotalMode}
                    onChange={(price) =>
                      onContributorsChange(patchRow(contributors, c.id, { price }))
                    }
                  />
                </div>
                {isTotalMode ? (
                  <div className="w-24">
                    <NumberCell
                      ariaLabel="Total Amount"
                      value={c.amount}
                      min={0}
                      onChange={(amount) =>
                        onContributorsChange(patchRow(contributors, c.id, { amount }))
                      }
                    />
                  </div>
                ) : (
                  <span className="w-24 text-right text-sm tabular-nums">
                    {fmtInr(cm?.contribution ?? c.units * c.price, 0)}
                  </span>
                )}
                <span className="text-muted-foreground w-16 text-right text-sm tabular-nums">
                  {fmtPercent(cm?.sharePct ?? 0, 1)}
                </span>
                <RemoveRowButton
                  label={`Remove ${c.name}`}
                  onClick={() => onContributorsChange(dropRow(contributors, c.id))}
                />
              </div>
            )
          })}
        </div>

        {/* totals row */}
        <div className="border-border mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
          <span className="w-6" />
          <span className="min-w-[8rem] flex-1 text-sm font-medium">Total Corpus</span>
          <span className="w-16" />
          <span className="w-20" />
          <span className="w-24 text-right text-sm font-semibold tabular-nums">
            {fmtInr(applicationTotal, 0)}
          </span>
          <span className="text-muted-foreground w-16 text-right text-sm tabular-nums">100%</span>
          <span className="w-8" />
        </div>

        <AddRowButton
          label="Add Contributor"
          onClick={() =>
            onContributorsChange([
              ...contributors,
              makeContributor({ name: "Contributor", units: 0, price: 0, amount: 0 }),
            ])
          }
        />
      </div>

      {/* profit tiles */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Best-Case Profit" value={fmtInr(metrics?.bestCaseProfit ?? 0, 0)} />
        <StatTile
          label="Expected Profit"
          value={fmtInr(metrics?.expectedProfit ?? 0, 0)}
          tone="brand"
          note="assumes full allotment"
        />
        {app.allotted && (
          <StatTile
            label="Actual Profit"
            value={fmtInr(metrics?.actualProfit ?? 0, 0)}
            tone={actualTone}
          />
        )}
      </div>

      {/* allotment panel */}
      {app.allotted && (
        <div className="border-border bg-card mt-4 rounded-md border p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Allotment
            </p>
            <Segmented
              options={ENTRY_MODE_OPTIONS}
              value={app.allotment.mode}
              onChange={(mode) => onAllotmentChange({ ...app.allotment, mode })}
            />
          </div>
          {app.allotment.mode === "detailed" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                label="Quantity Allotted"
                value={app.allotment.quantityAllotted}
                min={0}
                step={lotSize}
                onChange={(quantityAllotted) =>
                  onAllotmentChange({ ...app.allotment, quantityAllotted })
                }
              />
              <NumberField
                label="Selling Price"
                value={app.allotment.sellingPrice}
                min={0}
                suffix="₹"
                onChange={(sellingPrice) => onAllotmentChange({ ...app.allotment, sellingPrice })}
              />
            </div>
          ) : (
            <NumberField
              label="Total Amount"
              value={app.allotment.totalAmount}
              suffix="₹"
              onChange={(totalAmount) => onAllotmentChange({ ...app.allotment, totalAmount })}
            />
          )}
          <div className="mt-3">
            <p className="text-muted-foreground mb-1 text-xs">Profit share per contributor</p>
            <ul className="space-y-1 text-sm">
              {contributors.map((c) => {
                const cm = contribMetricsById.get(c.id)
                return (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {c.name}{" "}
                      <span className="text-muted-foreground">
                        ({fmtPercent(cm?.sharePct ?? 0, 0)})
                      </span>
                    </span>
                    <span
                      className={cn(
                        "tabular-nums",
                        (cm?.actualProfit ?? 0) >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {fmtInr(cm?.actualProfit ?? 0, 0)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function SubscriptionPanel({
  subscription,
  onChange,
}: {
  subscription: SubscriptionRow[]
  onChange: (next: SubscriptionRow[]) => void
}) {
  const maxTimes = Math.max(
    1,
    ...subscription.map((r) => (Number.isFinite(r.timesSubscribed) ? r.timesSubscribed : 0)),
  )

  // OVERALL is always pinned last; user-added CUSTOM rows sit above it.
  const overallRow = subscription.find((r) => r.category === "OVERALL")
  const leadingRows = subscription.filter((r) => r.category !== "OVERALL")

  const addCustom = () => {
    const custom = makeSubscriptionRow({
      category: "CUSTOM",
      label: "NEW CATEGORY",
      timesSubscribed: 0,
    })
    const overallIdx = subscription.findIndex((r) => r.category === "OVERALL")
    const next =
      overallIdx === -1
        ? [...subscription, custom]
        : [...subscription.slice(0, overallIdx), custom, ...subscription.slice(overallIdx)]
    onChange(next)
  }

  const renderRow = (row: SubscriptionRow, removable: boolean) => {
    const isCustom = row.category === "CUSTOM"
    const isApp = isApplicationCategory(row.category)
    const p = isApplicationCategory(row.category)
      ? probabilityOfAllotment(row.category, row.timesSubscribed)
      : null
    const barPct = Math.min(100, (row.timesSubscribed / maxTimes) * 100)
    const label = isCustom ? (row.label ?? "") : SUB_LABEL[row.category]

    return (
      <div key={row.id}>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {isCustom ? (
              <TextCell
                ariaLabel="Custom category name"
                value={row.label ?? ""}
                onChange={(next) => onChange(patchRow(subscription, row.id, { label: next }))}
              />
            ) : (
              <span className="block truncate px-1 py-1.5 text-sm font-medium">{label}</span>
            )}
          </div>
          <div className="w-24">
            <NumberCell
              ariaLabel={`${label || "Custom"} times subscribed`}
              value={row.timesSubscribed}
              min={0}
              onChange={(timesSubscribed) =>
                onChange(patchRow(subscription, row.id, { timesSubscribed }))
              }
            />
          </div>
          {removable ? (
            <RemoveRowButton
              label={`Remove ${label || "custom category"}`}
              onClick={() => onChange(dropRow(subscription, row.id))}
            />
          ) : (
            <span className="h-8 w-8 shrink-0" aria-hidden />
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
            <div className="bg-brand h-full rounded-full" style={{ width: `${barPct}%` }} />
          </div>
          <span className="text-muted-foreground w-16 text-right text-[11px] tabular-nums">
            {isApp ? `P ${formatPercentShort(p)}` : `${row.timesSubscribed}x`}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="border-border bg-background rounded-lg border p-4">
        <h3 className="font-display text-sm font-semibold">Subscription Status</h3>

        <div className="mt-4 space-y-3">
          {leadingRows.map((row) => renderRow(row, row.category === "CUSTOM"))}
        </div>

        <AddRowButton label="Add Custom Category" onClick={addCustom} />

        {overallRow && (
          <div className="border-border mt-3 border-t pt-3">{renderRow(overallRow, false)}</div>
        )}
      </div>
    </div>
  )
}
