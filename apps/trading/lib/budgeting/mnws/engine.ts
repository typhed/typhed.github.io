/**
 * The MNWS calculation engine - pure, deterministic, and framework-free.
 *
 * The rule
 * --------
 * - The FIRST salary is split by the base ratio (50 % needs / 30 % wants /
 *   20 % savings).
 * - Every later salary INCREMENT (this salary - the previous one) is split by
 *   the REVERSE ratio (20 / 30 / 50) and ADDED to the running allocation. So
 *   the recurring monthly allocation is cumulative:
 *
 *     alloc_0 = BASE  x S_0
 *     alloc_i = alloc_(i-1) + INCREMENT x (S_i - S_(i-1))
 *
 *   Telescoping this gives, for the standard 50/30/20 + 20/30/50 constants:
 *     needs_i   = 0.30 x S_0 + 0.20 x S_i   (rate drifts 50 % -> 20 %)
 *     wants_i   = 0.30 x S_i                (rate stays a flat 30 %)
 *     savings_i = 0.50 x S_i - 0.30 x S_0   (rate drifts 20 % -> 50 %)
 *   and the three always sum back to S_i. The iterative form below reproduces
 *   this for any split constants, so a salary cut (negative increment) is
 *   handled the same way.
 *
 * Timing
 * ------
 * A salary dated in month M takes effect the FOLLOWING month (M + 1) and
 * carries forward until the next salary. A bonus dated in month M is deployed
 * once, the following month, by its own editable split.
 *
 * Corpus
 * ------
 * Each month's savings (recurring + any bonus savings) are added to a running
 * corpus that compounds monthly at `annualReturnPct / 12`, contributions taken
 * at month end (ordinary annuity). The nominal "cash saved" line is the plain
 * running sum of the same contributions.
 *
 * Determinism: the caller injects `today` (an ISO date) rather than the engine
 * reading the clock, so the static export stays hydration-safe.
 */

import { fmtMonthYear } from "@/lib/format"
import { BASE_SPLIT, INCREMENT_SPLIT } from "./types"
import type { MnwsDataset } from "./types"
import {
  compareIso,
  financialYearLabel,
  financialYearShort,
  financialYearStart,
  indexToIso,
  indexToYear,
  monthIndexFromIso,
} from "./dates"

export interface Allocation {
  needs: number
  wants: number
  savings: number
}

const ZERO: Allocation = { needs: 0, wants: 0, savings: 0 }

/** One salary regime: the salary, its cumulative allocation, and when it starts. */
export interface RegimeInfo {
  /** 0-based order among salary entries. */
  index: number
  /** Salary entry ISO date. */
  date: string
  /** Monthly salary in INR. */
  salary: number
  /** Salary - previous salary (0 for the first regime). */
  increment: number
  /** Month index the allocation begins (month after `date`). */
  effectiveIndex: number
  /** "Mon'YY" label for `effectiveIndex`. */
  effectiveLabel: string
  /** Recurring monthly allocation in INR. */
  alloc: Allocation
  /** Allocation as fractions of salary (the needs/wants/savings "rates"). */
  rates: Allocation
}

/** One month of the walked timeline. */
export interface MonthRow {
  index: number
  /** "yyyy-mm". */
  key: string
  /** "Mon'YY". */
  label: string
  year: number
  regimeIndex: number
  salary: number
  /** Recurring allocation from salary. */
  base: Allocation
  /** One-time bonus injection this month (zeros when none). */
  bonus: Allocation
  /** Gross bonus amount received this month. */
  bonusInflow: number
  /** This month's total savings contribution (base + bonus). */
  savings: number
  needsRate: number
  wantsRate: number
  savingsRate: number
  /** Running sum of savings contributions (nominal cash saved). */
  cashCumulative: number
  /** Running corpus with monthly compounding. */
  investedCumulative: number
}

