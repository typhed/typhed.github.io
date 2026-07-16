"use client";

import * as React from "react";
import { Download, FolderOpen, Trash2, Upload } from "lucide-react";

import {
  deleteAnalysis,
  listAnalyses,
  saveAnalysis,
  toSavedAnalysis,
  type SavedAnalysis,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";

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
    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${analysis.name || "analysis"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed?.candles)) {
        throw new Error("missing candles");
      }
      await saveAnalysis(
        toSavedAnalysis(
          typeof parsed.name === "string" ? parsed.name : file.name,
          typeof parsed.fileName === "string" ? parsed.fileName : file.name,
          parsed.candles,
          Boolean(parsed.hasVolume),
        ),
      );
      await refresh();
    } catch {
      // Ignore malformed imports rather than crash the workspace.
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
