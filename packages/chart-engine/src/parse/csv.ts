import Papa from "papaparse";

import type { ParsedTable } from "../types";

/**
 * Parse CSV text into a table. Values stay as strings (no dynamic typing) so
 * that timestamp and number interpretation is handled in one deliberate place
 * (the mapping layer) rather than guessed by the CSV reader.
 */
export function parseCsv(text: string): ParsedTable {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
  });

  const headers = result.meta.fields ?? [];
  return { headers, rows: result.data };
}
