"use client"

import * as React from "react"

import { cn } from "@typhed/ui/lib/utils"

/** A titled container for a tool. */
export function ToolCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("border-border bg-card rounded-lg border p-6", className)}>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      <div className="mt-5">{children}</div>
    </div>
  )
}

/** A labelled numeric input bound to a number value. */
export function NumberField({
  label,
  value,
  onChange,
  step = "any",
  min,
  max,
  suffix,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: string | number
  min?: number
  max?: number
  suffix?: string
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <div className="border-input bg-background focus-within:ring-ring flex items-center rounded-md border focus-within:ring-2">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="w-full bg-transparent px-3 py-2 text-sm outline-none"
        />
        {suffix && <span className="text-muted-foreground px-3 text-xs">{suffix}</span>}
      </div>
    </label>
  )
}

/** A labelled free-text input bound to a string value. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <div className="border-input bg-background focus-within:ring-ring flex items-center rounded-md border focus-within:ring-2">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2 text-sm outline-none"
        />
      </div>
    </label>
  )
}

/** A labelled native date input bound to an ISO "yyyy-mm-dd" string. */
export function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <div className="border-input bg-background focus-within:ring-ring flex items-center rounded-md border focus-within:ring-2">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2 text-sm outline-none [color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>
    </label>
  )
}

/** A stat tile: a label, a large value, and an optional sub-note. */
export function StatTile({
  label,
  value,
  tone = "default",
  note,
}: {
  label: string
  value: string
  tone?: "default" | "positive" | "negative" | "brand"
  note?: string
}) {
  const toneClass = {
    default: "text-foreground",
    positive: "text-success",
    negative: "text-destructive",
    brand: "text-brand",
  }[tone]

  return (
    <div className="border-border bg-background rounded-lg border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn("font-display mt-1 text-2xl font-semibold", toneClass)}>{value}</p>
      {note && <p className="text-muted-foreground mt-1 text-xs">{note}</p>}
    </div>
  )
}

/** Dashed empty-state placeholder shown where a chart would render. */
export function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="border-border text-muted-foreground flex h-48 items-center justify-center rounded-md border border-dashed text-sm">
      {message}
    </div>
  )
}

/** A small segmented control for mutually exclusive options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="border-border bg-card inline-flex rounded-md border p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded px-3 py-1 text-xs font-medium transition-colors",
            "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            option.value === value
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
