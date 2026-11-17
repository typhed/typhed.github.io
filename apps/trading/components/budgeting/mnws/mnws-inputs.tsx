"use client"

import { fmtDisplayDate } from "@/lib/format"
import type { BonusEntry, MnwsMeta, MnwsSettings, SalaryEntry } from "@/lib/budgeting/mnws/types"
import { RETURN_MAX, RETURN_MIN } from "@/lib/budgeting/mnws/types"
import { compareIso } from "@/lib/budgeting/mnws/dates"
import { blankBonusEntry, makeSalaryEntry } from "@/lib/budgeting/mnws/defaults"
import { NumberField, TextField, ToolCard } from "@/components/tools/controls"
import {
  AddRowButton,
  DateCell,
  dropRow,
  NumberCell,
  patchRow,
  RemoveRowButton,
  SortRowsButton,
  TextCell,
} from "@/components/tools/editable-table"

/** The rows sorted by date in the given direction; equal dates keep their order. */
function sortByDate<T extends { date: string }>(rows: T[], direction: "asc" | "desc"): T[] {
  const sign = direction === "asc" ? 1 : -1
  return [...rows].sort((a, b) => sign * compareIso(a.date, b.date))
}

/**
 * The row with the latest date, in a single pass. Rows render in stored order
 * (sorting them for display made rows jump mid-edit), so the "current" salary
 * for a new row has to be found by date rather than taken from the top row.
 */
function latestByDate<T extends { date: string }>(rows: T[]): T | undefined {
  return rows.reduce<T | undefined>(
    (latest, row) => (latest === undefined || compareIso(row.date, latest.date) > 0 ? row : latest),
    undefined,
  )
}

