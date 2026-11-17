"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { faAnglesLeft, faChevronUp } from "@fortawesome/free-solid-svg-icons"
import { Icon } from "./icon"
import type { SidebarGroup } from "@typhed/brand"

import { cn } from "../lib/utils"

/**
 * A property's own product menu, rendered as a collapsible column to the left
 * of the page content. The header stays the same brand header on every site;
 * anything a single property needs to navigate lives here instead.
 *
 * Three levels keep the menu readable at a glance: the property's name heads
 * the column, each group label is a small, wide-tracked, muted caption, and the
 * links are larger foreground text, indented on a guide line under their
 * label. The current page carries `aria-current="page"`, a brand bar, and a
 * brand tint; its text stays foreground, because brand-coloured text this
 * small misses the AA contrast ratio in the light theme.
 *
 * The menu starts expanded. Collapsing animates: from `md` the column narrows
 * to a rail while the menu fades, and below `md` the menu folds up under its
 * title. The transitions switch on only after the stored choice is restored,
 * so a page load never animates, and `prefers-reduced-motion` turns them off.
 * A collapsed menu is `inert`, so keyboard and screen-reader users skip it.
 *
 * The collapse choice is remembered per property in localStorage, which can be
 * unavailable (private windows, blocked storage), so every read and write is
 * guarded and the menu simply falls back to expanded. With no groups the
 * component renders nothing.
 */
export function ProductSidebar({
  groups,
  storageKey,
  label,
}: {
  groups: readonly SidebarGroup[]
  /** localStorage key that remembers the collapse choice for this property. */
  storageKey: string
  /** The property's name: the column's visible title and the menu's accessible name. */
  label: string
}) {
  const [open, setOpen] = React.useState(true)
  const [animate, setAnimate] = React.useState(false)
  const pathname = usePathname()
  const menuId = React.useId()
  const titleId = React.useId()

  React.useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the stored choice lives in localStorage, which only the browser has, so it loads after hydration
      if (window.localStorage.getItem(storageKey) === "closed") setOpen(false)
    } catch {
      // Storage unavailable: keep the default (expanded).
    }
    // Two frames later the restored state has painted, so only the visitor's
    // own toggles animate.
    let second = 0
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setAnimate(true))
    })
    return () => {
      window.cancelAnimationFrame(first)
      window.cancelAnimationFrame(second)
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

  // Every transition is declared under motion-safe, so a visitor who prefers
  // reduced motion gets none at all, whatever the breakpoint.
  return (
    <aside
      className={cn(
        "shrink-0 border-b border-border/60 bg-background/60 backdrop-blur md:overflow-x-clip md:border-r md:border-b-0",
        open ? "md:w-60" : "md:w-12",
        animate &&
          "md:motion-safe:transition-[width] md:motion-safe:duration-300 md:motion-safe:ease-in-out",
      )}
    >
      <div className="md:sticky md:top-16">
        <div className="relative flex h-12 items-center justify-end px-2">
          <span
            id={titleId}
            className={cn(
              "pointer-events-none absolute inset-y-0 right-11 left-5 truncate text-sm leading-12 font-semibold text-foreground",
              !open && "md:opacity-0",
              animate && "motion-safe:transition-opacity motion-safe:duration-200",
            )}
          >
            {label}
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Collapse menu" : "Expand menu"}
            title={open ? "Collapse menu" : "Expand menu"}
            className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
          >
            {/* The column narrows sideways from md and folds up below it, so
                each layout gets the arrow that points the way it moves. */}
            <Icon
              icon={faAnglesLeft}
              className={cn(
                "hidden h-4 w-4 md:block",
                !open && "rotate-180",
                animate && "motion-safe:transition-transform motion-safe:duration-300",
              )}
            />
            <Icon
              icon={faChevronUp}
              className={cn(
                "h-4 w-4 md:hidden",
                !open && "rotate-180",
                animate && "motion-safe:transition-transform motion-safe:duration-300",
              )}
            />
          </button>
        </div>
        <div
          className={cn(
            "grid md:grid-rows-[1fr]",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            animate &&
              (open
                ? "motion-safe:transition-[grid-template-rows,opacity] motion-safe:delay-75 motion-safe:duration-300 motion-safe:ease-out"
                : "motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-200 motion-safe:ease-in"),
          )}
        >
          <nav
            id={menuId}
            aria-labelledby={titleId}
            inert={!open}
            className="min-h-0 overflow-hidden"
          >
            {/* A fixed width from md keeps the text still while the column
                narrows around it, instead of rewrapping every frame. */}
            <div className="space-y-5 px-2 pt-1 pb-5 md:w-60">
              {groups.map((group, index) => (
                <MenuGroup key={group.label ?? index} group={group} isActive={isActive} />
              ))}
            </div>
          </nav>
        </div>
      </div>
    </aside>
  )
}

/**
 * One group of the menu. A labelled group shows its caption and indents its
 * links on a guide line; an unlabelled group holds top-level links, set flush
 * and one weight heavier.
 */
function MenuGroup({
  group,
  isActive,
}: {
  group: SidebarGroup
  isActive: (href: string) => boolean
}) {
  const labelId = React.useId()
  const labelled = Boolean(group.label)

  return (
    <div>
      {labelled ? (
        <p
          id={labelId}
          className="mb-1.5 px-3 text-xs font-semibold tracking-[0.18em] whitespace-nowrap text-muted-foreground uppercase"
        >
          {group.label}
        </p>
      ) : null}
      <ul
        aria-labelledby={labelled ? labelId : undefined}
        className={cn("space-y-0.5", labelled && "ml-3 border-l border-border")}
      >
        {group.links.map((link) => {
          const active = isActive(link.href)
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-r-md border-l-2 py-1.5 pr-3 pl-3 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
                  labelled ? "-ml-px" : "font-medium",
                  active
                    ? "border-brand bg-brand/10 font-semibold text-foreground"
                    : "border-transparent text-foreground/75 hover:border-muted-foreground/50 hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
