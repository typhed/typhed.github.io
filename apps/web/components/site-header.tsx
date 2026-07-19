import Link from "next/link";

import { NAV_LINKS } from "@/lib/constants";
import { BrandMark } from "@/components/brand-mark";
import { AuthButtons } from "@/components/auth-buttons";
import { ThemeToggle } from "@/components/theme-toggle";

const linkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

/** Sticky, blurred top bar matching the sibling TyPhed sites. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <BrandMark />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                className={linkClass}
                {...(link.newTab
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <AuthButtons />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
