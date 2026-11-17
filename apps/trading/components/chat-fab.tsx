"use client"

import * as React from "react"
import { faComment, faXmark } from "@fortawesome/free-solid-svg-icons"
import { Icon } from "@typhed/ui/components/icon"

import { cn } from "@typhed/ui/lib/utils"
import { ChatPanel } from "@/components/chat/chat-panel"

/**
 * Bottom-right floating chat launcher. Opens the assistant panel, which is a
 * working chat UI shell wired for a future AI backend (see ChatPanel).
 */
export function ChatFab() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div role="dialog" aria-label="AI assistant" className="animate-fade-up">
          <ChatPanel />
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-brand-foreground shadow-lg transition-transform hover:scale-105",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden",
          "bg-linear-to-br from-brand to-brand-2",
        )}
      >
        {open ? (
          <Icon icon={faXmark} className="h-6 w-6" />
        ) : (
          <Icon icon={faComment} className="h-6 w-6" />
        )}
      </button>
    </div>
  )
}
