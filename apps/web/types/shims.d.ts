// Ambient types for the shared Tailwind preset, which ships as plain JS.
declare module "@typhed/tailwind-config/tailwind.config.js" {
  import type { Config } from "tailwindcss";
  const config: Partial<Config>;
  export default config;
}
