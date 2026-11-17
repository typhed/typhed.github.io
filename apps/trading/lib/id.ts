/**
 * Stable-enough unique id for client-side rows and records. Used only as React
 * keys and IndexedDB keys - never rendered, never sent anywhere.
 */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
