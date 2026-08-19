import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 3000

export default function useWebSocket(url = 'ws://localhost:8000/ws/replay') {
  const setMarketData = useStore((state) => state.setMarketData)
  const setCandles    = useStore((state) => state.setCandles)
  const addCandles    = useStore((state) => state.addCandles)

  // Keep action refs stable so the effect only runs once
  const actionsRef = useRef({ setMarketData, setCandles, addCandles })
  actionsRef.current = { setMarketData, setCandles, addCandles }

  const ws            = useRef(null)
  const retryCount    = useRef(0)
  const reconnTimeout = useRef(null)
  const unmounted     = useRef(false)

  useEffect(() => {
    unmounted.current = false

    const connect = () => {
      if (unmounted.current) return

      actionsRef.current.setMarketData({ wsStatus: 'connecting' })
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        retryCount.current = 0
        actionsRef.current.setMarketData({ wsStatus: 'connected' })
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'SNAPSHOT') {
            // Full replace — prevents duplicate timestamps on reconnect
            actionsRef.current.setCandles(data.candles)
          } else if (data.type === 'CANDLE') {
            actionsRef.current.addCandles(data)
          }
        } catch (err) {
          console.error('WebSocket parse error:', err)
        }
      }

      ws.current.onclose = () => {
        actionsRef.current.setMarketData({ wsStatus: 'disconnected' })
        if (unmounted.current) return

        if (retryCount.current >= MAX_RETRIES) {
          console.warn(`WebSocket: max retries (${MAX_RETRIES}) reached. Backend may be offline.`)
          return
        }

        // Exponential backoff: 3s, 6s, 12s, 24s, 30s (capped)
        const delay = Math.min(BASE_DELAY_MS * 2 ** retryCount.current, 30000)
        retryCount.current += 1
        console.info(`WebSocket: reconnecting in ${delay / 1000}s (attempt ${retryCount.current}/${MAX_RETRIES})`)
        reconnTimeout.current = setTimeout(connect, delay)
      }

      ws.current.onerror = () => {
        // onerror always fires before onclose — just close cleanly, onclose handles retry
        ws.current?.close()
      }
    }

    connect()

    return () => {
      unmounted.current = true
      clearTimeout(reconnTimeout.current)
      ws.current?.close()
    }
  }, [url]) // stable — action refs handle the rest

  const sendCommand = useCallback((cmd) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(cmd))
    }
  }, [])

  return { sendCommand }
}
