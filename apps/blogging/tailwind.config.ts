import type { Config } from "tailwindcss"
import sharedConfig from "@typhed/tailwind-config"
import sharedContent from "@typhed/tailwind-config/content.js"

const config: Config = {
  presets: [sharedConfig],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{md,mdx}", ...sharedContent],
}

export default config
