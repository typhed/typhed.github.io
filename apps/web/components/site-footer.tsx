import { BrandMark } from "@/components/brand-mark";
import { SITE } from "@/lib/constants";

/** Footer with brand lockup, contact, and the entity notice. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card bg-gradient-to-b from-brand/5 to-brand-2/5">
      <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-sm space-y-3">
          <BrandMark />
          <p className="text-sm text-muted-foreground">{SITE.description}</p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="block transition-colors hover:text-brand"
          >
            {SITE.contactEmail}
          </a>
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-colors hover:text-brand"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container flex flex-col gap-1 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {year} {SITE.entity}. All rights reserved.
          </span>
          <span>Not investment advice. Verify every figure before you trade.</span>
        </div>
      </div>
    </footer>
  );
}
