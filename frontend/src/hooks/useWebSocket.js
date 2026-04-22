import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'

export default function useWebSocket(url = 'ws://localhost:8000/ws/replay') {
  const setMarketData = useStore((state) => state.setMarketData)
  const addCandles = useStore((state) => state.addCandles)
  const ws = useRef(null)

  useEffect(() => {
    let reconnectTimeout

    const connect = () => {
      setMarketData({ wsStatus: 'connecting' })
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        setMarketData({ wsStatus: 'connected' })
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'SNAPSHOT') {
            addCandles(data.candles)
          } else if (data.type === 'CANDLE') {
            addCandles(data)
          }
        } catch (error) {
          console.error("WebSocket message parsing error:", error)
        }
      }

      ws.current.onclose = () => {
        setMarketData({ wsStatus: 'disconnected' })
        reconnectTimeout = setTimeout(connect, 3000) // Reconnect after 3s
      }

      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err)
        ws.current.close()
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [url, setMarketData, addCandles])

  const sendCommand = (cmd) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(cmd))
    }
  }

  return { sendCommand }
}
