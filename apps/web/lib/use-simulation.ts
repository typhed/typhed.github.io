"use client";

import * as React from "react";
import type { SimulateInput, SimulationSummary } from "@typhed/risk-toolkit";

import type {
  SimulationRequest,
  SimulationResponse,
} from "@/workers/simulation.worker";

export type SimulationStatus = "idle" | "running" | "done" | "error";

export interface SimulationState {
  status: SimulationStatus;
  /** 0..1 while running. */
  progress: number;
  summary: SimulationSummary | null;
  error: string | null;
}

const IDLE: SimulationState = {
  status: "idle",
  progress: 0,
  summary: null,
  error: null,
};

/**
 * Client handle on the shared simulation worker. `run` starts (or restarts)
 * a simulation; a run superseded by a newer one is simply ignored when it
 * reports (the id check), and `cancel` terminates the worker outright - the
 * next run respawns it. The worker is also terminated on unmount.
 */
export function useSimulation() {
  const [state, setState] = React.useState<SimulationState>(IDLE);
  const workerRef = React.useRef<Worker | null>(null);
  const runIdRef = React.useRef(0);

  const ensureWorker = React.useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(
      new URL("../workers/simulation.worker.ts", import.meta.url),
    );
    worker.onmessage = (event: MessageEvent<SimulationResponse>) => {
      const message = event.data;
      if (message.id !== runIdRef.current) return;
      if (message.kind === "progress") {
        setState((prev) => ({
          ...prev,
          status: "running",
          progress: message.total === 0 ? 0 : message.done / message.total,
        }));
      } else if (message.kind === "result") {
        setState({
          status: "done",
          progress: 1,
          summary: message.summary as SimulationSummary,
          error: null,
        });
      } else {
        setState({
          status: "error",
          progress: 0,
          summary: null,
          error: message.message,
        });
      }
    };
    workerRef.current = worker;
    return worker;
  }, []);

  const run = React.useCallback(
    (input: SimulateInput) => {
      const id = ++runIdRef.current;
      setState({ status: "running", progress: 0, summary: null, error: null });
      const request: SimulationRequest = { id, kind: "simulate", input };
      ensureWorker().postMessage(request);
    },
    [ensureWorker],
  );

  const cancel = React.useCallback(() => {
    runIdRef.current += 1;
    workerRef.current?.terminate();
    workerRef.current = null;
    setState(IDLE);
  }, []);

  React.useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  return { ...state, run, cancel };
}
