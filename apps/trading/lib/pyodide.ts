/**
 * Lazy Pyodide loader for the advanced analytics lane. Pyodide (Python compiled
 * to WebAssembly) and numpy are fetched from a CDN on first use and cached by
 * the browser. Only the runtime is downloaded - the user's data is computed
 * locally in WebAssembly and never leaves the browser.
 */

const PYODIDE_VERSION = "0.26.4"
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
/**
 * Subresource-integrity hash of the pinned `pyodide.js` bootstrap (sha384 of
 * the immutable versioned artefact). A tampered CDN response fails the
 * integrity check instead of executing. The wasm/stdlib payloads Pyodide then
 * fetches itself are outside SRI's reach - this protects the entry point that
 * would otherwise control those loads. Recompute when PYODIDE_VERSION changes.
 */
const PYODIDE_SRI = "sha384-i3R37b3tF+HWudsUf1VSEOY2YxwSNMqY8DQa9Z0O3xh+NkJ9o+yjcGyIi5huj+nB"

// Pyodide has no bundled types here; treat the runtime as unknown-shaped.
type PyodideRuntime = {
  loadPackage: (names: string[]) => Promise<void>
  runPython: (code: string) => PyProxy
  toPy: (value: unknown) => unknown
  globals: { set: (name: string, value: unknown) => void }
}

interface PyProxy {
  toJs: (options?: {
    dict_converter?: (entries: Iterable<[unknown, unknown]>) => unknown
  }) => unknown
  destroy: () => void
}

export type StatusFn = (message: string) => void

let runtimePromise: Promise<PyodideRuntime> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector("script[data-pyodide]")) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.integrity = PYODIDE_SRI
    script.crossOrigin = "anonymous"
    script.dataset.pyodide = "true"
    script.onload = () => resolve()
    script.onerror = () => {
      // Drop the failed tag, otherwise every retry would find it, resolve
      // immediately without loading anything, and fail forever.
      script.remove()
      reject(new Error("Failed to load the Python runtime."))
    }
    document.head.appendChild(script)
  })
}

async function loadRuntime(onStatus?: StatusFn): Promise<PyodideRuntime> {
  onStatus?.("Loading Python runtime")
  await loadScript(`${CDN}pyodide.js`)

  const globalLoad = (
    window as unknown as {
      loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideRuntime>
    }
  ).loadPyodide
  if (!globalLoad) throw new Error("Pyodide did not initialise.")

  const runtime = await globalLoad({ indexURL: CDN })
  onStatus?.("Loading numpy")
  await runtime.loadPackage(["numpy"])

  onStatus?.("Loading analysis code")
  const response = await fetch("/py/analytics.py")
  if (!response.ok) throw new Error("Could not load analytics.py.")
  runtime.runPython(await response.text())

  return runtime
}

/** Get the shared Pyodide runtime, loading it once. */
export function getPyodide(onStatus?: StatusFn): Promise<PyodideRuntime> {
  if (!runtimePromise) {
    runtimePromise = loadRuntime(onStatus).catch((error) => {
      runtimePromise = null // allow a retry after a failure
      throw error
    })
  }
  return runtimePromise
}

export interface AdvancedStats {
  n: number
  mean: number
  std: number
  skewness: number
  excess_kurtosis: number
  jarque_bera: number
  jb_pvalue: number
  historical_var: number
  gaussian_var: number
  cornish_fisher_var: number
  /** Set (1.0) by analytics.py when the series is degenerate (n < 3 or zero variance). */
  error?: number
}

/** Run the browser-side Python advanced statistics on a return series. */
export async function runAdvancedStats(
  returns: number[],
  confidence: number,
  onStatus?: StatusFn,
): Promise<AdvancedStats> {
  const runtime = await getPyodide(onStatus)
  onStatus?.("Running analysis")

  runtime.globals.set("_returns", runtime.toPy(returns))
  runtime.globals.set("_conf", confidence)
  const proxy = runtime.runPython("advanced_stats(_returns, _conf)")
  const result = proxy.toJs({ dict_converter: Object.fromEntries })
  proxy.destroy()

  return result as AdvancedStats
}
