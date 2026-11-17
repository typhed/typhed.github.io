import { IPO_STORAGE_KEY, LEGACY_IPO_STORAGE_KEYS } from "@/lib/ipo/types"
import { MNWS_STORAGE_KEY } from "@/lib/budgeting/mnws/types"
import { DB_NAME } from "@/lib/storage"

/**
 * Every browser-storage location this site writes user data to. Add new
 * keys here when a tool gains persistence, or the clear controls will miss
 * them.
 */
const LOCAL_STORAGE_KEYS: readonly string[] = [
  IPO_STORAGE_KEY,
  ...LEGACY_IPO_STORAGE_KEYS,
  MNWS_STORAGE_KEY,
]

/**
 * Erase every piece of user data this site stores in the browser: tool
 * datasets in localStorage and saved analyses in IndexedDB. Called by the
 * footer's explicit "Clear local data" control and automatically on
 * sign-out, because uploaded financial data must not outlive its owner's
 * session on a shared device. Best-effort by design: blocked storage or an
 * open second tab must never turn sign-out into an error.
 */
export async function clearAllLocalData(): Promise<void> {
  try {
    for (const key of LOCAL_STORAGE_KEYS) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Storage may be blocked entirely; nothing more to do.
  }

  if (typeof indexedDB === "undefined") return
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    // Another open tab holds the database; deletion completes when it closes.
    request.onblocked = () => resolve()
  })
}
