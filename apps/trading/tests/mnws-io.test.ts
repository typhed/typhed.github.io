import { describe, expect, it } from "vitest"

import { blankMnwsDataset, defaultMnwsDataset } from "@/lib/budgeting/mnws/defaults"
import { safeParseMnwsDataset, serializeMnwsDataset } from "@/lib/budgeting/mnws/io"

describe("safeParseMnwsDataset empty handling", () => {
  const emptyPayload = JSON.parse(serializeMnwsDataset(blankMnwsDataset()))

  it("rejects an empty dataset by default (file import stays strict)", () => {
    const parsed = safeParseMnwsDataset(emptyPayload)
    expect(parsed.ok).toBe(false)
  })

  it("round-trips an empty dataset with allowEmpty (localStorage hydrate)", () => {
    const parsed = safeParseMnwsDataset(emptyPayload, { allowEmpty: true })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.salaries).toEqual([])
    expect(parsed.data.bonuses).toEqual([])
    expect(parsed.data.meta.planName).toBe("My 50-30-20 Plan")
    expect(parsed.data.settings.annualReturnPct).toBe(blankMnwsDataset().settings.annualReturnPct)
  })

  it("caps the rows an untrusted payload can add", () => {
    const row = { date: "2020-01-01", amount: 1 }
    const parsed = safeParseMnwsDataset({
      salaries: Array.from({ length: 1001 }, () => row),
      bonuses: Array.from({ length: 1001 }, () => row),
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.salaries).toHaveLength(1000)
    expect(parsed.data.bonuses).toHaveLength(1000)
  })

  it("parses a populated dataset identically in both modes", () => {
    const payload = JSON.parse(serializeMnwsDataset(defaultMnwsDataset()))
    const strict = safeParseMnwsDataset(payload)
    const lenient = safeParseMnwsDataset(payload, { allowEmpty: true })
    expect(strict.ok).toBe(true)
    expect(lenient.ok).toBe(true)
    if (!strict.ok || !lenient.ok) return
    expect(strict.data.salaries.map((s) => s.amount)).toEqual(
      lenient.data.salaries.map((s) => s.amount),
    )
    expect(strict.data.bonuses.map((b) => b.amount)).toEqual(
      lenient.data.bonuses.map((b) => b.amount),
    )
  })
})
