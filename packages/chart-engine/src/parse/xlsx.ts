import * as XLSX from "xlsx";

import type { ParsedTable } from "../types";

/**
 * Parse the first worksheet of an XLSX workbook into a table. `cellDates` lets
 * SheetJS hand back real Date objects for date cells, which the timestamp
 * parser converts to UTC seconds directly (no fragile serial-number maths).
 */
export function parseXlsx(data: ArrayBuffer): ParsedTable {
  const workbook = XLSX.read(data, { type: "array", cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { headers: [], rows: [] };
  }

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    return { headers: [], rows: [] };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: true,
    defval: null,
  });

  const headers = rows.length > 0 ? Object.keys(rows[0] as object) : [];
  return { headers, rows };
}
