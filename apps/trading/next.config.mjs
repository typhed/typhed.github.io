import { createNextConfig } from "@typhed/next-config"

export default createNextConfig({
  transpilePackages: ["@typhed/chart-engine", "@typhed/risk-toolkit", "@typhed/backtest"],
})
