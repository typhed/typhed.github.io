import { fmtInr } from "@/lib/format"
import type { MnwsResult } from "@/lib/budgeting/mnws/engine"
import { ToolCard } from "@/components/tools/controls"

/** A right-aligned numeric cell; renders a muted dash for zero/empty. */
function Num({ value, muted = false }: { value: number; muted?: boolean }) {
  return (
    <td className={`px-2 py-1.5 text-right tabular-nums ${muted ? "text-muted-foreground" : ""}`}>
      {value > 0 ? fmtInr(value, 0) : <span className="text-muted-foreground">-</span>}
    </td>
  )
}

/**
 * Financial-year (Apr–Mar) schedule: income and how the rule split it each F.Y.,
 * plus the cumulative cash saved and invested corpus building over the years.
 * A totals row closes the table. ~1 row per year, so it renders in full.
 */
export function MnwsSchedule({ result }: { result: MnwsResult }) {
  if (!result.summary.hasData) return null
  const { financialYears, summary } = result

  return (
    <ToolCard
      title="Financial-year schedule"
      description="Every Indian financial year (Apr–Mar) from your first allocation to today: income, how the rule split it, and the corpus building."
    >
      <div className="border-border max-h-[28rem] overflow-auto rounded-md border">
        <table className="w-full min-w-[760px] text-xs">
          <caption className="sr-only">
            Per financial year: income, needs, wants, savings, windfalls, cumulative cash saved and
            invested corpus.
          </caption>
          <thead className="bg-card sticky top-0 z-10">
            <tr className="border-border text-muted-foreground border-b text-left">
              <th scope="col" className="px-2 py-2 font-medium">
                Financial year
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Income
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Needs
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Wants
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Savings
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Windfall
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Cash saved
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Corpus
              </th>
            </tr>
          </thead>
          <tbody>
            {financialYears.map((fy) => (
              <tr
                key={fy.startYear}
                className={`border-border/60 border-b ${fy.windfall > 0 ? "bg-brand/5" : ""}`}
              >
                <th scope="row" className="whitespace-nowrap px-2 py-1.5 text-left font-normal">
                  {fy.label}
                </th>
                <Num value={fy.income} muted />
                <Num value={fy.needs} />
                <Num value={fy.wants} />
                <Num value={fy.totalSavings} />
                <Num value={fy.windfall} />
                <Num value={fy.cashCumulative} />
                <td className="text-brand px-2 py-1.5 text-right font-medium tabular-nums">
                  {fmtInr(fy.investedCumulative, 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-border bg-card border-t-2 font-medium">
            <tr>
              <th scope="row" className="px-2 py-2 text-left">
                Total
              </th>
              <Num value={summary.totalSalary} muted />
              <Num value={summary.totalNeeds} />
              <Num value={summary.totalWants} />
              <Num value={summary.totalSavings} />
              <Num value={summary.bonusReceived} />
              <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">-</td>
              <td className="text-brand px-2 py-2 text-right tabular-nums">
                {fmtInr(summary.investedCorpus, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </ToolCard>
  )
}
