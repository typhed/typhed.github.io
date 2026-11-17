"use client";

import * as React from "react";

import type { WorkerResponse } from "@/workers/simulation.worker";

export type WorkerTaskStatus = "idle" | "running" | "done" | "error";

export interface WorkerTaskState<Result> {
  status: WorkerTaskStatus;
  /** 0..1 while running. */
  progress: number;
  result: Result | null;
  error: string | null;
}

/**
 * Generic handle on the shared computation worker. `start` posts a request
 * (the id is stamped here); a run superseded by a newer one is ignored when
 * it reports, and `cancel` terminates the worker outright - the next start
 * respawns it. The worker is also terminated on unmount.
 */
export function useWorkerTask<Result>() {
  const [state, setState] = React.useState<WorkerTaskState<Result>>({
    status: "idle",
    progress: 0,
    result: null,
    error: null,
  });
  const workerRef = React.useRef<Worker | null>(null);
  const runIdRef = React.useRef(0);

  const ensureWorker = React.useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(
      new URL("../workers/simulation.worker.ts", import.meta.url),
    );
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
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
          result: message.result as Result,
          error: null,
        });
      } else {
        setState({
          status: "error",
          progress: 0,
          result: null,
          error: message.message,
        });
      }
    };
    workerRef.current = worker;
    return worker;
  }, []);

  const start = React.useCallback(
    (payload: Record<string, unknown>) => {
      const id = ++runIdRef.current;
      setState({ status: "running", progress: 0, result: null, error: null });
      ensureWorker().postMessage({ id, ...payload });
    },
    [ensureWorker],
  );

  const cancel = React.useCallback(() => {
    runIdRef.current += 1;
    workerRef.current?.terminate();
    workerRef.current = null;
    setState({ status: "idle", progress: 0, result: null, error: null });
  }, []);

  React.useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  return { ...state, start, cancel };
}
