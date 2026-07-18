"use client";

import * as React from "react";
import { AlertTriangle, Download, RotateCcw, Upload, X } from "lucide-react";

import type { MnwsDataset, MnwsMeta, MnwsSettings } from "@/lib/budgeting/mnws/types";
import { MNWS_STORAGE_KEY } from "@/lib/budgeting/mnws/types";
import { DEFAULT_MNWS_DATASET, defaultMnwsDataset } from "@/lib/budgeting/mnws/defaults";
import { computeMnws } from "@/lib/budgeting/mnws/engine";
import { mnwsFileName, safeParseMnwsDataset, serializeMnwsDataset } from "@/lib/budgeting/mnws/io";
import { Button } from "@/components/ui/button";
import { MnwsRuleExplainer } from "@/components/budgeting/mnws/mnws-rule-explainer";
import { MnwsBottomLine, MnwsOverview } from "@/components/budgeting/mnws/mnws-overview";
import { MnwsInputs } from "@/components/budgeting/mnws/mnws-inputs";

export function MnwsDashboard() {
  const [data, setData] = React.useState<MnwsDataset>(DEFAULT_MNWS_DATASET);
  const [today, setToday] = React.useState("");
  const [hydrated, setHydrated] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  const importRef = React.useRef<HTMLInputElement>(null);

  // Client-only: set today and restore the last-edited plan from this browser.
  React.useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
    try {
      const raw = window.localStorage.getItem(MNWS_STORAGE_KEY);
      if (raw) {
        const parsed = safeParseMnwsDataset(JSON.parse(raw));
        if (parsed.ok) setData(parsed.data);
      }
    } catch {
      // Ignore unreadable storage - fall back to the seed dataset.
    }
    setHydrated(true);
  }, []);

  // Persist every edit to this browser (the JSON file remains the portable copy).
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(MNWS_STORAGE_KEY, serializeMnwsDataset(data));
    } catch {
      // Storage may be full or blocked; edits still live in memory.
    }
  }, [data, hydrated]);

  const result = React.useMemo(() => computeMnws(data, today), [data, today]);

  const patchMeta = (patch: Partial<MnwsMeta>) =>
    setData((prev) => ({ ...prev, meta: { ...prev.meta, ...patch } }));
  const patchSettings = (patch: Partial<MnwsSettings>) =>
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));

  function handleDownload() {
    const blob = new Blob([serializeMnwsDataset(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = mnwsFileName(data, today);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    try {
      const parsed = safeParseMnwsDataset(JSON.parse(await file.text()));
      if (parsed.ok) {
        setData(parsed.data);
        setImportError(null);
      } else {
        setImportError(parsed.error);
      }
    } catch {
      setImportError("Could not read that file - is it valid JSON?");
    }
  }

  function handleReset() {
    setData(defaultMnwsDataset());
    setImportError(null);
    try {
      window.localStorage.removeItem(MNWS_STORAGE_KEY);
    } catch {
      // Non-fatal.
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">MNWS Budgeting Rule</h1>
          <p className="text-sm text-muted-foreground">
            A disciplined 50-30-20: edit your salary history and windfalls, then download a single JSON file to reuse
            it later.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="brand" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {importError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <span>{importError}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setImportError(null)}
            className="shrink-0 rounded p-0.5 hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="space-y-1">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <MnwsRuleExplainer />

      <MnwsOverview result={result} />

      <MnwsInputs
        meta={data.meta}
        salaries={data.salaries}
        bonuses={data.bonuses}
        settings={data.settings}
        today={today}
        onMetaChange={patchMeta}
        onSalariesChange={(salaries) => setData((prev) => ({ ...prev, salaries }))}
        onBonusesChange={(bonuses) => setData((prev) => ({ ...prev, bonuses }))}
        onSettingsChange={patchSettings}
      />

      <p className="text-xs text-muted-foreground">
        Your edits stay in this browser and in the JSON file you download - nothing is uploaded. Figures are
        projections based on your inputs and the assumed return, not financial advice.
      </p>

      <MnwsBottomLine result={result} />
    </div>
  );
}
