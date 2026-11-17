"use client"

import type { ColumnMapping, TimeFormat } from "@typhed/chart-engine"
import { missingRequiredFields } from "@typhed/chart-engine"

import { Button } from "@typhed/ui/components/ui/button"

const REQUIRED: Array<{ key: keyof ColumnMapping; label: string }> = [
  { key: "time", label: "Timestamp" },
  { key: "open", label: "Open" },
  { key: "high", label: "High" },
  { key: "low", label: "Low" },
  { key: "close", label: "Close" },
]

const TIME_FORMATS: Array<{ value: TimeFormat; label: string }> = [
  { value: "auto", label: "Auto-detect" },
  { value: "iso", label: "ISO date-time (UTC)" },
  { value: "unix_s", label: "Unix seconds" },
  { value: "unix_ms", label: "Unix milliseconds" },
  { value: "excel", label: "Excel serial date" },
]

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/**
 * Confirm-the-mapping step. Auto-detected columns are pre-filled but nothing is
 * assumed silently - the user reviews and confirms before any candle is built.
 */
export function ColumnMapper({
  headers,
  mapping,
  onChange,
  onConfirm,
  onCancel,
}: {
  headers: string[]
  mapping: ColumnMapping
  onChange: (mapping: ColumnMapping) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const missing = missingRequiredFields(mapping)

  function set<K extends keyof ColumnMapping>(key: K, value: ColumnMapping[K]) {
    onChange({ ...mapping, [key]: value })
  }

  return (
    <div className="border-border bg-card mx-auto max-w-2xl rounded-lg border p-6">
      <h2 className="font-display text-lg font-semibold">Map your columns</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Confirm which column holds each value. Timestamps without a timezone are read as UTC.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {REQUIRED.map(({ key, label }) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block font-medium">{label}</span>
            <select
              className={selectClass}
              value={(mapping[key] as string) ?? ""}
              onChange={(e) => set(key, e.target.value as ColumnMapping[typeof key])}
            >
              <option value="">Select column</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </label>
        ))}

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Volume (optional)</span>
          <select
            className={selectClass}
            value={mapping.volume ?? ""}
            onChange={(e) => set("volume", e.target.value === "" ? null : e.target.value)}
          >
            <option value="">None</option>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Timestamp format</span>
          <select
            className={selectClass}
            value={mapping.timeFormat}
            onChange={(e) => set("timeFormat", e.target.value as TimeFormat)}
          >
            {TIME_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Choose a different file
        </Button>
        <Button variant="brand" onClick={onConfirm} disabled={missing.length > 0}>
          {missing.length > 0 ? `Map ${missing.join(", ")}` : "Render chart"}
        </Button>
      </div>
    </div>
  )
}
