import type { Candle } from "@typhed/chart-engine";

import { newId } from "@/lib/id";

/** Exported so the privacy module can erase the whole database on demand. */
export const DB_NAME = "typhed-trading";
const STORE = "analyses";
const VERSION = 1;

export interface SavedAnalysis {
  id: string;
  name: string;
  fileName: string;
  savedAt: number;
  hasVolume: boolean;
  candles: Candle[];
}

function isAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

/** Saved analyses live only in this browser (IndexedDB) - never uploaded. */
export async function listAnalyses(): Promise<SavedAnalysis[]> {
  if (!isAvailable()) return [];
  const all = await tx<SavedAnalysis[]>("readonly", (store) => store.getAll());
  return all.sort((a, b) => b.savedAt - a.savedAt);
}

export async function saveAnalysis(analysis: SavedAnalysis): Promise<void> {
  if (!isAvailable()) return;
  await tx("readwrite", (store) => store.put(analysis));
}

export async function deleteAnalysis(id: string): Promise<void> {
  if (!isAvailable()) return;
  await tx("readwrite", (store) => store.delete(id));
}

/** Create a saved-analysis record from the current dataset. */
export function toSavedAnalysis(
  name: string,
  fileName: string,
  candles: Candle[],
  hasVolume: boolean,
): SavedAnalysis {
  return {
    id: newId(),
    name,
    fileName,
    savedAt: Date.now(),
    hasVolume,
    candles,
  };
}
