"use client"

import * as React from "react"
import { SendHorizontal } from "lucide-react"

import { cn } from "@typhed/ui/lib/utils"

interface Message {
  id: number
  role: "user" | "assistant"
  text: string
}

const GREETING: Message = {
  id: 0,
  role: "assistant",
  text: "Hi - I'm the TyPhed assistant. Ask me about your chart, an indicator, or a sizing decision. Live AI answers are coming in a later release; for now I'll acknowledge your prompt so the flow is ready.",
}

/**
 * Chat UI shell wired for a future AI backend. Messages, input, and send all
 * work; the responder is a placeholder until the model is connected. Swap
 * `placeholderReply` for a real streaming call when the backend lands.
 */
export function ChatPanel() {
  const [messages, setMessages] = React.useState<Message[]>([GREETING])
  const [draft, setDraft] = React.useState("")
  const nextId = React.useRef(1)
  const endRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function send() {
    const text = draft.trim()
    if (!text) return
    const userMessage: Message = { id: nextId.current++, role: "user", text }
    const reply: Message = {
      id: nextId.current++,
      role: "assistant",
      text: placeholderReply(text),
    }
    setMessages((prev) => [...prev, userMessage, reply])
    setDraft("")
  }

  return (
    <div className="border-border bg-card flex h-[28rem] w-80 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-lg border shadow-xl">
      <div className="border-border border-b px-4 py-3">
        <p className="font-display text-sm font-semibold">TyPhed Assistant</p>
        <p className="text-muted-foreground text-xs">Placeholder - AI answers coming soon</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="border-border flex items-center gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about your chart..."
          className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={draft.trim() === ""}
          className="bg-brand text-brand-foreground focus-visible:ring-ring focus-visible:ring-offset-card flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

function placeholderReply(prompt: string): string {
  const topic = prompt.length > 60 ? `${prompt.slice(0, 57)}...` : prompt
  return `Got it - "${topic}". The assistant isn't connected to a model yet, so I can't analyse that live. When AI lands it will read your loaded data and tools to answer here.`
}
