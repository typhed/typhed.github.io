import { defineConfig } from "vitest/config"

// Pure-logic tests for lib/ - node environment, no DOM. The "@/" alias mirrors
// the "@/*" path in tsconfig.json; import.meta.dirname is this ES module's folder.
export default defineConfig({
  // Vite caches beside the nearest package.json unless told otherwise; the
  // workspace keeps its only node_modules at the repository root.
  cacheDir: "../../node_modules/.vite/trading",
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
})
