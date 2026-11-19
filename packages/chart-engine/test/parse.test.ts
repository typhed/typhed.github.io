import { describe, expect, it } from "vitest"
import * as XLSX from "xlsx"

import { parseCsv } from "../src/parse/csv"
import { parseXlsx } from "../src/parse/xlsx"

describe("parseCsv", () => {
  it("parses headers and keeps values as strings", () => {
    const table = parseCsv("time,open,high,low,close\n2024-01-01,1,2,0.5,1.5\n")
    expect(table.headers).toEqual(["time", "open", "high", "low", "close"])
    expect(table.rows).toHaveLength(1)
    expect(table.rows[0]).toMatchObject({ time: "2024-01-01", close: "1.5" })
  })

  it("trims header whitespace and skips empty lines", () => {
    const table = parseCsv(" time , close \n2024-01-01,10\n\n")
    expect(table.headers).toEqual(["time", "close"])
    expect(table.rows).toHaveLength(1)
  })

  it("keeps duplicate headers apart (papaparse renames them natively)", () => {
    const table = parseCsv("time,close,close\n2024-01-01,10,11\n")
    expect(table.headers).toEqual(["time", "close", "close_1"])
    expect(table.rows[0]).toMatchObject({ close: "10", close_1: "11" })
  })
})

describe("parseXlsx (SheetJS round-trip)", () => {
  it("reads back a workbook written by the same library", () => {
    const rows = [
      { time: "2024-01-01 09:15:00", open: 100, high: 101, low: 99.5, close: 100.5, volume: 1200 },
      { time: "2024-01-01 09:16:00", open: 100.5, high: 102, low: 100, close: 101.75, volume: 800 },
    ]
    const sheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, "Data")
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer

    const table = parseXlsx(buffer)
    expect(table.headers).toEqual(["time", "open", "high", "low", "close", "volume"])
    expect(table.rows).toHaveLength(2)
    expect(table.rows[1]).toMatchObject({ close: 101.75, volume: 800 })
  })

  it("reads a date cell as UTC in any time zone", () => {
    const zone = process.env.TZ
    // UTC+05:30: reading the cell in local time would land 5.5 hours early.
    process.env.TZ = "Asia/Kolkata"
    try {
      // 45293 is the Excel serial for 2024-01-02; the fraction adds 09:15.
      const sheet = XLSX.utils.aoa_to_sheet([
        ["time", "close"],
        [{ t: "n", v: 45293 + (9 * 60 + 15) / 1440, z: "yyyy-mm-dd hh:mm" }, 100],
      ])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, "Data")
      const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer

      const time = parseXlsx(buffer).rows[0]?.time
      expect(time).toBeInstanceOf(Date)
      expect((time as Date).toISOString()).toBe("2024-01-02T09:15:00.000Z")
    } finally {
      if (zone === undefined) delete process.env.TZ
      else process.env.TZ = zone
    }
  })

  it("returns an empty table for a sheet with no rows", () => {
    const sheet = XLSX.utils.json_to_sheet([])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, "Empty")
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer

    const table = parseXlsx(buffer)
    expect(table.headers).toEqual([])
    expect(table.rows).toEqual([])
  })
})
