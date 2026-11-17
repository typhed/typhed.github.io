import path from "node:path"
import { defineConfig } from "vitest/config"

// Pure-logic tests for lib/ - node environment, no DOM. The "@/" alias mirrors
// the "@/*" path in tsconfig.json.
export default defineConfig({
  // Vite caches beside the nearest package.json unless told otherwise; the
  // workspace keeps its only node_modules at the repository root.
  cacheDir: "../../node_modules/.vite/trading",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
})
