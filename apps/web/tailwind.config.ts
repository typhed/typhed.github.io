import type { Config } from "tailwindcss"
import sharedConfig from "@typhed/tailwind-config"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/components/**/*.{ts,tsx}",
  ],
  presets: [sharedConfig],
}

export default config
