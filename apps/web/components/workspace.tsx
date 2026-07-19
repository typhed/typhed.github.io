"use client";

import * as React from "react";
import { RefreshCw, Save } from "lucide-react";
import {
  aggregate,
  autoDetectMapping,
  buildDataset,
  countMissingIntervals,
  inferBaseIntervalSeconds,
  parseCsv,
  parseXlsx,
  validateCandles,
  type ColumnMapping,
  type DatasetResult,
  type ParsedTable,
} from "@typhed/chart-engine";

import { baseTimeframe, timeframeOptions } from "@/lib/timeframe-options";
import { fmtNumber } from "@/lib/format";
import {
  computeIndicators,
  DEFAULT_INDICATOR_STATE,
  type IndicatorId,
  type IndicatorState,
} from "@/lib/indicators";
import { Button } from "@/components/ui/button";
import { ChartView } from "@/components/chart/chart-view";
import { TimeframeSelect } from "@/components/chart/timeframe-select";
import { IndicatorPanel } from "@/components/chart/indicator-panel";
import { DataIntegrityPanel } from "@/components/chart/data-integrity-panel";
import { UploadPanel } from "@/components/upload/upload-panel";
import { ColumnMapper } from "@/components/upload/column-mapper";
import { Segmented } from "@/components/tools/controls";
import { PositionSizer } from "@/components/tools/position-sizer";
import { RiskDashboard } from "@/components/tools/risk-dashboard";
import { MonteCarlo } from "@/components/tools/monte-carlo";
import { AdvancedAnalytics } from "@/components/tools/advanced-analytics";
import { SavedAnalyses } from "@/components/tools/saved-analyses";
import { Entitled } from "@/components/entitlement-gate";
import {
  saveAnalysis,
  toSavedAnalysis,
  type SavedAnalysis,
} from "@/lib/storage";

const SECONDS_PER_YEAR = 31557600; // 365.25 days

type WorkspaceView = "chart" | "risk" | "sizing" | "montecarlo" | "advanced";

const VIEW_OPTIONS: ReadonlyArray<{ value: WorkspaceView; label: string }> = [
  { value: "chart", label: "Chart" },
  { value: "risk", label: "Risk" },
  { value: "sizing", label: "Position sizer" },
  { value: "montecarlo", label: "Monte Carlo" },
  { value: "advanced", label: "Advanced (Python)" },
];

type Step = "upload" | "map" | "chart";

async function readTable(file: File): Promise<ParsedTable> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseXlsx(await file.arrayBuffer());
  }
  return parseCsv(await file.text());
}

