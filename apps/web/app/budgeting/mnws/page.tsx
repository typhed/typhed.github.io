import type { Metadata } from "next";

import { MnwsDashboard } from "@/components/budgeting/mnws/mnws-dashboard";

export const metadata: Metadata = {
  title: "MNWS Budgeting Rule",
  description:
    "A modified 50-30-20 budgeting planner: the classic split on your first salary, every raise reversed into savings, and windfalls deployed by an editable split - projecting your savings corpus month by month, entirely in your browser, with a reusable JSON export.",
};

export default function MnwsBudgetingPage() {
  return (
    <div className="container py-8">
      <MnwsDashboard />
    </div>
  );
}
