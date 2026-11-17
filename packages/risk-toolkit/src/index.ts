export { mulberry32, normalSampler } from "./rng"

export {
  simpleReturns,
  logReturns,
  mean,
  variance,
  stdev,
  annualizedVolatility,
  quantile,
  maxDrawdown,
  equityCurve,
  type DrawdownResult,
} from "./stats"

export {
  fixedFractionalSize,
  atrPositionSize,
  type Direction,
  type SizingResult,
  type FixedFractionalInput,
  type AtrSizingInput,
  type AtrSizingResult,
} from "./sizing"

export { invNormalCdf, historicalVar, historicalCVar, parametricVar } from "./risk"

export {
  covarianceMatrix,
  correlationMatrix,
  portfolioVariance,
  portfolioVolatility,
  diversificationRatio,
} from "./portfolio"

export { monteCarloDrawdown, type MonteCarloInput, type MonteCarloResult } from "./montecarlo"

export {
  createSimulation,
  simulate,
  tradeLogReturns,
  FAN_PERCENTILES,
  type DataDrivenMode,
  type SimulateInput,
  type Simulation,
  type SimulationSummary,
} from "./simulate"

export { optimalBlockLength, type BlockLengthEstimate } from "./blocklength"