export function Workspace() {
  const [step, setStep] = React.useState<Step>("upload");
  const [error, setError] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [table, setTable] = React.useState<ParsedTable | null>(null);
  const [mapping, setMapping] = React.useState<ColumnMapping | null>(null);
  const [dataset, setDataset] = React.useState<DatasetResult | null>(null);
  const [timeframeId, setTimeframeId] = React.useState("");
  const [indicatorState, setIndicatorState] = React.useState<IndicatorState>(
    DEFAULT_INDICATOR_STATE,
  );
  const [view, setView] = React.useState<WorkspaceView>("chart");

  function toggleIndicator(id: IndicatorId) {
    setIndicatorState((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Guards against two quick selections racing: only the latest parse may
  // apply, otherwise a slow large file picked first could finish last and
  // silently replace the file the user actually chose.
  const parseSeq = React.useRef(0);

  async function handleFile(file: File) {
    setError(null);
    const seq = ++parseSeq.current;
    try {
      const parsed = await readTable(file);
      if (seq !== parseSeq.current) return;
      if (parsed.headers.length === 0) {
        throw new Error("No columns were found in that file.");
      }
      setTable(parsed);
      setMapping(autoDetectMapping(parsed.headers));
      setFileName(file.name);
      setStep("map");
    } catch (e) {
      if (seq !== parseSeq.current) return;
      setError(e instanceof Error ? e.message : "Could not read that file.");
    }
  }

  function handleConfirm() {
    if (!table || !mapping) return;
    const built = buildDataset(table, mapping);
    setDataset(built);
    setTimeframeId(baseTimeframe(inferBaseIntervalSeconds(built.candles)).id);
    setStep("chart");
  }

  function reset() {
    setStep("upload");
    setTable(null);
    setMapping(null);
    setDataset(null);
    setFileName("");
    setError(null);
  }

  function loadSaved(analysis: SavedAnalysis) {
    const validated = validateCandles(analysis.candles);
    setDataset({ ...validated, mappingIssues: [] });
    setFileName(analysis.name);
    setTimeframeId(baseTimeframe(inferBaseIntervalSeconds(validated.candles)).id);
    setView("chart");
    setStep("chart");
  }

  async function saveCurrent() {
    if (!dataset) return;
    const name = window.prompt("Name this analysis", fileName || "Untitled");
    if (!name) return;
    try {
      await saveAnalysis(
        toSavedAnalysis(name, fileName, [...dataset.candles], dataset.stats.hasVolume),
      );
    } catch {
      // IndexedDB can fail (quota, private mode); tell the user instead of an
      // unhandled rejection that looks like a successful save.
      window.alert("Could not save this analysis - browser storage refused the write.");
    }
  }

  const base = React.useMemo(
    () =>
      dataset ? baseTimeframe(inferBaseIntervalSeconds(dataset.candles)) : null,
    [dataset],
  );
  const options = React.useMemo(() => (base ? timeframeOptions(base) : []), [base]);
  const selected = options.find((tf) => tf.id === timeframeId) ?? base ?? undefined;

  const candles = React.useMemo(() => {
    if (!dataset || !base || !selected) return [];
    if (selected.seconds <= base.seconds) return dataset.candles;
    return aggregate(dataset.candles, selected);
  }, [dataset, base, selected]);

  const chartIndicators = React.useMemo(
    () => computeIndicators(candles, indicatorState),
    [candles, indicatorState],
  );

  const missingIntervals = React.useMemo(
    () => (dataset ? countMissingIntervals(dataset.candles) : 0),
    [dataset],
  );

  if (step === "upload") {
    return (
      <div className="container py-16">
        <WorkspaceIntro />
        <UploadPanel onFile={handleFile} error={error} />
        <SavedAnalyses onLoad={loadSaved} />
      </div>
    );
  }

  if (step === "map" && table && mapping) {
    return (
      <div className="container py-16">
        <ColumnMapper
          headers={table.headers}
          mapping={mapping}
          onChange={setMapping}
          onConfirm={handleConfirm}
          onCancel={reset}
        />
      </div>
    );
  }

  if (step === "chart" && dataset && base && selected) {
    return (
      <div className="container space-y-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold">{fileName}</h1>
            <p className="text-sm text-muted-foreground">
              {fmtNumber(dataset.stats.outputRows, 0)} bars &middot; base{" "}
              {base.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={saveCurrent}>
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              <RefreshCw className="h-4 w-4" />
              New file
            </Button>
          </div>
        </div>

        <Segmented options={VIEW_OPTIONS} value={view} onChange={setView} />

        {view === "chart" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <IndicatorPanel state={indicatorState} onToggle={toggleIndicator} />
              <TimeframeSelect
                options={options}
                value={selected.id}
                onChange={setTimeframeId}
              />
            </div>

            <div className="rounded-lg border border-border bg-card p-2">
              <div className="h-[560px] w-full">
                <ChartView
                  candles={candles}
                  hasVolume={dataset.stats.hasVolume}
                  indicators={chartIndicators}
                />
              </div>
            </div>

            <DataIntegrityPanel
              dataset={dataset}
              baseIntervalLabel={base.label}
              missingIntervals={missingIntervals}
            />
          </>
        )}

        {view === "risk" && (
          <RiskDashboard
            candles={dataset.candles}
            periodsPerYear={SECONDS_PER_YEAR / base.seconds}
            timeframeLabel={base.label}
          />
        )}

        {view === "sizing" && <PositionSizer />}

        {view === "montecarlo" && (
          <Entitled feature="montecarlo">
            <MonteCarlo />
          </Entitled>
        )}

        {view === "advanced" && (
          <Entitled feature="advanced">
            <AdvancedAnalytics candles={dataset.candles} />
          </Entitled>
        )}
      </div>
    );
  }

  return null;
}

function WorkspaceIntro() {
  return (
    <section className="mx-auto mb-10 max-w-2xl text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Chart your own market data
      </h1>
      <p className="mt-3 text-muted-foreground">
        Upload a CSV or XLSX of OHLCV bars. Aggregate to any timeframe and read a
        fluid candlestick chart - the substrate for the sizing and risk tools.
      </p>
    </section>
  );
}
