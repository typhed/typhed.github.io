"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import type { SidebarGroup } from "@typhed/brand"

import { cn } from "../lib/utils"

/**
 * A property's own product menu, rendered as a collapsible column to the left
 * of the page content. The header stays the same brand header on every site;
 * anything a single property needs to navigate lives here instead.
 *
 * The menu starts expanded. A visitor's collapse choice is remembered per
 * property in localStorage, which can be unavailable (private windows, blocked
 * storage), so every read and write is guarded and the menu simply falls back
 * to expanded. With no groups the component renders nothing.
 */
export function ProductSidebar({
  groups,
  storageKey,
  label,
}: {
  groups: readonly SidebarGroup[]
  /** localStorage key that remembers the collapse choice for this property. */
  storageKey: string
  /** Accessible name of the navigation landmark. */
  label: string
}) {
  const [open, setOpen] = React.useState(true)
  const pathname = usePathname()
  const menuId = React.useId()

  React.useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) === "closed") setOpen(false)
    } catch {
      // Storage unavailable: keep the default (expanded).
    }
  }, [storageKey])

  const toggle = React.useCallback(() => {
    setOpen((wasOpen) => {
      const next = !wasOpen
      try {
        window.localStorage.setItem(storageKey, next ? "open" : "closed")
      } catch {
        // Storage unavailable: the choice lasts for this page view only.
      }
      return next
    })
  }, [storageKey])

  if (groups.length === 0) return null

  const isActive = (href: string) => {
    if (href.includes("?")) return false
    const normalise = (path: string) => (path.endsWith("/") ? path : `${path}/`)
    return normalise(pathname ?? "/") === normalise(href)
  }

  return (
    <aside
      className={cn(
        "border-border/60 bg-background/60 shrink-0 border-b backdrop-blur md:border-b-0 md:border-r",
        open ? "md:w-60" : "md:w-12",
      )}
    >
      <div className="md:sticky md:top-16">
        <div className={cn("flex px-2 pt-2", open ? "justify-end" : "justify-center")}>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Collapse menu" : "Expand menu"}
            title={open ? "Collapse menu" : "Expand menu"}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>
        <nav id={menuId} aria-label={label} hidden={!open} className="px-3 pb-4">
          {groups.map((group, index) => (
            <div key={group.label ?? index} className="mt-3 first:mt-1">
              {group.label ? (
                <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {group.links.map((link) => {
                  const active = isActive(link.href)
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "hover:bg-accent hover:text-accent-foreground block rounded-md px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-accent text-foreground font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
