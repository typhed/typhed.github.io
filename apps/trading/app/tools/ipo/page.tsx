import type { Metadata } from "next"

import { IpoDashboard } from "@/components/tools/ipo/ipo-dashboard"

export const metadata: Metadata = {
  title: "IPO Dashboard",
  description:
    "An editable IPO dashboard - price band, lot size, timeline, financials and GMP - that renders entirely in your browser and exports to a reusable JSON file.",
  alternates: { canonical: "/tools/ipo/" },
}

export default function IpoToolPage() {
  return (
    <div className="container py-8">
      <IpoDashboard />
    </div>
  )
}
