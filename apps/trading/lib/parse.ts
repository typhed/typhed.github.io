/**
 * Defensive coercion helpers for parsing untrusted JSON (file imports and
 * localStorage hydration). They never trust shapes: read named fields, coerce
 * or clamp what they can, and are prototype-pollution-safe by construction
 * (they never spread the input). Shared by every tool's `safeParse*` routine.
 */

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Coerce to an array; when `maxRows` is given, rows past the cap are dropped. */
export function asArray(value: unknown, maxRows?: number): unknown[] {
  const rows = Array.isArray(value) ? value : []
  return maxRows === undefined ? rows : rows.slice(0, maxRows)
}

export function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback
}

export function num(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return fallback
}

/** Return `value` when it is one of `allowed`, else `fallback`. */
export function enumOr<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

/** Accept ISO "yyyy-mm-dd" as-is; coerce "dd-mm-yyyy" / "dd/mm/yyyy"; else null. */
export function coerceIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const match = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (match) {
    const [, dd, mm, yyyy] = match
    if (dd && mm && yyyy) return `${yyyy}-${mm}-${dd}`
  }
  return null
}
