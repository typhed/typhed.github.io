import Link from "next/link";
import { CandlestickChart } from "lucide-react";

import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Text-plus-glyph brand lockup used in the header and footer. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-display", className)}
      aria-label={`${SITE.name} home`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-brand to-brand-2 text-brand-foreground">
        <CandlestickChart className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        TyPhed<span className="text-brand"> Trading</span>
      </span>
    </Link>
  );
}
