"use client"

import { clearAllLocalData } from "@/lib/privacy"

/**
 * The visible "clear all my data" control (footer bottom bar). Confirms,
 * erases everything the site stores in this browser, then reloads so no
 * in-memory copy of the erased data survives.
 */
export function ClearLocalDataButton() {
  async function handleClick() {
    const confirmed = window.confirm(
      "Erase all data this site stores in this browser - saved analyses, IPO edits, and budgeting plans? This cannot be undone.",
    )
    if (!confirmed) return
    await clearAllLocalData()
    window.location.reload()
  }

  return (
    <button type="button" onClick={handleClick} className="transition-colors hover:text-brand">
      Clear local data
    </button>
  )
}
