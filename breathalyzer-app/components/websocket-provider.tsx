"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type WebSocketContextType = {
  isConnected: boolean
  sendMessage: (message: string) => void
  lastMessage: any | null
  connect: () => void
  disconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  sendMessage: () => {},
  lastMessage: null,
  connect: () => {},
  disconnect: () => {},
})

export const useWebSocket = () => useContext(WebSocketContext)

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (socket?.readyState === WebSocket.OPEN) return

    try {
      // In a real app, replace with your actual WebSocket server URL
      const ws = new WebSocket("ws://localhost:8080")

      ws.onopen = () => {
        console.log("WebSocket connected")
        setIsConnected(true)
        setReconnectAttempts(0)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected")
        setIsConnected(false)

        // Auto-reconnect logic
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1)
            connect()
          }, 2000 * Math.pow(2, reconnectAttempts)) // Exponential backoff
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        ws.close()
      }

      setSocket(ws)
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error)
    }
  }

  const disconnect = () => {
    if (socket) {
      socket.close()
      setSocket(null)
      setIsConnected(false)
    }
  }

  const sendMessage = (message: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(message)
    } else {
      console.error("WebSocket is not connected")
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [socket])

  // For demo purposes, we'll simulate connection
  useEffect(() => {
    // In a real app, you might want to connect automatically or based on user action
    // connect()
  }, [])

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, lastMessage, connect, disconnect }}>
      {children}
    </WebSocketContext.Provider>
  )
}
