import { ArrowRight, ScatterChart, ShieldCheck, Sigma } from "lucide-react";

import { AuthGate } from "@/components/auth-gate";

export default function HomePage() {
  return (
    <AuthGate>
      <Workspace />
    </AuthGate>
  );
}

function Workspace() {
  return (
    <div className="container py-16">
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Phase 0 - foundation shell
        </span>
        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Answer the questions retail charts skip
        </h1>
        <p className="mt-4 text-balance text-muted-foreground">
          Upload your own market data and move past &quot;what price&quot; to
          &quot;how much quantity&quot; - position sizing, portfolio risk, and
          capital allocation, all computed in your browser.
        </p>
        <button
          type="button"
          disabled
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground opacity-60"
        >
          Upload data (arrives in Phase 1)
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <section className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
        <FeatureCard
          icon={<ScatterChart className="h-5 w-5" />}
          title="Fluid charts"
          body="TradingView-style candlesticks and volume from your CSV or XLSX, aggregated to any timeframe."
        />
        <FeatureCard
          icon={<Sigma className="h-5 w-5" />}
          title="Sizing and risk"
          body="Institutional-grade position sizing, correlation, VaR, and Monte Carlo drawdown."
        />
        <FeatureCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Accuracy first"
          body="Every figure is validated and tested against a reference. This drives real decisions."
        />
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand">
        {icon}
      </span>
      <h2 className="mt-4 font-display text-base font-semibold">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
