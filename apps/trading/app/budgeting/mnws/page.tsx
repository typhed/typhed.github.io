import type { Metadata } from "next"

import { MnwsDashboard } from "@/components/budgeting/mnws/mnws-dashboard"

export const metadata: Metadata = {
  title: "50-30-20 (modified) Rule",
  description:
    "The 50-30-20 (modified) rule: the classic 50-30-20 budget split on your first salary, every raise reversed into savings, and windfalls deployed by an editable split - projecting your savings corpus month by month, entirely in your browser, with a reusable JSON export.",
}

export default function MnwsBudgetingPage() {
  return (
    <div className="container py-8">
      <MnwsDashboard />
    </div>
  )
}
