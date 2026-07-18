"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { fmtInr } from "@/lib/format";
import type { MnwsResult } from "@/lib/budgeting/mnws/engine";
import { ToolCard } from "@/components/tools/controls";
import { Button } from "@/components/ui/button";

/** A right-aligned numeric cell; renders a muted dash for zero/empty. */
function Num({ value, muted = false }: { value: number; muted?: boolean }) {
  return (
    <td
      className={`px-2 py-1.5 text-right tabular-nums ${muted ? "text-muted-foreground" : ""}`}
    >
      {value > 0 ? (
        fmtInr(value, 0)
      ) : (
        <span className="text-muted-foreground">-</span>
      )}
    </td>
  );
}

/** The full month-by-month schedule, collapsed by default (it can be long). */
export function MnwsSchedule({ result }: { result: MnwsResult }) {
  const [open, setOpen] = React.useState(false);

  if (!result.summary.hasData) return null;
  const { months } = result;

  return (
    <ToolCard
      title="Month-by-month schedule"
      description="Every month from your first allocation to today: the rule applied, windfalls deployed, and the corpus building."
    >
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {open ? "Hide" : "Show"} {months.length}-month schedule
      </Button>

      {open && (
        <div className="border-border mt-4 max-h-[28rem] overflow-auto rounded-md border">
          <table className="w-full min-w-[720px] text-xs">
            <caption className="sr-only">
              Monthly needs, wants, savings, windfalls, cumulative cash saved
              and invested corpus.
            </caption>
            <thead className="bg-card sticky top-0 z-10">
              <tr className="border-border text-muted-foreground border-b text-left">
                <th scope="col" className="px-2 py-2 font-medium">
                  Month
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  Salary
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
              {months.map((m) => {
                const hasBonus = m.bonusInflow > 0;
                return (
                  <tr
                    key={m.key}
                    className={`border-border/60 border-b ${hasBonus ? "bg-brand/5" : ""}`}
                  >
                    <th
                      scope="row"
                      className="whitespace-nowrap px-2 py-1.5 text-left font-normal"
                    >
                      {m.label}
                    </th>
                    <Num value={m.salary} muted />
                    <Num value={m.base.needs + m.bonus.needs} />
                    <Num value={m.base.wants + m.bonus.wants} />
                    <Num value={m.savings} />
                    <Num value={m.bonusInflow} />
                    <Num value={m.cashCumulative} />
                    <td className="text-brand px-2 py-1.5 text-right font-medium tabular-nums">
                      {fmtInr(m.investedCumulative, 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ToolCard>
  );
}
