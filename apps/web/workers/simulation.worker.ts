/**
 * The shared heavy-math module worker: owns every long-running simulation
 * (Monte Carlo now, EMA sweeps next) so the main thread never freezes.
 * Paths run in chunks with a progress message after each; cancellation is
 * terminate-and-respawn from the owning hook, so this file never needs an
 * abort protocol. Deterministic by contract: chunking cannot change results
 * because the RNG stream lives inside the engine closure.
 */

import { createSimulation, type SimulateInput } from "@typhed/risk-toolkit";

export interface SimulationRequest {
  id: number;
  kind: "simulate";
  input: SimulateInput;
}

export type SimulationResponse =
  | { id: number; kind: "progress"; done: number; total: number }
  | { id: number; kind: "result"; summary: unknown }
  | { id: number; kind: "error"; message: string };

const CHUNK_PATHS = 2000;

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<SimulationRequest>) => void) | null;
  postMessage(message: SimulationResponse, transfer?: Transferable[]): void;
};

ctx.onmessage = (event) => {
  const { id, kind, input } = event.data;
  if (kind !== "simulate") return;

  try {
    const sim = createSimulation(input);
    while (sim.done < sim.total) {
      sim.runChunk(CHUNK_PATHS);
      ctx.postMessage({ id, kind: "progress", done: sim.done, total: sim.total });
    }
    const summary = sim.finalize();
    // The raw per-path buffers (up to 100k float64s each) move, not copy.
    const transfer: Transferable[] = [];
    if (summary.terminals) transfer.push(summary.terminals.buffer);
    if (summary.maxDrawdowns) transfer.push(summary.maxDrawdowns.buffer);
    ctx.postMessage({ id, kind: "result", summary }, transfer);
  } catch (error) {
    ctx.postMessage({
      id,
      kind: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
