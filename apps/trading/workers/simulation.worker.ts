/**
 * The shared heavy-math module worker: owns every long-running computation
 * (Monte Carlo simulation and the EMA sweep) so the main thread never
 * freezes. Work runs in chunks with a progress message after each;
 * cancellation is terminate-and-respawn from the owning hook, so this file
 * never needs an abort protocol. Deterministic by contract: chunking cannot
 * change results because all randomness is seeded inside the engines.
 */

import { createSimulation, type SimulateInput } from "@typhed/risk-toolkit";
import { runSweep, type SweepParams } from "@typhed/backtest";
import type { Candle } from "@typhed/chart-engine";

export type WorkerRequest =
  | { id: number; kind: "simulate"; input: SimulateInput }
  | { id: number; kind: "sweep"; candles: Candle[]; params: SweepParams };

export type WorkerResponse =
  | { id: number; kind: "progress"; done: number; total: number }
  | { id: number; kind: "result"; result: unknown }
  | { id: number; kind: "error"; message: string };

const CHUNK_PATHS = 2000;

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
};

ctx.onmessage = (event) => {
  const request = event.data;
  const { id } = request;

  try {
    if (request.kind === "simulate") {
      const sim = createSimulation(request.input);
      while (sim.done < sim.total) {
        sim.runChunk(CHUNK_PATHS);
        ctx.postMessage({
          id,
          kind: "progress",
          done: sim.done,
          total: sim.total,
        });
      }
      const summary = sim.finalize();
      // The raw per-path buffers (up to 100k float64s each) move, not copy.
      const transfer: Transferable[] = [];
      if (summary.terminals) transfer.push(summary.terminals.buffer);
      if (summary.maxDrawdowns) transfer.push(summary.maxDrawdowns.buffer);
      ctx.postMessage({ id, kind: "result", result: summary }, transfer);
    } else {
      const result = runSweep(request.candles, request.params, (done, total) =>
        ctx.postMessage({ id, kind: "progress", done, total }),
      );
      ctx.postMessage({ id, kind: "result", result });
    }
  } catch (error) {
    ctx.postMessage({
      id,
      kind: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