/**
 * Wraps a bonus cell so it carries a visible label below `lg` (where the header
 * row is hidden), then dissolves into the grid at `lg` via `display:contents`
 * so the labelled cells still line up under the shared column headers.
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="lg:contents">
      <span className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">
        {label}
      </span>
      {children}
    </div>
  )
}

/** Salary credits: each applies the FOLLOWING month and carries forward. */
function SalaryEditor({
  salaries,
  today,
  onChange,
}: {
  salaries: SalaryEntry[]
  today: string
  onChange: (next: SalaryEntry[]) => void
}) {
  return (
    <div>
      <div className="space-y-2">
        <div className="hidden grid-cols-[150px_1fr_1.5fr_auto] gap-2 px-1 text-xs text-muted-foreground sm:grid">
          <span>Credit date</span>
          <span>Monthly salary (₹)</span>
          <span>Note</span>
          <span className="sr-only">Remove</span>
        </div>
        {salaries.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[150px_1fr_1.5fr_auto]"
          >
            <DateCell
              ariaLabel="Salary credit date"
              value={row.date}
              onChange={(date) => onChange(patchRow(salaries, row.id, { date }))}
            />
            <NumberCell
              ariaLabel="Monthly salary"
              value={row.amount}
              min={0}
              onChange={(amount) => onChange(patchRow(salaries, row.id, { amount }))}
            />
            <TextCell
              ariaLabel="Salary note"
              value={row.note}
              placeholder="e.g. Joined ACME, FY19 appraisal"
              onChange={(note) => onChange(patchRow(salaries, row.id, { note }))}
            />
            <RemoveRowButton
              label={`Remove salary from ${fmtDisplayDate(row.date)}`}
              onClick={() => onChange(dropRow(salaries, row.id))}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AddRowButton
          label="Add salary / increment"
          onClick={() => {
            const latest = latestByDate(salaries)
            onChange([
              ...salaries,
              makeSalaryEntry({
                date: today || "2016-01-31",
                amount: latest?.amount ?? 0,
                note: "",
              }),
            ])
          }}
        />
        <SortRowsButton
          label="salary rows"
          onSort={(direction) => onChange(sortByDate(salaries, direction))}
        />
      </div>
    </div>
  )
}

/** One-off bonuses / windfalls deployed the FOLLOWING month by an editable split. */
function BonusEditor({
  bonuses,
  today,
  onChange,
}: {
  bonuses: BonusEntry[]
  today: string
  onChange: (next: BonusEntry[]) => void
}) {
  return (
    <div>
      <div className="space-y-2">
        <div className="hidden grid-cols-[150px_1fr_5rem_5rem_5rem_1.3fr_auto] gap-2 px-1 text-xs text-muted-foreground lg:grid">
          <span>Received</span>
          <span>Amount (₹)</span>
          <span>Needs %</span>
          <span>Wants %</span>
          <span>Savings %</span>
          <span>Note</span>
          <span className="sr-only">Remove</span>
        </div>
        {bonuses.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-1 items-start gap-2 lg:grid-cols-[150px_1fr_5rem_5rem_5rem_1.3fr_auto] lg:items-center"
          >
            <Field label="Received">
              <DateCell
                ariaLabel="Bonus received date"
                value={row.date}
                onChange={(date) => onChange(patchRow(bonuses, row.id, { date }))}
              />
            </Field>
            <Field label="Amount (₹)">
              <NumberCell
                ariaLabel="Bonus amount"
                value={row.amount}
                min={0}
                onChange={(amount) => onChange(patchRow(bonuses, row.id, { amount }))}
              />
            </Field>
            <Field label="Needs %">
              <NumberCell
                ariaLabel="Bonus needs percent"
                value={row.needsPct}
                min={0}
                onChange={(needsPct) => onChange(patchRow(bonuses, row.id, { needsPct }))}
              />
            </Field>
            <Field label="Wants %">
              <NumberCell
                ariaLabel="Bonus wants percent"
                value={row.wantsPct}
                min={0}
                onChange={(wantsPct) => onChange(patchRow(bonuses, row.id, { wantsPct }))}
              />
            </Field>
            <Field label="Savings %">
              <NumberCell
                ariaLabel="Bonus savings percent"
                value={row.savingsPct}
                min={0}
                onChange={(savingsPct) => onChange(patchRow(bonuses, row.id, { savingsPct }))}
              />
            </Field>
            <Field label="Note">
              <TextCell
                ariaLabel="Bonus note"
                value={row.note}
                placeholder="e.g. Diwali bonus, FD maturity"
                onChange={(note) => onChange(patchRow(bonuses, row.id, { note }))}
              />
            </Field>
            <RemoveRowButton
              label={`Remove bonus from ${fmtDisplayDate(row.date)}`}
              onClick={() => onChange(dropRow(bonuses, row.id))}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AddRowButton
          label="Add bonus / windfall"
          onClick={() => onChange([...bonuses, blankBonusEntry(today || "2016-01-31")])}
        />
        <SortRowsButton
          label="bonus rows"
          onSort={(direction) => onChange(sortByDate(bonuses, direction))}
        />
      </div>
    </div>
  )
}

/** All editable inputs for the MNWS plan: salaries, bonuses and settings. */
export function MnwsInputs({
  meta,
  salaries,
  bonuses,
  settings,
  today,
  onMetaChange,
  onSalariesChange,
  onBonusesChange,
  onSettingsChange,
}: {
  meta: MnwsMeta
  salaries: SalaryEntry[]
  bonuses: BonusEntry[]
  settings: MnwsSettings
  today: string
  onMetaChange: (patch: Partial<MnwsMeta>) => void
  onSalariesChange: (next: SalaryEntry[]) => void
  onBonusesChange: (next: BonusEntry[]) => void
  onSettingsChange: (patch: Partial<MnwsSettings>) => void
}) {
  return (
    <div className="space-y-6">
      <ToolCard
        title="Salary history"
        description="Enter every salary and increment. Each applies from the following month and carries forward until the next entry; rows stay put while you edit - use the sort button to order them by date."
      >
        <SalaryEditor salaries={salaries} today={today} onChange={onSalariesChange} />
      </ToolCard>

      <ToolCard
        title="Bonuses & windfalls"
        description="Bonuses, FD maturities and other one-offs. Each is deployed once, the month after it is received, by its own split (default 25 % needs / 0 % wants / 75 % savings)."
      >
        <BonusEditor bonuses={bonuses} today={today} onChange={onBonusesChange} />
        <p className="mt-3 text-xs text-muted-foreground">
          To change how a windfall is split, edit its <strong>Needs %</strong>,{" "}
          <strong>Wants %</strong> and <strong>Savings %</strong> on that row (default 25 / 0 / 75).
          Splits should total 100 %; any shortfall is treated as ordinary spending and is not
          deployed.
        </p>
      </ToolCard>

      <ToolCard
        title="Plan settings"
        description="Name your plan (used in the download filename) and set the assumed annual return used for the invested-corpus projection."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Plan name"
            value={meta.planName}
            placeholder="My 50-30-20 Plan"
            onChange={(planName) => onMetaChange({ planName })}
          />
          <NumberField
            label="Assumed annual return"
            value={settings.annualReturnPct}
            min={RETURN_MIN}
            step={0.5}
            suffix="% p.a."
            onChange={(annualReturnPct) =>
              onSettingsChange({
                annualReturnPct: Math.min(RETURN_MAX, Math.max(RETURN_MIN, annualReturnPct)),
              })
            }
          />
        </div>
      </ToolCard>
    </div>
  )
}