/** One Indian financial year (Apr–Mar), aggregated from its months. */
export interface FinancialYearRow {
  /** FY start year, e.g. 2016 for F.Y. 2016-17. */
  startYear: number
  /** Full label, e.g. "F.Y. 2016-17". */
  label: string
  /** Compact axis label, e.g. "FY17". */
  shortLabel: string
  /** Total salary received across the FY's months. */
  income: number
  /** Recurring salary savings in the FY. */
  salarySavings: number
  /** Bonus/windfall savings deployed in the FY. */
  bonusSavings: number
  /** salarySavings + bonusSavings. */
  totalSavings: number
  /** Gross windfalls received (deployed) in the FY. */
  windfall: number
  needs: number
  wants: number
  /** End-of-FY nominal cash saved (cumulative). */
  cashCumulative: number
  /** End-of-FY invested corpus (cumulative). */
  investedCumulative: number
}

export interface MnwsSummary {
  hasData: boolean
  monthCount: number
  firstLabel: string
  lastLabel: string
  /** Whole+fractional years covered, `monthCount / 12`. */
  years: number
  totalSalary: number
  totalNeeds: number
  totalWants: number
  /** Nominal cash saved over the whole timeline (== final cashCumulative). */
  totalSavings: number
  salarySavings: number
  bonusReceived: number
  bonusToSavings: number
  bonusToNeeds: number
  bonusToWants: number
  /** Corpus at the end, with returns. */
  investedCorpus: number
  /** investedCorpus - totalSavings (the compounding uplift). */
  investmentGain: number
  /** totalSavings / (totalSalary + bonusReceived). */
  overallSavingsRate: number
  /** Latest salary entered (the current goal is derived from it). */
  currentSalary: number
  /** Latest regime's rates - the "current needs/wants/savings goal". */
  currentRates: Allocation
  /** Latest regime's monthly allocation in INR. */
  currentAlloc: Allocation
  /** Number of salary increments (regimes - 1). */
  incrementCount: number
  annualReturnPct: number
}

export interface MnwsResult {
  months: MonthRow[]
  financialYears: FinancialYearRow[]
  regimes: RegimeInfo[]
  summary: MnwsSummary
  warnings: string[]
}

function addAlloc(a: Allocation, b: Allocation): Allocation {
  return {
    needs: a.needs + b.needs,
    wants: a.wants + b.wants,
    savings: a.savings + b.savings,
  }
}

function ratesOf(alloc: Allocation, salary: number): Allocation {
  if (!(salary > 0)) return { ...ZERO }
  return {
    needs: alloc.needs / salary,
    wants: alloc.wants / salary,
    savings: alloc.savings / salary,
  }
}

/** Build the ordered, cumulative salary regimes from the raw salary entries. */
function buildRegimes(data: MnwsDataset): RegimeInfo[] {
  const sorted = data.salaries
    .filter((s) => monthIndexFromIso(s.date) !== null)
    .map((s) => ({
      date: s.date,
      amount: Number.isFinite(s.amount) ? Math.max(0, s.amount) : 0,
    }))
    .sort((a, b) => compareIso(a.date, b.date))

  const regimes: RegimeInfo[] = []
  let alloc: Allocation = { ...ZERO }
  let prevSalary = 0

  sorted.forEach((s, i) => {
    if (i === 0) {
      alloc = {
        needs: BASE_SPLIT.needs * s.amount,
        wants: BASE_SPLIT.wants * s.amount,
        savings: BASE_SPLIT.savings * s.amount,
      }
    } else {
      const delta = s.amount - prevSalary
      alloc = {
        needs: alloc.needs + INCREMENT_SPLIT.needs * delta,
        wants: alloc.wants + INCREMENT_SPLIT.wants * delta,
        savings: alloc.savings + INCREMENT_SPLIT.savings * delta,
      }
    }
    const effectiveIndex = monthIndexFromIso(s.date)! + 1
    regimes.push({
      index: i,
      date: s.date,
      salary: s.amount,
      increment: i === 0 ? 0 : s.amount - prevSalary,
      effectiveIndex,
      effectiveLabel: fmtMonthYear(indexToIso(effectiveIndex)),
      alloc: { ...alloc },
      rates: ratesOf(alloc, s.amount),
    })
    prevSalary = s.amount
  })

  return regimes
}

