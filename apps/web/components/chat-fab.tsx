"use client";

import * as React from "react";
import { MessageCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Bottom-right floating chat launcher. Placeholder for now: AI features,
 * chatting, and prompts are developed in a later phase. The panel only shows a
 * "coming soon" note.
 */
export function ChatFab() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          role="dialog"
          aria-label="AI assistant"
          className="w-72 animate-fade-up rounded-lg border border-border bg-card p-4 shadow-lg"
        >
          <p className="font-display text-sm font-semibold">TyPhed Assistant</p>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-driven analysis and prompts are on the way. This panel will host
            the assistant in a future release.
          </p>
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-brand-foreground shadow-lg transition-transform hover:scale-105",
          "bg-gradient-to-br from-brand to-brand-2",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
