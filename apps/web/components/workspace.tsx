"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import {
  aggregate,
  autoDetectMapping,
  buildDataset,
  countMissingIntervals,
  inferBaseIntervalSeconds,
  parseCsv,
  parseXlsx,
  type ColumnMapping,
  type DatasetResult,
  type ParsedTable,
} from "@typhed/chart-engine";

import { baseTimeframe, timeframeOptions } from "@/lib/timeframe-options";
import { Button } from "@/components/ui/button";
import { ChartView } from "@/components/chart/chart-view";
import { TimeframeSelect } from "@/components/chart/timeframe-select";
import { DataIntegrityPanel } from "@/components/chart/data-integrity-panel";
import { UploadPanel } from "@/components/upload/upload-panel";
import { ColumnMapper } from "@/components/upload/column-mapper";

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

  async function handleFile(file: File) {
    setError(null);
    try {
      const parsed = await readTable(file);
      if (parsed.headers.length === 0) {
        throw new Error("No columns were found in that file.");
      }
      setTable(parsed);
      setMapping(autoDetectMapping(parsed.headers));
      setFileName(file.name);
      setStep("map");
    } catch (e) {
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

  const missingIntervals = React.useMemo(
    () => (dataset ? countMissingIntervals(dataset.candles) : 0),
    [dataset],
  );

  if (step === "upload") {
    return (
      <div className="container py-16">
        <WorkspaceIntro />
        <UploadPanel onFile={handleFile} error={error} />
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
              {dataset.stats.outputRows.toLocaleString()} bars &middot; base{" "}
              {base.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TimeframeSelect
              options={options}
              value={selected.id}
              onChange={setTimeframeId}
            />
            <Button variant="outline" size="sm" onClick={reset}>
              <RefreshCw className="h-4 w-4" />
              New file
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-2">
          <div className="h-[520px] w-full">
            <ChartView candles={candles} hasVolume={dataset.stats.hasVolume} />
          </div>
        </div>

        <DataIntegrityPanel
          dataset={dataset}
          baseIntervalLabel={base.label}
          missingIntervals={missingIntervals}
        />
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
