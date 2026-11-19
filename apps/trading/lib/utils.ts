/**
 * Today's local calendar date as ISO "yyyy-mm-dd" - NOT the UTC date, which is
 * a day behind for IST users between midnight and 05:30.
 */
export function localIsoDate(): string {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${mm}-${dd}`
}

/** `value` limited to the range `min`..`max`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Lowercase, dash-separated slug for filenames and ids. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
