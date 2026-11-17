import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

/**
 * The one ESLint configuration for the workspace. Each app's and package's
 * `lint` script runs `eslint .` in its own folder, and ESLint finds this file
 * by walking up.
 *
 * eslint-config-next ignores build output relative to the folder of the config
 * that loads it, which is the repository root here, so the patterns below
 * repeat those ignores for every app.
 */
const config = [
  ...nextCoreWebVitals,
  {
    ignores: ["**/.next/**", "**/out/**", "**/.turbo/**", "**/.wrangler/**", "**/next-env.d.ts"],
  },
  {
    // The shared packages are libraries, not Next.js apps: they have no pages
    // directory for this rule to check links against.
    files: ["packages/**"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
]

export default config
