import { useEffect, useRef } from 'react'
import {
  createChart,
  CandlestickSeries,
  AreaSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  LineStyle,
  CrosshairMode
} from 'lightweight-charts'

export default function TradingViewChart({
  candles = [],
  chartType = 'candles',
  showEma = true,
  openPosition = null,
  latestTick = null,
  symbol = 'STOCK',
  timeframe = '1D'
}) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const mainSeriesRef = useRef(null)
  const ema20SeriesRef = useRef(null)
  const ema50SeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const entryLineRef = useRef(null)
  const slLineRef = useRef(null)
  const tpLineRef = useRef(null)

  // 1. Initialize Chart Instance on container mount or chartType change
  useEffect(() => {
    if (!chartContainerRef.current) return

    const container = chartContainerRef.current
    container.innerHTML = ''

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#09090B' },
        textColor: '#9CA3AF',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: '#18181B', style: LineStyle.Dotted },
        horzLines: { color: '#18181B', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#6B7280', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1F2937' },
        horzLine: { color: '#6B7280', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1F2937' },
      },
      rightPriceScale: {
        borderColor: '#27272A',
        scaleMargins: { top: 0.08, bottom: 0.2 },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#27272A',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      width: container.clientWidth || 720,
      height: 380,
    })

    chartRef.current = chart

    // Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    volumeSeriesRef.current = volumeSeries

    // Main Candlestick / Area Series
    let mainSeries
    if (chartType === 'line') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(34, 197, 94, 0.28)',
        bottomColor: 'rgba(34, 197, 94, 0.01)',
        lineColor: '#22C55E',
        lineWidth: 2,
      })
    } else {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22C55E',
        downColor: '#EF4444',
        borderUpColor: '#22C55E',
        borderDownColor: '#EF4444',
        wickUpColor: '#22C55E',
        wickDownColor: '#EF4444',
      })
    }
    mainSeriesRef.current = mainSeries

    // EMAs
    if (showEma) {
      const ema20 = chart.addSeries(LineSeries, {
        color: '#22D3EE',
        lineWidth: 1.5,
        title: '20 EMA',
        priceLineVisible: false,
      })
      const ema50 = chart.addSeries(LineSeries, {
        color: '#F59E0B',
        lineWidth: 1.5,
        title: '50 EMA',
        priceLineVisible: false,
      })
      ema20SeriesRef.current = ema20
      ema50SeriesRef.current = ema50
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [chartType, showEma])

  // 2. Set Bulk Candle Data (Only on Symbol / Timeframe change)
  useEffect(() => {
    if (!candles || candles.length === 0 || !mainSeriesRef.current) return

    const baseTimestamp = 1704067200
    const stepSeconds = 900

    const formattedCandles = candles.map((c, i) => {
      const o = parseFloat(c.open)
      const h = parseFloat(c.high)
      const l = parseFloat(c.low)
      const cl = parseFloat(c.close)
      return {
        time: baseTimestamp + i * stepSeconds,
        open: o,
        high: Math.max(o, cl, h),
        low: Math.min(o, cl, l),
        close: cl,
        value: cl,
      }
    })

    const formattedVolume = candles.map((c, i) => ({
      time: baseTimestamp + i * stepSeconds,
      value: c.volume || 25000,
      color: c.close >= c.open ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)',
    }))

    try {
      mainSeriesRef.current.setData(formattedCandles)

      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(formattedVolume)
      }

      if (ema20SeriesRef.current) {
        const k20 = 2 / (20 + 1)
        let emaVal = formattedCandles[0]?.close || 0
        const ema20Data = formattedCandles.map((c) => {
          emaVal = c.close * k20 + emaVal * (1 - k20)
          return { time: c.time, value: parseFloat(emaVal.toFixed(2)) }
        })
        ema20SeriesRef.current.setData(ema20Data)
      }

      if (ema50SeriesRef.current) {
        const k50 = 2 / (50 + 1)
        let emaVal50 = formattedCandles[0]?.close || 0
        const ema50Data = formattedCandles.map((c) => {
          emaVal50 = c.close * k50 + emaVal50 * (1 - k50)
          return { time: c.time, value: parseFloat(emaVal50.toFixed(2)) }
        })
        ema50SeriesRef.current.setData(ema50Data)
      }

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    } catch (e) {
      console.error('Error setting chart data:', e)
    }
  }, [symbol, timeframe, chartType])

  // 3. Live Micro-Tick Update
  useEffect(() => {
    if (!latestTick || !mainSeriesRef.current || candles.length === 0) return

    const baseTimestamp = 1704067200
    const stepSeconds = 900
    const lastIndex = candles.length - 1
    const lastTimestamp = baseTimestamp + lastIndex * stepSeconds

    const o = parseFloat(latestTick.open)
    const cl = parseFloat(latestTick.close)
    const h = Math.max(o, cl, parseFloat(latestTick.high))
    const l = Math.min(o, cl, parseFloat(latestTick.low))

    try {
      mainSeriesRef.current.update({
        time: lastTimestamp,
        open: o,
        high: h,
        low: l,
        close: cl,
        value: cl,
      })

      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.update({
          time: lastTimestamp,
          value: latestTick.volume || 30000,
          color: cl >= o ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)',
        })
      }
    } catch (e) {
      console.error('Error updating live tick:', e)
    }
  }, [latestTick])

  // 4. Order Lines
  useEffect(() => {
    if (!mainSeriesRef.current) return

    if (entryLineRef.current) {
      mainSeriesRef.current.removePriceLine(entryLineRef.current)
      entryLineRef.current = null
    }
    if (slLineRef.current) {
      mainSeriesRef.current.removePriceLine(slLineRef.current)
      slLineRef.current = null
    }
    if (tpLineRef.current) {
      mainSeriesRef.current.removePriceLine(tpLineRef.current)
      tpLineRef.current = null
    }

    if (openPosition) {
      entryLineRef.current = mainSeriesRef.current.createPriceLine({
        price: openPosition.entryPrice,
        color: '#FFFFFF',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `ENTRY (${openPosition.direction})`,
      })

      if (openPosition.stopLoss) {
        slLineRef.current = mainSeriesRef.current.createPriceLine({
          price: openPosition.stopLoss,
          color: '#EF4444',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'STOP-LOSS',
        })
      }

      if (openPosition.target) {
        tpLineRef.current = mainSeriesRef.current.createPriceLine({
          price: openPosition.target,
          color: '#22C55E',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'TARGET',
        })
      }
    }
  }, [openPosition])

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border/80 bg-[#09090B] shadow-2xl">
      <div ref={chartContainerRef} className="w-full" style={{ minHeight: '380px' }} />
    </div>
  )
}
