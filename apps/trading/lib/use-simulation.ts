"use client";

import * as React from "react";
import type { SimulateInput, SimulationSummary } from "@typhed/risk-toolkit";

import { useWorkerTask } from "@/lib/worker-task";

/** Client handle on the worker for data-driven Monte Carlo runs. */
export function useSimulation() {
  const { status, progress, result, error, start, cancel } =
    useWorkerTask<SimulationSummary>();

  const run = React.useCallback(
    (input: SimulateInput) => start({ kind: "simulate", input }),
    [start],
  );

  return { status, progress, summary: result, error, run, cancel };
}
