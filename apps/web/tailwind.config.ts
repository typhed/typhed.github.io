import type { Config } from "tailwindcss";
import sharedConfig from "@typhed/tailwind-config/tailwind.config.js";

/**
 * App-level Tailwind config. All theme tokens come from the shared preset;
 * only the content globs are app-specific.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [sharedConfig],
};

export default config;
