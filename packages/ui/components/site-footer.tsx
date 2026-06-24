import * as React from "react"
import { Github, Mail } from "lucide-react"

import { COPYRIGHT, SOCIAL_LINKS } from "../lib/constants"
import { cn } from "../lib/utils"

const ICONS = {
  github: Github,
  mail: Mail,
} as const

/**
 * Footer with the exact ownership copyright. The legal entity name is kept
 * as visible text (not an image) so it contributes to search relevance for
 * "Debmalya Pramanik HUF".
 */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("relative z-10 w-full border-t border-border/40", className)}>
      <div className="container flex flex-col items-center gap-5 py-8 text-center">
        <nav aria-label="Contact links" className="flex items-center gap-3">
          {SOCIAL_LINKS.map((link) => {
            const Icon = ICONS[link.icon]
            return (
              <a
                key={link.label}
                href={link.href}
                aria-label={link.label}
                title={link.label}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/40 text-muted-foreground backdrop-blur-md transition-colors hover:border-brand/50 hover:text-brand"
              >
                <Icon className="h-4 w-4" />
              </a>
            )
          })}
        </nav>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>{COPYRIGHT.line1}</p>
          <p>{COPYRIGHT.line2}</p>
        </div>
      </div>
    </footer>
  )
}
