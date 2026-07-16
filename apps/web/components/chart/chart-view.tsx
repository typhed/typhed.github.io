"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import type {
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@typhed/chart-engine";

import { chartColors } from "@/lib/chart-theme";

interface ChartHandles {
  chart: IChartApi;
  candles: ISeriesApi<"Candlestick">;
  volume: ISeriesApi<"Histogram"> | null;
}

export function ChartView({
  candles,
  hasVolume,
}: {
  candles: readonly Candle[];
  hasVolume: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const handlesRef = React.useRef<ChartHandles | null>(null);

  const candlesRef = React.useRef(candles);
  candlesRef.current = candles;

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const isDarkRef = React.useRef(isDark);
  isDarkRef.current = isDark;

  // Push the current candle set into whichever series exist.
  const applyData = React.useCallback(() => {
    const handles = handlesRef.current;
    if (!handles) return;

    const colors = chartColors(isDarkRef.current);
    const data = candlesRef.current;

    handles.candles.setData(
      data.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    if (handles.volume) {
      handles.volume.setData(
        data.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume ?? 0,
          color: c.close >= c.open ? colors.upFill : colors.downFill,
        })),
      );
    }
  }, []);

  // Create the chart once (recreated only when volume presence flips, since
  // that changes the pane layout). lightweight-charts is imported here so the
  // canvas library never loads during static prerender.
  React.useEffect(() => {
    let disposed = false;

    void (async () => {
      const lwc = await import("lightweight-charts");
      if (disposed || !containerRef.current) return;

      const colors = chartColors(isDarkRef.current);
      const chart = lwc.createChart(containerRef.current, {
        autoSize: true,
        layout: {
          background: { color: colors.background },
          textColor: colors.textColor,
          fontFamily: "inherit",
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: colors.grid },
          horzLines: { color: colors.grid },
        },
        rightPriceScale: { borderColor: colors.border },
        timeScale: {
          borderColor: colors.border,
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: { mode: lwc.CrosshairMode.Normal },
      });

      const candleSeries = chart.addSeries(lwc.CandlestickSeries, {
        upColor: colors.up,
        downColor: colors.down,
        borderUpColor: colors.up,
        borderDownColor: colors.down,
        wickUpColor: colors.up,
        wickDownColor: colors.down,
      });

      let volumeSeries: ISeriesApi<"Histogram"> | null = null;
      if (hasVolume) {
        volumeSeries = chart.addSeries(
          lwc.HistogramSeries,
          { priceFormat: { type: "volume" }, priceScaleId: "" },
          1,
        );
        chart.panes()[0]?.setStretchFactor(3);
        chart.panes()[1]?.setStretchFactor(1);
      }

      handlesRef.current = {
        chart,
        candles: candleSeries,
        volume: volumeSeries,
      };
      applyData();
      chart.timeScale().fitContent();
    })();

    return () => {
      disposed = true;
      handlesRef.current?.chart.remove();
      handlesRef.current = null;
    };
  }, [hasVolume, applyData]);

  // Re-feed data when the candle set changes (timeframe switch, new upload).
  React.useEffect(() => {
    applyData();
    handlesRef.current?.chart.timeScale().fitContent();
  }, [candles, applyData]);

  // Re-theme without rebuilding the chart.
  React.useEffect(() => {
    const handles = handlesRef.current;
    if (!handles) return;

    const colors = chartColors(isDark);
    handles.chart.applyOptions({
      layout: {
        background: { color: colors.background },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border },
    });
    handles.candles.applyOptions({
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
    });
    applyData();
  }, [isDark, applyData]);

  return <div ref={containerRef} className="h-full w-full" />;
}
