"use client";

import * as React from "react";

import { fmtDisplayDate } from "@/lib/format";
import type { FinancialRow, GmpRow, IpoMeta, Milestone } from "@/lib/ipo/types";
import { sortedGmp, sortedTimeline } from "@/lib/ipo/analytics";
import { makeFinancialRow, makeGmpRow, makeMilestone } from "@/lib/ipo/defaults";
import { NumberField, Segmented, TextField } from "@/components/tools/controls";
import {
  AddRowButton,
  DateCell,
  dropRow,
  NumberCell,
  patchRow,
  RemoveRowButton,
  TextCell,
} from "@/components/tools/editable-table";

/** Issue details: name, lot size, price band, unit. */
export function MetaEditor({
  meta,
  onChange,
}: {
  meta: IpoMeta;
  onChange: (patch: Partial<IpoMeta>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          label="Company / issue name"
          value={meta.companyName}
          onChange={(companyName) => onChange({ companyName })}
        />
      </div>
      <div className="sm:col-span-2">
        <TextField
          label="NSE symbol"
          value={meta.nseSymbol}
          placeholder="SBIFUNDS"
          onChange={(nseSymbol) => onChange({ nseSymbol: nseSymbol.toUpperCase() })}
        />
      </div>
      <div className="sm:col-span-2">
        <span className="mb-1 block text-sm font-medium">Application type</span>
        <Segmented
          options={[
            { value: "MAINBOARD", label: "Mainboard" },
            { value: "SME", label: "SME" },
          ]}
          value={meta.applicationType}
          onChange={(applicationType) => onChange({ applicationType })}
        />
      </div>
      <NumberField
        label="Lot size"
        value={meta.lotSize}
        min={1}
        step={1}
        onChange={(lotSize) => onChange({ lotSize })}
      />
      <TextField
        label="Financials unit"
        value={meta.unitLabel}
        placeholder="Cr"
        onChange={(unitLabel) => onChange({ unitLabel })}
      />
      <NumberField
        label="Price band (lower)"
        value={meta.priceBand.min}
        min={0}
        suffix="₹"
        onChange={(min) => onChange({ priceBand: { ...meta.priceBand, min } })}
      />
      <NumberField
        label="Price band (upper)"
        value={meta.priceBand.max}
        min={0}
        suffix="₹"
        onChange={(max) => onChange({ priceBand: { ...meta.priceBand, max } })}
      />
    </div>
  );
}

/** IPO timeline milestones. */
export function TimelineEditor({
  milestones,
  today,
  onChange,
}: {
  milestones: Milestone[];
  today: string;
  onChange: (next: Milestone[]) => void;
}) {
  const ordered = sortedTimeline(milestones);
  return (
    <div>
      <div className="space-y-2">
        <div className="hidden grid-cols-[1fr_150px_auto] gap-2 px-1 text-xs text-muted-foreground sm:grid">
          <span>Milestone</span>
          <span>Date</span>
          <span className="sr-only">Remove</span>
        </div>
        {ordered.map((milestone) => (
          <div
            key={milestone.id}
            className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_150px_auto]"
          >
            <TextCell
              ariaLabel="Milestone label"
              value={milestone.label}
              onChange={(label) => onChange(patchRow(milestones, milestone.id, { label }))}
            />
            <DateCell
              ariaLabel="Milestone date"
              value={milestone.date}
              onChange={(date) => onChange(patchRow(milestones, milestone.id, { date }))}
            />
            <RemoveRowButton
              label={`Remove ${milestone.label}`}
              onClick={() => onChange(dropRow(milestones, milestone.id))}
            />
          </div>
        ))}
      </div>
      <AddRowButton
        label="Add milestone"
        onClick={() =>
          onChange([...milestones, makeMilestone({ label: "New milestone", date: today || "2026-01-01" })])
        }
      />
    </div>
  );
}

/** Reported GMP readings. */
export function GmpEditor({
  rows,
  onChange,
}: {
  rows: GmpRow[];
  onChange: (next: GmpRow[]) => void;
}) {
  const ordered = sortedGmp(rows);
  return (
    <div>
      <div className="space-y-2">
        <div className="hidden grid-cols-[150px_1fr_auto] gap-2 px-1 text-xs text-muted-foreground sm:grid">
          <span>Date</span>
          <span>GMP (₹)</span>
          <span className="sr-only">Remove</span>
        </div>
        {ordered.map((row) => (
          <div key={row.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[150px_1fr_auto]">
            <DateCell
              ariaLabel="GMP date"
              value={row.date}
              onChange={(date) => onChange(patchRow(rows, row.id, { date }))}
            />
            <NumberCell
              ariaLabel="GMP value"
              value={row.value}
              onChange={(value) => onChange(patchRow(rows, row.id, { value }))}
            />
            <RemoveRowButton
              label={`Remove GMP for ${fmtDisplayDate(row.date)}`}
              onClick={() => onChange(dropRow(rows, row.id))}
            />
          </div>
        ))}
      </div>
      <AddRowButton
        label="Add reading"
        onClick={() => {
          const last = ordered[ordered.length - 1];
          onChange([...rows, makeGmpRow({ date: last?.date ?? "2026-01-01", value: last?.value ?? 0 })]);
        }}
      />
    </div>
  );
}

/** Company reported financials by fiscal year. */
export function FinancialsEditor({
  rows,
  onChange,
}: {
  rows: FinancialRow[];
  onChange: (next: FinancialRow[]) => void;
}) {
  return (
    <div>
      <div className="space-y-2">
        <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-1 text-xs text-muted-foreground sm:grid">
          <span>Period</span>
          <span>Assets</span>
          <span>Revenue</span>
          <span>PAT</span>
          <span className="sr-only">Remove</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]"
          >
            <TextCell
              ariaLabel="Period"
              value={row.period}
              onChange={(period) => onChange(patchRow(rows, row.id, { period }))}
            />
            <NumberCell
              ariaLabel="Total assets"
              value={row.totalAssets}
              onChange={(totalAssets) => onChange(patchRow(rows, row.id, { totalAssets }))}
            />
            <NumberCell
              ariaLabel="Gross revenue"
              value={row.grossRevenue}
              onChange={(grossRevenue) => onChange(patchRow(rows, row.id, { grossRevenue }))}
            />
            <NumberCell
              ariaLabel="PAT"
              value={row.pat}
              onChange={(pat) => onChange(patchRow(rows, row.id, { pat }))}
            />
            <RemoveRowButton
              label={`Remove ${row.period}`}
              onClick={() => onChange(dropRow(rows, row.id))}
            />
          </div>
        ))}
      </div>
      <AddRowButton
        label="Add fiscal year"
        onClick={() =>
          onChange([...rows, makeFinancialRow({ period: "FY", totalAssets: 0, grossRevenue: 0, pat: 0 })])
        }
      />
    </div>
  );
}
