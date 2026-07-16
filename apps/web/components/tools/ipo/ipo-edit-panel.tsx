"use client";

import * as React from "react";
import { X } from "lucide-react";

import type { FinancialRow, GmpRow, IpoDataset, IpoMeta, Milestone } from "@/lib/ipo/types";
import { Button } from "@/components/ui/button";
import {
  FinancialsEditor,
  GmpEditor,
  MetaEditor,
  TimelineEditor,
} from "@/components/tools/ipo/ipo-editors";

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function IpoEditPanel({
  open,
  onClose,
  data,
  today,
  onMetaChange,
  onTimelineChange,
  onGmpChange,
  onFinancialsChange,
}: {
  open: boolean;
  onClose: () => void;
  data: IpoDataset;
  today: string;
  onMetaChange: (patch: Partial<IpoMeta>) => void;
  onTimelineChange: (next: Milestone[]) => void;
  onGmpChange: (next: GmpRow[]) => void;
  onFinancialsChange: (next: FinancialRow[]) => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Edit IPO data"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-xl duration-200 animate-in slide-in-from-right"
      >
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-semibold">Edit IPO Data</h2>
          <Button ref={closeRef} variant="ghost" size="icon" aria-label="Close editor" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 space-y-8 overflow-y-auto p-4">
          <EditorSection title="Issue Details">
            <MetaEditor meta={data.meta} onChange={onMetaChange} />
          </EditorSection>
          <EditorSection title="IPO Timeline">
            <TimelineEditor milestones={data.timeline} today={today} onChange={onTimelineChange} />
          </EditorSection>
          <EditorSection title="Reported GMP">
            <GmpEditor rows={data.gmp} onChange={onGmpChange} />
          </EditorSection>
          <EditorSection title="Company Reported Financials">
            <FinancialsEditor rows={data.financials} onChange={onFinancialsChange} />
          </EditorSection>
        </div>

        <footer className="border-t border-border p-4">
          <Button variant="brand" className="w-full" onClick={onClose}>
            Done
          </Button>
        </footer>
      </aside>
    </div>
  );
}
