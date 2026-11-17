import type { Config } from "tailwindcss"
import sharedConfig from "@typhed/tailwind-config"

/**
 * Tailwind config for the TyPhed blog.
 *
 * Everything visual - both palettes, the container, the radius scale, the font
 * stacks, the keyframes and the animations - comes from the shared preset,
 * which reads them from `@typhed/brand`. This file contributes only the content
 * globs, because they are the one thing that is genuinely per-app.
 *
 * The colour utilities the preset defines map to CSS custom properties but do
 * not declare them. Those are generated into `app/theme.css` by
 * `shared/documents/scripts/sync-shared.mjs` before every dev run and build,
 * and imported by the root layout ahead of `globals.css`.
 */
const config: Config = {
  presets: [sharedConfig],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
    // Tailwind only emits a class it has actually seen in a scanned file, and
    // the shared components live outside this app. Drop this line and every
    // shared component renders with its styles silently absent - the build
    // still succeeds and nothing warns you.
    //
    // Keep it RELATIVE. Resolving it to an absolute path looks tidier and
    // breaks here: this repository is checked out under a directory named
    // "[GitHub] [TyPhed] ...", and a globber reads those brackets as character
    // classes, so the pattern matches nothing. A relative pattern is matched
    // against the working directory rather than globbed, so the brackets in the
    // path never reach the matcher.
    "../../shared/components/packages/ui/components/**/*.{ts,tsx}",
  ],
}

export default config
