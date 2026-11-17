"use client";

import {
  Banknote,
  CalendarCheck,
  CircleDot,
  ClipboardCheck,
  Flag,
  FlagOff,
  Landmark,
  Rocket,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { fmtDisplayDate } from "@/lib/format";
import type { Milestone } from "@/lib/ipo/types";
import { isListingMilestone, sortedTimeline } from "@/lib/ipo/analytics";
import { ToolCard } from "@/components/tools/controls";

type Status = "past" | "today" | "upcoming";

function iconFor(label: string): LucideIcon {
  const key = label.toLowerCase();
  if (isListingMilestone(label)) return Rocket;
  if (key.includes("start") || key.includes("open")) return Flag;
  if (key.includes("end") || key.includes("close")) return FlagOff;
  if (key.includes("allot")) return ClipboardCheck;
  if (key.includes("refund")) return Banknote;
  if (key.includes("demat") || key.includes("transfer")) return Landmark;
  if (key.includes("mandate")) return CalendarCheck;
  return CircleDot;
}

function statusOf(date: string, today: string): Status {
  if (!today) return "upcoming";
  if (date < today) return "past";
  if (date === today) return "today";
  return "upcoming";
}

export function IpoTimeline({ milestones, today }: { milestones: Milestone[]; today: string }) {
  // Milestones without a date are skipped - a fixed milestone can be left blank.
  const ordered = sortedTimeline(milestones).filter((milestone) => milestone.date);

  if (ordered.length === 0) {
    return (
      <ToolCard title="IPO Timeline" description="Key dates in the offer lifecycle.">
        <p className="text-sm text-muted-foreground">
          No timeline dates set yet - add them from &ldquo;Edit data&rdquo;.
        </p>
      </ToolCard>
    );
  }

  return (
    <ToolCard title="IPO Timeline" description="Key dates in the offer lifecycle.">
      <ol
        role="list"
        className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-2"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-[18px] top-0 h-full w-px bg-border md:left-0 md:right-0 md:top-[18px] md:h-px md:w-auto"
        />
        {ordered.map((milestone) => {
          const status = statusOf(milestone.date, today);
          const emphasis = isListingMilestone(milestone.label);
          const Icon = iconFor(milestone.label);
          return (
            <li
              key={milestone.id}
              aria-label={`${milestone.label}, ${fmtDisplayDate(milestone.date)}, ${status}`}
              aria-current={status === "today" ? "date" : undefined}
              className="relative flex items-center gap-3 md:min-w-0 md:flex-1 md:flex-col md:gap-2 md:text-center"
            >
              <span
                className={cn(
                  "z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 bg-card transition-colors",
                  status === "past" && "border-brand text-brand",
                  status === "today" && "border-brand bg-brand text-brand-foreground ring-4 ring-brand/25",
                  status === "upcoming" && "border-border text-muted-foreground",
                  emphasis && status !== "today" && "ring-2 ring-brand/25",
                  emphasis && status === "upcoming" && "border-brand text-brand",
                )}
              >
                <Icon className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "flex items-center gap-2 text-sm md:justify-center",
                    emphasis ? "font-display font-semibold" : "font-medium",
                    status === "upcoming" && !emphasis && "text-muted-foreground",
                  )}
                >
                  {milestone.label}
                  {status === "today" && (
                    <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-foreground">
                      Today
                    </span>
                  )}
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {fmtDisplayDate(milestone.date)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </ToolCard>
  );
}
