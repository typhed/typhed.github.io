import { afterEach, describe, expect, it, vi } from "vitest"

import { localIsoDate } from "@/lib/utils"

describe("localIsoDate", () => {
  const zone = process.env.TZ

  afterEach(() => {
    vi.useRealTimers()
    if (zone === undefined) delete process.env.TZ
    else process.env.TZ = zone
  })

  it("returns the local calendar day, not the UTC one", () => {
    process.env.TZ = "Asia/Kolkata"
    // 19:00 UTC on 30 November is 00:30 IST on 1 December.
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-11-30T19:00:00Z"))
    expect(localIsoDate()).toBe("2026-12-01")
  })
})