/** Map each in-range applied month index to its aggregated bonus injection. */
function buildBonusMap(
  data: MnwsDataset,
  startIndex: number,
  endIndex: number,
): {
  map: Map<number, { alloc: Allocation; inflow: number }>
  dropped: number
  unbalanced: number
} {
  const map = new Map<number, { alloc: Allocation; inflow: number }>()
  let dropped = 0
  let unbalanced = 0

  for (const b of data.bonuses) {
    const raw = monthIndexFromIso(b.date)
    if (raw === null) continue
    const amount = Number.isFinite(b.amount) ? Math.max(0, b.amount) : 0
    if (amount === 0) continue

    // Deploy the month after receipt; a windfall received before tracking began
    // lands in the first tracked month, one dated in the future is dropped.
    const applied = Math.max(raw + 1, startIndex)
    if (applied > endIndex) {
      dropped++
      continue
    }

    // Only count an unbalanced split once we know the bonus is actually applied.
    const needsPct = Number.isFinite(b.needsPct) ? b.needsPct : 0
    const wantsPct = Number.isFinite(b.wantsPct) ? b.wantsPct : 0
    const savingsPct = Number.isFinite(b.savingsPct) ? b.savingsPct : 0
    if (Math.abs(needsPct + wantsPct + savingsPct - 100) > 0.01) unbalanced++

    const add: Allocation = {
      needs: amount * (needsPct / 100),
      wants: amount * (wantsPct / 100),
      savings: amount * (savingsPct / 100),
    }
    const cur = map.get(applied) ?? { alloc: { ...ZERO }, inflow: 0 }
    map.set(applied, {
      alloc: addAlloc(cur.alloc, add),
      inflow: cur.inflow + amount,
    })
  }

  return { map, dropped, unbalanced }
}

function emptyResult(regimes: RegimeInfo[], warnings: string[]): MnwsResult {
  const last = regimes[regimes.length - 1]
  return {
    months: [],
    financialYears: [],
    regimes,
    warnings,
    summary: {
      hasData: false,
      monthCount: 0,
      firstLabel: "-",
      lastLabel: "-",
      years: 0,
      totalSalary: 0,
      totalNeeds: 0,
      totalWants: 0,
      totalSavings: 0,
      salarySavings: 0,
      bonusReceived: 0,
      bonusToSavings: 0,
      bonusToNeeds: 0,
      bonusToWants: 0,
      investedCorpus: 0,
      investmentGain: 0,
      overallSavingsRate: 0,
      currentSalary: last?.salary ?? 0,
      currentRates: last ? last.rates : { ...ZERO },
      currentAlloc: last ? last.alloc : { ...ZERO },
      incrementCount: Math.max(0, regimes.length - 1),
      annualReturnPct: 0,
    },
  }
}

/**
 * Compute the full MNWS timeline and summary for a dataset as of `today`
 * (ISO "yyyy-mm-dd"). Returns an empty (but well-formed) result when there is
 * no salary yet or the first allocation month has not arrived.
 */
