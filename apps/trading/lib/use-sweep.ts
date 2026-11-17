"use client"

import * as React from "react"
import type { SweepParams, SweepResult } from "@typhed/backtest"
import type { Candle } from "@typhed/chart-engine"

import { useWorkerTask } from "@/lib/worker-task"

/** Client handle on the worker for EMA sweep runs. */
export function useSweep() {
  const { status, progress, result, error, start, cancel } = useWorkerTask<SweepResult>()

  const run = React.useCallback(
    (candles: readonly Candle[], params: SweepParams) => start({ kind: "sweep", candles, params }),
    [start],
  )

  return { status, progress, sweep: result, error, run, cancel }
}
