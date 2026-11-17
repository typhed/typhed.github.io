"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import type { DatasetResult } from "@typhed/chart-engine";

import { cn } from "@/lib/utils";

/**
 * Surfaces exactly what happened to the uploaded data: rows in and out, gaps,
 * the assumed timezone, and every validation finding. Decision-grade data means
 * assumptions are visible, not hidden.
 */
export function DataIntegrityPanel({
  dataset,
  baseIntervalLabel,
  missingIntervals,
}: {
  dataset: DatasetResult;
  baseIntervalLabel: string;
  missingIntervals: number;
}) {
  const [open, setOpen] = React.useState(!dataset.ok);
  const detailsId = React.useId();

  const errors = dataset.issues.filter((i) => i.severity === "error");
  const warnings = dataset.issues.filter((i) => i.severity === "warning");
  const droppedRows = dataset.mappingIssues.length;

  const status = !dataset.ok
    ? { icon: <XCircle className="h-4 w-4" />, tone: "text-destructive", label: `${errors.length} integrity error${errors.length === 1 ? "" : "s"}` }
    : warnings.length > 0 || missingIntervals > 0 || droppedRows > 0
      ? { icon: <AlertTriangle className="h-4 w-4" />, tone: "text-warning", label: "Loaded with notes" }
      : { icon: <CheckCircle2 className="h-4 w-4" />, tone: "text-success", label: "Clean" };

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className={status.tone}>{status.icon}</span>
          Data integrity - {status.label}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div id={detailsId} className="space-y-4 border-t border-border px-4 py-4 text-sm">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            <Stat label="Rows parsed" value={String(dataset.stats.inputRows + droppedRows)} />
            <Stat label="Rows charted" value={String(dataset.stats.outputRows)} />
            <Stat label="Base interval" value={baseIntervalLabel} />
            <Stat label="Timezone" value="UTC" />
            <Stat label="Duplicates dropped" value={String(dataset.stats.duplicatesDropped)} />
            <Stat label="Rows skipped" value={String(droppedRows)} />
            <Stat label="Gaps (missing bars)" value={String(missingIntervals)} />
            <Stat label="Volume" value={dataset.stats.hasVolume ? "present" : "absent"} />
          </dl>

          {errors.length > 0 && (
            <IssueList tone="text-destructive" title="Errors" messages={errors.map((i) => i.message)} />
          )}
          {warnings.length > 0 && (
            <IssueList tone="text-warning" title="Warnings" messages={warnings.map((i) => i.message)} />
          )}
          {droppedRows > 0 && (
            <IssueList
              tone="text-muted-foreground"
              title="Skipped rows"
              messages={dataset.mappingIssues
                .slice(0, 8)
                .map((i) => `Row ${i.row}: ${i.reason}`)}
              extra={droppedRows > 8 ? droppedRows - 8 : 0}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function IssueList({
  tone,
  title,
  messages,
  extra = 0,
}: {
  tone: string;
  title: string;
  messages: string[];
  extra?: number;
}) {
  return (
    <div>
      <p className={cn("mb-1 text-xs font-semibold uppercase tracking-wide", tone)}>
        {title}
      </p>
      <ul className="space-y-0.5 text-xs text-muted-foreground">
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
        {extra > 0 && <li>and {extra} more...</li>}
      </ul>
    </div>
  );
}