export function computeMnws(data: MnwsDataset, today: string): MnwsResult {
  const regimes = buildRegimes(data)
  const warnings: string[] = []

  const annualReturnPct = Number.isFinite(data.settings.annualReturnPct)
    ? Math.max(0, data.settings.annualReturnPct)
    : 0

  if (regimes.length === 0) return emptyResult(regimes, warnings)

  const startIndex = regimes[0]!.effectiveIndex
  const todayIndex = monthIndexFromIso(today)
  if (todayIndex === null || todayIndex < startIndex) return emptyResult(regimes, warnings)
  const endIndex = todayIndex

  const { map: bonusMap, dropped, unbalanced } = buildBonusMap(data, startIndex, endIndex)
  if (dropped > 0) {
    warnings.push(
      `${dropped} bonus ${dropped === 1 ? "entry is" : "entries are"} dated after the current month and ${dropped === 1 ? "was" : "were"} not applied.`,
    )
  }
  if (unbalanced > 0) {
    warnings.push(
      `${unbalanced} bonus split ${unbalanced === 1 ? "does" : "do"} not add up to 100 %; the remainder is treated as spending.`,
    )
  }

  const monthlyRate = annualReturnPct / 100 / 12

  const months: MonthRow[] = []
  let regimePtr = 0
  let cashCumulative = 0
  let invested = 0

  for (let m = startIndex; m <= endIndex; m++) {
    while (regimePtr + 1 < regimes.length && regimes[regimePtr + 1]!.effectiveIndex <= m) {
      regimePtr++
    }
    const regime = regimes[regimePtr]!
    const base = regime.alloc
    const bonusEntry = bonusMap.get(m)
    const bonus = bonusEntry ? bonusEntry.alloc : { ...ZERO }
    const bonusInflow = bonusEntry ? bonusEntry.inflow : 0

    const savings = base.savings + bonus.savings
    cashCumulative += savings
    invested = invested * (1 + monthlyRate) + savings

    const iso = indexToIso(m)
    months.push({
      index: m,
      key: iso.slice(0, 7),
      label: fmtMonthYear(iso),
      year: indexToYear(m),
      regimeIndex: regime.index,
      salary: regime.salary,
      base: { ...base },
      bonus,
      bonusInflow,
      savings,
      needsRate: regime.rates.needs,
      wantsRate: regime.rates.wants,
      savingsRate: regime.rates.savings,
      cashCumulative,
      investedCumulative: invested,
    })
  }

  // Aggregate to Indian financial years (Apr–Mar) for the schedule and bar chart.
  const fyMap = new Map<number, FinancialYearRow>()
  for (const row of months) {
    const startYear = financialYearStart(row.index)
    const cur =
      fyMap.get(startYear) ??
      ({
        startYear,
        label: financialYearLabel(startYear),
        shortLabel: financialYearShort(startYear),
        income: 0,
        salarySavings: 0,
        bonusSavings: 0,
        totalSavings: 0,
        windfall: 0,
        needs: 0,
        wants: 0,
        cashCumulative: 0,
        investedCumulative: 0,
      } satisfies FinancialYearRow)
    cur.income += row.salary
    cur.salarySavings += row.base.savings
    cur.bonusSavings += row.bonus.savings
    cur.totalSavings += row.savings
    cur.windfall += row.bonusInflow
    cur.needs += row.base.needs + row.bonus.needs
    cur.wants += row.base.wants + row.bonus.wants
    // Overwritten each month; the last write is the FY's final tracked month.
    cur.cashCumulative = row.cashCumulative
    cur.investedCumulative = row.investedCumulative
    fyMap.set(startYear, cur)
  }
  const financialYears = [...fyMap.values()].sort((a, b) => a.startYear - b.startYear)

  // Roll up the summary from the walked months.
  let totalSalary = 0
  let totalNeeds = 0
  let totalWants = 0
  let salarySavings = 0
  let bonusReceived = 0
  let bonusToSavings = 0
  let bonusToNeeds = 0
  let bonusToWants = 0
  for (const row of months) {
    totalSalary += row.salary
    totalNeeds += row.base.needs + row.bonus.needs
    totalWants += row.base.wants + row.bonus.wants
    salarySavings += row.base.savings
    bonusReceived += row.bonusInflow
    bonusToSavings += row.bonus.savings
    bonusToNeeds += row.bonus.needs
    bonusToWants += row.bonus.wants
  }
  const totalSavings = cashCumulative
  const inflow = totalSalary + bonusReceived
  const last = regimes[regimes.length - 1]!
  const first = months[0]!
  const lastMonth = months[months.length - 1]!

  return {
    months,
    financialYears,
    regimes,
    warnings,
    summary: {
      hasData: true,
      monthCount: months.length,
      firstLabel: first.label,
      lastLabel: lastMonth.label,
      years: months.length / 12,
      totalSalary,
      totalNeeds,
      totalWants,
      totalSavings,
      salarySavings,
      bonusReceived,
      bonusToSavings,
      bonusToNeeds,
      bonusToWants,
      investedCorpus: invested,
      investmentGain: invested - totalSavings,
      overallSavingsRate: inflow > 0 ? totalSavings / inflow : 0,
      currentSalary: last.salary,
      currentRates: last.rates,
      currentAlloc: last.alloc,
      incrementCount: Math.max(0, regimes.length - 1),
      annualReturnPct,
    },
  }
}
