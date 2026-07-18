import { fmtInr, fmtPercent } from "@/lib/format";
import type { MnwsResult } from "@/lib/budgeting/mnws/engine";
import { ToolCard, StatTile } from "@/components/tools/controls";
import { SERIES, SERIES_ORDER } from "./series";
import { SplitBar } from "./mnws-visuals";

/** "X yr Y mo" from a month count. */
export function fmtDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr`);
  if (rem > 0) parts.push(`${rem} mo`);
  return parts.join(" ") || "0 mo";
}

/** The current needs/wants/savings goal derived from the latest salary. */
function CurrentGoal({ result }: { result: MnwsResult }) {
  const { summary } = result;
  const { currentRates, currentAlloc, currentSalary } = summary;
  const hasSalary = currentSalary > 0;

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Current needs / wants / savings goal
        </p>
        <p className="text-xs text-muted-foreground">
          at {hasSalary ? `${fmtInr(currentSalary, 0)} / month` : "your latest salary"}
        </p>
      </div>
      <SplitBar
        split={{ needs: currentRates.needs, wants: currentRates.wants, savings: currentRates.savings }}
        height={14}
        className="mt-3"
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {SERIES_ORDER.map((key) => (
          <div key={key} className="rounded-md border border-border bg-card p-3 text-center">
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SERIES[key].color }} />
              {SERIES[key].label}
            </p>
            <p className={`mt-1 font-display text-xl font-semibold tabular-nums ${SERIES[key].textClass}`}>
              {hasSalary ? fmtPercent(currentRates[key], 1) : "-"}
            </p>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {hasSalary ? `${fmtInr(currentAlloc[key], 0)}/mo` : "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** KPI panel + current-goal summary for the MNWS plan. */
export function MnwsOverview({ result }: { result: MnwsResult }) {
  const { summary } = result;

  if (!summary.hasData) {
    const firstAlloc = result.regimes[0]?.effectiveLabel;
    return (
      <ToolCard
        title="Plan summary"
        description="Add a salary to project your needs / wants / savings and savings corpus."
      >
        {result.regimes.length > 0 ? (
          <>
            <CurrentGoal result={result} />
            {firstAlloc && (
              <p className="mt-3 text-sm text-muted-foreground">
                Allocations begin <span className="font-medium text-foreground">{firstAlloc}</span>, the month after
                your first salary. Add earlier salaries or wait for that month to see the full timeline.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No salary entries yet. Add your first salary below to get started.
          </p>
        )}
      </ToolCard>
    );
  }

  return (
    <ToolCard
      title="Plan summary"
      description={`${summary.firstLabel} to ${summary.lastLabel} · ${fmtDuration(summary.monthCount)} of disciplined budgeting.`}
    >
      <CurrentGoal result={result} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Invested corpus"
          value={fmtInr(summary.investedCorpus, 0)}
          tone="brand"
          note={`@ ${fmtPercent(summary.annualReturnPct / 100, 0)} p.a.`}
        />
        <StatTile
          label="Total saved (cash)"
          value={fmtInr(summary.totalSavings, 0)}
          note="contributions only"
        />
        <StatTile
          label="Compounding gain"
          value={fmtInr(summary.investmentGain, 0)}
          tone="positive"
          note="corpus − cash saved"
        />
        <StatTile
          label="Current salary"
          value={fmtInr(summary.currentSalary, 0)}
          note="monthly, latest"
        />
        <StatTile
          label="Lifetime savings rate"
          value={fmtPercent(summary.overallSavingsRate, 1)}
          note="of all income saved"
        />
        <StatTile
          label="Raises · bonuses"
          value={`${summary.incrementCount} · ${fmtInr(summary.bonusReceived, 0)}`}
          note={`${summary.monthCount} months tracked`}
        />
      </div>
    </ToolCard>
  );
}

/** The prominent bottom-line callout: total saved + the current goal split. */
export function MnwsBottomLine({ result }: { result: MnwsResult }) {
  const { summary } = result;
  if (!summary.hasData) return null;

  const goal = SERIES_ORDER.map(
    (key) => `${SERIES[key].label} ${fmtPercent(summary.currentRates[key], 0)}`,
  ).join(" · ");

  return (
    <div className="rounded-lg border border-brand/30 bg-brand/10 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Bottom line</p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground sm:text-base">
        Over <span className="font-semibold">{fmtDuration(summary.monthCount)}</span> of disciplined MNWS budgeting,
        you set aside <span className="font-semibold tabular-nums">{fmtInr(summary.totalSavings, 0)}</span> in savings
        — compounding to a corpus of{" "}
        <span className="font-semibold tabular-nums text-brand">{fmtInr(summary.investedCorpus, 0)}</span> at{" "}
        {fmtPercent(summary.annualReturnPct / 100, 0)} p.a. Your current goal is{" "}
        <span className="font-semibold">{goal}</span>.
      </p>
    </div>
  );
}
