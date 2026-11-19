"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import type { IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts"
import type { Candle } from "@typhed/chart-engine"

import { chartColors } from "@/lib/chart-theme"
import { INDICATOR_COLORS, type ChartIndicators } from "@/lib/indicators"

interface Handles {
  chart: IChartApi
  candles: ISeriesApi<"Candlestick">
  volume: ISeriesApi<"Histogram"> | null
  overlays: Map<string, ISeriesApi<"Line">>
  rsi: ISeriesApi<"Line"> | null
  macdHist: ISeriesApi<"Histogram"> | null
  macdLine: ISeriesApi<"Line"> | null
  macdSignal: ISeriesApi<"Line"> | null
}

interface ChartProps {
  candles: readonly Candle[]
  hasVolume: boolean
  indicators: ChartIndicators
}

const t = (time: number) => time as UTCTimestamp

export function ChartView({ candles, hasVolume, indicators }: ChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const handlesRef = React.useRef<Handles | null>(null)

  const propsRef = React.useRef<ChartProps>({ candles, hasVolume, indicators })

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== "light"
  const isDarkRef = React.useRef(isDark)

  // The effects and callbacks below read the latest props and theme through
  // these refs, so they need not re-run on every change. A layout effect keeps
  // the refs current after each render, before any of those effects runs.
  React.useLayoutEffect(() => {
    propsRef.current = { candles, hasVolume, indicators }
    isDarkRef.current = isDark
  })

  // The pane composition. Changing it rebuilds the chart; changing only data
  // does not. Overlay ids are stable across timeframes, so a timeframe switch
  // updates data in place.
  const layoutKey = React.useMemo(() => {
    const overlayIds = indicators.overlays.map((o) => o.id).join(",")
    return `${hasVolume}|${overlayIds}|${indicators.rsi ? 1 : 0}|${indicators.macd ? 1 : 0}`
  }, [hasVolume, indicators])

  const applyData = React.useCallback(() => {
    const handles = handlesRef.current
    if (!handles) return
    const colors = chartColors(isDarkRef.current)
    const { candles: data, indicators: ind } = propsRef.current

    handles.candles.setData(
      data.map((c) => ({
        time: t(c.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    )

    if (handles.volume) {
      handles.volume.setData(
        data.map((c) => ({
          time: t(c.time),
          value: c.volume ?? 0,
          color: c.close >= c.open ? colors.upFill : colors.downFill,
        })),
      )
    }

    for (const overlay of ind.overlays) {
      handles.overlays
        .get(overlay.id)
        ?.setData(overlay.data.map((p) => ({ time: t(p.time), value: p.value })))
    }

    if (handles.rsi && ind.rsi) {
      handles.rsi.setData(ind.rsi.map((p) => ({ time: t(p.time), value: p.value })))
    }

    if (ind.macd) {
      handles.macdHist?.setData(
        ind.macd.map((p) => ({
          time: t(p.time),
          value: p.histogram,
          color: p.histogram >= 0 ? colors.upFill : colors.downFill,
        })),
      )
      handles.macdLine?.setData(ind.macd.map((p) => ({ time: t(p.time), value: p.macd })))
      handles.macdSignal?.setData(ind.macd.map((p) => ({ time: t(p.time), value: p.signal })))
    }
  }, [])

  // Build the chart and all series for the current pane composition.
  React.useEffect(() => {
    let disposed = false

    void (async () => {
      const lwc = await import("lightweight-charts")
      if (disposed || !containerRef.current) return

      const { hasVolume: hv, indicators: ind } = propsRef.current
      const colors = chartColors(isDarkRef.current)

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
      })

      const candleSeries = chart.addSeries(lwc.CandlestickSeries, {
        upColor: colors.up,
        downColor: colors.down,
        borderUpColor: colors.up,
        borderDownColor: colors.down,
        wickUpColor: colors.up,
        wickDownColor: colors.down,
      })

      const overlays = new Map<string, ISeriesApi<"Line">>()
      for (const overlay of ind.overlays) {
        overlays.set(
          overlay.id,
          chart.addSeries(
            lwc.LineSeries,
            {
              color: overlay.color,
              lineWidth: 2,
              lineStyle: overlay.dashed ? lwc.LineStyle.Dashed : lwc.LineStyle.Solid,
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            },
            0,
          ),
        )
      }

      let paneCursor = 1

      let volumeSeries: ISeriesApi<"Histogram"> | null = null
      if (hv) {
        volumeSeries = chart.addSeries(
          lwc.HistogramSeries,
          { priceFormat: { type: "volume" }, priceScaleId: "" },
          paneCursor,
        )
        paneCursor += 1
      }

      let rsiSeries: ISeriesApi<"Line"> | null = null
      if (ind.rsi) {
        rsiSeries = chart.addSeries(
          lwc.LineSeries,
          { color: INDICATOR_COLORS.rsi, lineWidth: 2, priceLineVisible: false },
          paneCursor,
        )
        for (const level of [30, 50, 70]) {
          rsiSeries.createPriceLine({
            price: level,
            color: colors.border,
            lineWidth: 1,
            lineStyle: lwc.LineStyle.Dashed,
            axisLabelVisible: true,
            title: String(level),
          })
        }
        paneCursor += 1
      }

      let macdHist: ISeriesApi<"Histogram"> | null = null
      let macdLine: ISeriesApi<"Line"> | null = null
      let macdSignal: ISeriesApi<"Line"> | null = null
      if (ind.macd) {
        macdHist = chart.addSeries(lwc.HistogramSeries, { priceLineVisible: false }, paneCursor)
        macdLine = chart.addSeries(
          lwc.LineSeries,
          {
            color: INDICATOR_COLORS.macd,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          },
          paneCursor,
        )
        macdSignal = chart.addSeries(
          lwc.LineSeries,
          {
            color: INDICATOR_COLORS.macdSignal,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          },
          paneCursor,
        )
        paneCursor += 1
      }

      const panes = chart.panes()
      panes[0]?.setStretchFactor(3)
      for (let i = 1; i < panes.length; i += 1) panes[i]?.setStretchFactor(1)

      handlesRef.current = {
        chart,
        candles: candleSeries,
        volume: volumeSeries,
        overlays,
        rsi: rsiSeries,
        macdHist,
        macdLine,
        macdSignal,
      }
      applyData()
      chart.timeScale().fitContent()
    })()

    return () => {
      disposed = true
      handlesRef.current?.chart.remove()
      handlesRef.current = null
    }
  }, [layoutKey, applyData])

  // Feed data when candles or indicator values change (same pane layout).
  React.useEffect(() => {
    applyData()
    handlesRef.current?.chart.timeScale().fitContent()
  }, [candles, indicators, applyData])

  // Re-theme without rebuilding.
  React.useEffect(() => {
    const handles = handlesRef.current
    if (!handles) return
    const colors = chartColors(isDark)
    handles.chart.applyOptions({
      layout: { background: { color: colors.background }, textColor: colors.textColor },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border },
    })
    handles.candles.applyOptions({
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
    })
    applyData()
  }, [isDark, applyData])

  return <div ref={containerRef} className="h-full w-full" />
}
