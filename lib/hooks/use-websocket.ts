import { useEffect, useRef, useState, useCallback } from 'react'

interface RealtimeMessage {
  type: string
  data: any
  timestamp: string
}

interface UseRealtimeOptions {
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
}

export function useRealtime(url?: string, options: UseRealtimeOptions = {}) {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectCountRef = useRef(0)
  const listenersRef = useRef<Map<string, (data: any) => void>>(new Map())

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return

    try {
      const sseUrl = url || (typeof window !== 'undefined' 
        ? `${window.location.origin}/api/realtime/events`
        : 'http://localhost:3002/api/realtime/events')
      
      eventSourceRef.current = new EventSource(sseUrl)

      eventSourceRef.current.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectCountRef.current = 0
        console.log('🚀 Realtime connected')
      }

      // EventSource doesn't have onclose, handle reconnection in onerror
      // Auto-reconnect will be handled in the onerror event

      eventSourceRef.current.onerror = (err) => {
        setError('Realtime connection error')
        setIsConnected(false)
        console.error('📡 Realtime error:', err)
        
        // Auto-reconnect logic
        if (reconnectCountRef.current < reconnectAttempts) {
          setTimeout(() => {
            reconnectCountRef.current++
            disconnect() // Clean up current connection
            connect() // Try to reconnect
          }, reconnectDelay * Math.pow(2, reconnectCountRef.current))
        }
      }

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const message: RealtimeMessage = {
            type: data.type || 'message',
            data: data.data || data,
            timestamp: new Date().toISOString()
          }
          setLastMessage(message)
          
          const listener = listenersRef.current.get(message.type)
          if (listener) listener(message.data)
        } catch (err) {
          console.error('Failed to parse realtime message:', err)
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setIsConnected(false)
    }
  }, [url, reconnectAttempts, reconnectDelay])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    listenersRef.current.set(eventType, callback)
    
    // Return unsubscribe function
    return () => {
      listenersRef.current.delete(eventType)
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    isConnected,
    error,
    lastMessage,
    connect,
    disconnect,
    subscribe
  }
}

// Specific hooks for different real-time features

export function useWorkflowUpdates() {
  const [workflowUpdates, setWorkflowUpdates] = useState<any[]>([])
  const { subscribe, isConnected } = useRealtime()

  useEffect(() => {
    const unsubscribeUpdate = subscribe('workflow:update', (data) => {
      setWorkflowUpdates(prev => [data, ...prev.slice(0, 49)]) // Keep last 50 updates
    })

    const unsubscribeProgress = subscribe('workflow:progress', (data) => {
      setWorkflowUpdates(prev => [{ ...data, type: 'progress' }, ...prev.slice(0, 49)])
    })

    const unsubscribeError = subscribe('workflow:error', (data) => {
      setWorkflowUpdates(prev => [{ ...data, type: 'error' }, ...prev.slice(0, 49)])
    })

    return () => {
      unsubscribeUpdate()
      unsubscribeProgress()
      unsubscribeError()
    }
  }, [subscribe])

  return { workflowUpdates, isConnected }
}

export function useAgentUpdates() {
  const [agentUpdates, setAgentUpdates] = useState<any[]>([])
  const { subscribe, isConnected } = useRealtime()

  useEffect(() => {
    const unsubscribe = subscribe('agent:update', (data) => {
      setAgentUpdates(prev => [data, ...prev.slice(0, 49)]) // Keep last 50 updates
    })

    return unsubscribe
  }, [subscribe])

  return { agentUpdates, isConnected }
}

export function useTaskUpdates() {
  const [taskUpdates, setTaskUpdates] = useState<any[]>([])
  const { subscribe, isConnected } = useRealtime()

  useEffect(() => {
    const unsubscribe = subscribe('task:update', (data) => {
      setTaskUpdates(prev => [data, ...prev.slice(0, 49)]) // Keep last 50 updates
    })

    return unsubscribe
  }, [subscribe])

  return { taskUpdates, isConnected }
}

// Keep the old export for backward compatibility
export const useWebSocket = useRealtime 