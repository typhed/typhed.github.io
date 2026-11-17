import path from "node:path";
import { defineConfig } from "vitest/config";

// Pure-logic tests for apps/web/lib - node environment, no DOM. The "@/"
// alias mirrors tsconfig's baseUrl mapping.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
