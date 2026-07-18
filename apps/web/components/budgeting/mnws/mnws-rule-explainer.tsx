import { ToolCard } from "@/components/tools/controls";
import {
  BASE_SPLIT,
  DEFAULT_BONUS_SPLIT,
  INCREMENT_SPLIT,
} from "@/lib/budgeting/mnws/types";
import { SERIES, SERIES_ORDER, type SeriesKey } from "./series";
import { SplitBar } from "./mnws-visuals";

/** One labelled rule: a heading, the split bar, and the three bucket percentages. */
function RuleCard({
  step,
  title,
  description,
  split,
}: {
  step: string;
  title: string;
  description: string;
  split: Record<SeriesKey, number>;
}) {
  const total =
    SERIES_ORDER.reduce((sum, key) => sum + Math.max(0, split[key]), 0) || 1;
  return (
    <div className="border-border bg-background rounded-lg border p-4">
      <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
        {step}
      </p>
      <h3 className="font-display mt-0.5 text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      <SplitBar split={split} className="mt-3" />
      <div className="mt-2 flex justify-between text-xs">
        {SERIES_ORDER.map((key) => (
          <span key={key} className="inline-flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: SERIES[key].color }}
            />
            <span className="text-muted-foreground">{SERIES[key].label}</span>
            <span className="text-foreground font-semibold tabular-nums">
              {Math.round((Math.max(0, split[key]) / total) * 100)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Explains the Modified Needs / Wants / Savings rule at the top of the tool. */
export function MnwsRuleExplainer() {
  return (
    <ToolCard
      title="How the MNWS rule works"
      description="A disciplined twist on 50-30-20: keep your lifestyle steady and let every raise flow mostly into savings."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <RuleCard
          step="Step 1 · Base"
          title="Your first salary"
          description="The classic split anchors your very first month of budgeting."
          split={{
            needs: BASE_SPLIT.needs,
            wants: BASE_SPLIT.wants,
            savings: BASE_SPLIT.savings,
          }}
        />
        <RuleCard
          step="Step 2 · Each raise"
          title="Every increment, reversed"
          description="Only the increase (new salary − old) is split in reverse and added on top of your running budget."
          split={{
            needs: INCREMENT_SPLIT.needs,
            wants: INCREMENT_SPLIT.wants,
            savings: INCREMENT_SPLIT.savings,
          }}
        />
        <RuleCard
          step="Step 3 · Windfalls"
          title="Bonus &amp; maturities"
          description="A one-off bonus or FD maturity is deployed once, the next month, by its own editable split."
          split={{
            needs: DEFAULT_BONUS_SPLIT.needs,
            wants: DEFAULT_BONUS_SPLIT.wants,
            savings: DEFAULT_BONUS_SPLIT.savings,
          }}
        />
      </div>
      <p className="text-muted-foreground mt-4 text-sm">
        Because increments lean 50 % into savings, your recurring{" "}
        <span className="font-medium text-emerald-500">
          savings rate climbs from 20 % toward 50 %
        </span>{" "}
        as your income grows, while{" "}
        <span className="font-medium text-amber-500">
          needs drift down from 50 % toward 20 %
        </span>{" "}
        and wants hold at a flat 30 %. The chart below shows the corpus that
        discipline builds.
      </p>
    </ToolCard>
  );
}
