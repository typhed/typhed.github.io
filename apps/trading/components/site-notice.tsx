import { ClearLocalDataButton } from "@/components/clear-local-data"

/**
 * This site's own strip above the shared footer: the investment disclaimer and
 * the control that erases every tool's locally stored data on demand. The
 * footer itself stays the shared brand footer.
 */
export function SiteNotice() {
  return (
    <div className="border-t border-border/60">
      <div className="container flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Not investment advice. Verify every figure before you trade.</p>
        <ClearLocalDataButton />
      </div>
    </div>
  )
}
