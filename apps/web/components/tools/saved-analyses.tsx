"use client";

import * as React from "react";
import { Download, FolderOpen, Trash2, Upload } from "lucide-react";
import type { Candle } from "@typhed/chart-engine";

import {
  deleteAnalysis,
  listAnalyses,
  saveAnalysis,
  toSavedAnalysis,
  type SavedAnalysis,
} from "@/lib/storage";
import { downloadJson } from "@/lib/download";
import { Button } from "@/components/ui/button";

/** Hard ceiling on imported bars - beyond any real dataset, below crash territory. */
const MAX_IMPORT_CANDLES = 2_000_000;

/** Shape-check one untrusted candle: numeric fields, volume number-or-null. */
function isCandleLike(value: unknown): value is Candle {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.time === "number" &&
    typeof c.open === "number" &&
    typeof c.high === "number" &&
    typeof c.low === "number" &&
    typeof c.close === "number" &&
    (c.volume === null || typeof c.volume === "number")
  );
}

/**
 * Saved analyses stored in this browser (IndexedDB). Load, delete, export a
 * single analysis to JSON, or import one. Nothing is uploaded - saved work is
 * per-device until a real account-level store exists.
 */
export function SavedAnalyses({
  onLoad,
}: {
  onLoad: (analysis: SavedAnalysis) => void;
}) {
  const [items, setItems] = React.useState<SavedAnalysis[]>([]);
  const [ready, setReady] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  const importRef = React.useRef<HTMLInputElement>(null);

  const refresh = React.useCallback(async () => {
    setItems(await listAnalyses());
    setReady(true);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleDelete(id: string) {
    await deleteAnalysis(id);
    await refresh();
  }

  function handleExport(analysis: SavedAnalysis) {
    downloadJson(`${analysis.name || "analysis"}.json`, JSON.stringify(analysis, null, 2));
  }

  async function handleImport(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed?.candles) || parsed.candles.length === 0) {
        throw new Error("That file has no candles array - is it an exported analysis?");
      }
      if (parsed.candles.length > MAX_IMPORT_CANDLES) {
        throw new Error("That file holds more bars than this tool supports.");
      }
      // Reject rather than repair: silently storing malformed bars would feed
      // NaNs into every chart and risk metric downstream.
      if (!parsed.candles.every(isCandleLike)) {
        throw new Error("Some rows in that file are not valid OHLCV bars.");
      }
      await saveAnalysis(
        toSavedAnalysis(
          typeof parsed.name === "string" ? parsed.name : file.name,
          typeof parsed.fileName === "string" ? parsed.fileName : file.name,
          parsed.candles,
          Boolean(parsed.hasVolume),
        ),
      );
      setImportError(null);
      await refresh();
    } catch (e) {
      setImportError(
        e instanceof SyntaxError
          ? "Could not read that file - is it valid JSON?"
          : e instanceof Error
            ? e.message
            : "Could not import that file.",
      );
    }
  }

  if (!ready) return null;

  return (
    <div className="mx-auto mt-10 max-w-xl">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Saved analyses
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => importRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Import JSON
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = "";
          }}
        />
      </div>

      {importError && (
        <p role="alert" className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {importError}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
          No saved analyses yet. Load data and save it to keep it on this device.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.candles.length.toLocaleString()} bars &middot;{" "}
                  {new Date(item.savedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onLoad(item)}>
                  <FolderOpen className="h-4 w-4" />
                  Load
                </Button>
                <Button variant="ghost" size="icon" aria-label="Export" onClick={() => handleExport(item)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
