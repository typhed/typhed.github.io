import { defineConfig } from "vitest/config"

// Build-time content tests for lib/ - node environment, no DOM. The "@/" alias
// mirrors the "@/*" path in tsconfig.json; import.meta.dirname is this ES
// module's folder. lib/posts.ts reads content/blog from the working directory,
// which is this app's folder when the test task runs.
export default defineConfig({
  // Vite caches beside the nearest package.json unless told otherwise; the
  // workspace keeps its only node_modules at the repository root.
  cacheDir: "../../node_modules/.vite/blogging",
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
