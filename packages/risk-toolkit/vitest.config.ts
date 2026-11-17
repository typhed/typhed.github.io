import { defineConfig } from "vitest/config"

export default defineConfig({
  // Vite caches beside the nearest package.json unless told otherwise; the
  // workspace keeps its only node_modules at the repository root.
  cacheDir: "../../node_modules/.vite/risk-toolkit",
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
})
