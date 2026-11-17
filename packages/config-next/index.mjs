import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import nextEnv from "@next/env"

/** The monorepo root, two levels above this package. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")

/** Shared packages every app compiles from TypeScript source. */
const SOURCE_PACKAGES = ["@typhed/auth", "@typhed/brand", "@typhed/ui"]

/**
 * The Next.js configuration every TyPhed app builds with. Each app is a static
 * export served as Cloudflare Workers static assets, so there is no Node
 * runtime after the build:
 *
 *   - `output: "export"` writes plain files to `out/`.
 *   - `trailingSlash: true` emits `route/index.html`, served at `/route/`.
 *   - `images.unoptimized` because no image optimisation server exists.
 *
 * The repo-root `.env.local` is loaded first, so one file configures every
 * app; a real environment variable (CI) always wins over the file.
 *
 * Pass app-specific options; `transpilePackages` is merged with the shared
 * source packages rather than replacing them.
 *
 * @param {import("next").NextConfig} [options]
 * @returns {import("next").NextConfig}
 */
export function createNextConfig({ transpilePackages = [], ...options } = {}) {
  nextEnv.loadEnvConfig(ROOT, process.env.NODE_ENV !== "production")

  return {
    output: "export",
    reactStrictMode: true,
    trailingSlash: true,
    images: { unoptimized: true },
    ...options,
    transpilePackages: [...new Set([...SOURCE_PACKAGES, ...transpilePackages])],
  }
}
