"use client";

import * as React from "react";
import { Download, Pencil, RotateCcw, Upload, X } from "lucide-react";

import type { IpoDataset, IpoMeta } from "@/lib/ipo/types";
import { IPO_STORAGE_KEY } from "@/lib/ipo/types";
import { DEFAULT_IPO_DATASET, defaultIpoDataset } from "@/lib/ipo/defaults";
import { deriveIpoMetrics } from "@/lib/ipo/analytics";
import { deriveAllApplications, subscriptionByCategory } from "@/lib/ipo/applications";
import { ipoFileName, safeParseIpoDataset, serializeIpoDataset } from "@/lib/ipo/io";
import { Button } from "@/components/ui/button";
import { IpoOverview } from "@/components/tools/ipo/ipo-overview";
import { IpoTimeline } from "@/components/tools/ipo/ipo-timeline";
import { IpoGmp } from "@/components/tools/ipo/ipo-gmp";
import { IpoFinancials } from "@/components/tools/ipo/ipo-financials";
import { IpoApplications } from "@/components/tools/ipo/ipo-applications";
import { IpoEditPanel } from "@/components/tools/ipo/ipo-edit-panel";
import { MembersOnly } from "@/components/tools/members-gate";

/** Local calendar date as ISO "yyyy-mm-dd" - NOT the UTC date, which is a day
 * behind for IST users between midnight and 05:30. */
function localIsoDate(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

export function IpoDashboard() {
  const [data, setData] = React.useState<IpoDataset>(DEFAULT_IPO_DATASET);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [today, setToday] = React.useState("");
  const [hydrated, setHydrated] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  const importRef = React.useRef<HTMLInputElement>(null);
  // Only a real edit/import should persist: writing the untouched seed on first
  // visit would mask every future seed update behind a stale cache, and would
  // instantly undo Reset's removeItem.
  const dirtyRef = React.useRef(false);

  // Client-only: set today and restore the last-edited dataset from this browser.
  React.useEffect(() => {
    setToday(localIsoDate());
    try {
      const raw = window.localStorage.getItem(IPO_STORAGE_KEY);
      if (raw) {
        const parsed = safeParseIpoDataset(JSON.parse(raw));
        if (parsed.ok) setData(parsed.data);
      }
    } catch {
      // Ignore unreadable storage - fall back to the seed dataset.
    }
    setHydrated(true);
  }, []);

  // Persist every edit to this browser (the JSON file remains the portable copy).
  React.useEffect(() => {
    if (!hydrated || !dirtyRef.current) return;
    try {
      window.localStorage.setItem(IPO_STORAGE_KEY, serializeIpoDataset(data));
    } catch {
      // Storage may be full or blocked; edits still live in memory.
    }
  }, [data, hydrated]);

  /** Route every user mutation through here so persistence sees it as an edit. */
  const applyEdit = React.useCallback((updater: (prev: IpoDataset) => IpoDataset) => {
    dirtyRef.current = true;
    setData(updater);
  }, []);

  const closePanel = React.useCallback(() => setPanelOpen(false), []);

  const metrics = React.useMemo(() => deriveIpoMetrics(data, today), [data, today]);

  const appMetrics = React.useMemo(
    () =>
      deriveAllApplications(data, {
        latestGmp: metrics.gmp.latest,
        cutoffPrice: data.meta.priceBand.max,
        lotSize: data.meta.lotSize,
        subscriptionByCategory: subscriptionByCategory(data),
      }),
    [data, metrics.gmp.latest],
  );

  const patchMeta = (patch: Partial<IpoMeta>) =>
    applyEdit((prev) => ({ ...prev, meta: { ...prev.meta, ...patch } }));

  function handleDownload() {
    const blob = new Blob([serializeIpoDataset(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = ipoFileName(data, today);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    try {
      const parsed = safeParseIpoDataset(JSON.parse(await file.text()));
      if (parsed.ok) {
        applyEdit(() => parsed.data);
        setImportError(null);
      } else {
        setImportError(parsed.error);
      }
    } catch {
      setImportError("Could not read that file - is it valid JSON?");
    }
  }

  function handleReset() {
    // Back to the pristine seed: clear the cache and stop persisting until the
    // next real edit, otherwise the persist effect would re-write the seed.
    dirtyRef.current = false;
    setData(defaultIpoDataset());
    setImportError(null);
    try {
      window.localStorage.removeItem(IPO_STORAGE_KEY);
    } catch {
      // Non-fatal.
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">IPO Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Edit any value, then download a single JSON file to reuse it later.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={panelOpen ? "brand" : "outline"}
            size="sm"
            onClick={() => setPanelOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit data
          </Button>
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

      <IpoOverview meta={data.meta} metrics={metrics} />

      <IpoTimeline milestones={data.timeline} today={today} />

      <div className="grid items-stretch gap-6 lg:grid-cols-[45fr_55fr]">
        <IpoGmp
          rows={data.gmp}
          stats={metrics.gmp}
          forecast={metrics.gmpForecast}
          listingDate={metrics.listingDate}
          className="h-full min-w-0"
        />
        <IpoFinancials
          derived={metrics.financials}
          unitLabel={data.meta.unitLabel}
          className="h-full min-w-0"
        />
      </div>

      <MembersOnly
        title="IPO Application Tracker"
        description="Track applications and their contributors; allotment probability is estimated per SEBI rules."
      >
        <IpoApplications
          applications={data.applications}
          subscription={data.subscription}
          metrics={appMetrics}
          lotSize={data.meta.lotSize}
          onApplicationsChange={(applications) => applyEdit((prev) => ({ ...prev, applications }))}
          onSubscriptionChange={(subscription) => applyEdit((prev) => ({ ...prev, subscription }))}
        />
      </MembersOnly>

      <p className="text-xs text-muted-foreground">
        Your edits stay in this browser and in the JSON file you download - nothing is uploaded. GMP and
        estimated-listing figures are grey-market indications, not investment advice.
      </p>

      <IpoEditPanel
        open={panelOpen}
        onClose={closePanel}
        data={data}
        today={today}
        onMetaChange={patchMeta}
        onTimelineChange={(timeline) => applyEdit((prev) => ({ ...prev, timeline }))}
        onGmpChange={(gmp) => applyEdit((prev) => ({ ...prev, gmp }))}
        onFinancialsChange={(financials) => applyEdit((prev) => ({ ...prev, financials }))}
      />
    </div>
  );
}
