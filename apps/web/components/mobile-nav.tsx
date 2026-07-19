"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";

import {
  NAV_GROUPS,
  PRODUCT_NAV_LINKS,
  SITE_NAV_LINKS,
} from "@/lib/constants";
import { AuthButtons } from "@/components/auth-buttons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const itemClass =
  "block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

/**
 * Small-screen menu: a hamburger toggle plus a full-width panel anchored
 * below the sticky header (`top-full` relies on the positioned `<header>`
 * ancestor, so keep this rendered inside `SiteHeader`). It renders the same
 * registry-driven links as the desktop nav - the two must never drift -
 * with the tool categories as expandable groups.
 */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const close = React.useCallback(() => {
    setOpen(false);
    setExpanded(null);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <X /> : <Menu />}
      </Button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full z-50 border-b border-border/40 bg-background/95 backdrop-blur-md"
        >
          <nav aria-label="Primary" className="container flex flex-col gap-1 py-3">
            {SITE_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className={itemClass}
              >
                {link.label}
              </Link>
            ))}

            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <button
                  type="button"
                  aria-expanded={expanded === group.label}
                  onClick={() =>
                    setExpanded((prev) =>
                      prev === group.label ? null : group.label,
                    )
                  }
                  className={cn(
                    itemClass,
                    "flex w-full items-center justify-between",
                  )}
                >
                  {group.label}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expanded === group.label && "rotate-180",
                    )}
                  />
                </button>
                {expanded === group.label && (
                  <div className="ml-3 flex flex-col gap-1 border-l border-border/40 pl-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={close}
                        className={itemClass}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {PRODUCT_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={close}
                className={itemClass}
                {...(link.newTab
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
              </a>
            ))}

            <div className="mt-2 border-t border-border/40 pt-3">
              <AuthButtons />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
