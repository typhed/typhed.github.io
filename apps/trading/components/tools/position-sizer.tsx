"use client";

import * as React from "react";
import {
  atrPositionSize,
  fixedFractionalSize,
  type Direction,
} from "@typhed/risk-toolkit";

import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import { NumberField, Segmented, StatTile, ToolCard } from "@/components/tools/controls";

type Mode = "fixed" | "atr";

export function PositionSizer() {
  const [mode, setMode] = React.useState<Mode>("fixed");
  const [accountEquity, setAccountEquity] = React.useState(100000);
  const [riskPercent, setRiskPercent] = React.useState(1);
  const [entry, setEntry] = React.useState(100);
  const [stop, setStop] = React.useState(97);
  const [atr, setAtr] = React.useState(2);
  const [atrMultiple, setAtrMultiple] = React.useState(2);
  const [direction, setDirection] = React.useState<Direction>("long");

  const result = React.useMemo(() => {
    if (mode === "fixed") {
      return { ...fixedFractionalSize({ accountEquity, riskPercent, entry, stop }), stop };
    }
    return atrPositionSize({
      accountEquity,
      riskPercent,
      entry,
      atr,
      atrMultiple,
      direction,
    });
  }, [mode, accountEquity, riskPercent, entry, stop, atr, atrMultiple, direction]);

  return (
    <ToolCard
      title="Position sizer"
      description="How many units to trade so a stop-out costs a fixed slice of the account."
    >
      <div className="mb-5">
        <Segmented
          options={[
            { value: "fixed", label: "Fixed risk (entry / stop)" },
            { value: "atr", label: "Volatility (ATR)" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Account equity" value={accountEquity} onChange={setAccountEquity} min={0} />
        <NumberField label="Risk per trade" value={riskPercent} onChange={setRiskPercent} min={0} suffix="%" />
        <NumberField label="Entry price" value={entry} onChange={setEntry} min={0} />
        {mode === "fixed" ? (
          <NumberField label="Stop price" value={stop} onChange={setStop} min={0} />
        ) : (
          <>
            <NumberField label="ATR" value={atr} onChange={setAtr} min={0} />
            <NumberField label="ATR multiple (stop distance)" value={atrMultiple} onChange={setAtrMultiple} min={0} />
            <div className="sm:col-span-2">
              <Segmented
                options={[
                  { value: "long", label: "Long" },
                  { value: "short", label: "Short" },
                ]}
                value={direction}
                onChange={setDirection}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <StatTile label="Quantity" value={fmtNumber(result.quantity, 0)} tone="brand" />
        <StatTile label="Risk amount" value={fmtMoney(result.riskAmount)} />
        <StatTile label="Risk / unit" value={fmtMoney(result.riskPerUnit)} note={`Stop ${fmtMoney(result.stop)}`} />
        <StatTile
          label="Position value"
          value={fmtMoney(result.positionValue)}
          note={`${fmtPercent(result.positionPercent / 100)} of account`}
        />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Sizing arithmetic on your inputs, nothing more: it does not know your
        broker&apos;s margin rules, lot constraints, or liquidity. Verify
        every figure before you trade. Not investment advice.
      </p>
    </ToolCard>
  );
}
