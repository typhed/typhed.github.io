"use client";

/**
 * Small, unstyled-cell building blocks for editable tables / grids, shared by
 * every tool that lets the user add and edit rows (the IPO editors, the MNWS
 * salary / bonus tables, ...). Each editor owns its own column grid; these
 * primitives keep the input styling and the add / remove controls consistent
 * without imposing a rigid column model. Cell inputs are label-less (the editor
 * renders one header row) and every row is keyed by an ephemeral `id`.
 */

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const cellClass =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Immutably patch the row with the given id. */
export function patchRow<T extends { id: string }>(
  rows: T[],
  id: string,
  patch: Partial<T>,
): T[] {
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
}

/** Immutably drop the row with the given id. */
export function dropRow<T extends { id: string }>(rows: T[], id: string): T[] {
  return rows.filter((row) => row.id !== id);
}

/** A bare text cell input. */
export function TextCell({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
}) {
  return (
    <input
      type="text"
      aria-label={ariaLabel}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cellClass}
    />
  );
}

/** A bare numeric cell input. `disabled` greys it out and blocks edits. */
export function NumberCell({
  value,
  onChange,
  step = "any",
  min,
  ariaLabel,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: string | number;
  min?: number;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      aria-label={ariaLabel}
      step={step}
      min={min}
      disabled={disabled}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? 0 : Number(e.target.value))
      }
      className={cn(
        cellClass,
        "tabular-nums",
        disabled &&
          "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
      )}
    />
  );
}

/** A bare select cell bound to one of a fixed set of options. */
export function SelectCell<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(cellClass, "cursor-pointer")}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/** A bare native date cell input, bound to an ISO "yyyy-mm-dd" string. */
export function DateCell({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <input
      type="date"
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(cellClass, "[color-scheme:light] dark:[color-scheme:dark]")}
    />
  );
}

/** A ghost icon button that removes the row it sits in. */
export function RemoveRowButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className="h-8 w-8 shrink-0"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

/** An outline button that appends a new row. */
export function AddRowButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="mt-3">
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  );
}
