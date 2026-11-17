import Link from "next/link";
import { CandlestickChart } from "lucide-react";

import { BRAND } from "@/lib/platform";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Brand link: gradient glyph plus the TyPhed wordmark. The product identity
 * ("Trading") renders as a separate chip beside it in the header, matching
 * the canonical sub-domain anatomy.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 rounded-md font-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={`${SITE.name} home`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-brand to-brand-2 text-brand-foreground">
        <CandlestickChart className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        {BRAND.name}
      </span>
    </Link>
  );
}
