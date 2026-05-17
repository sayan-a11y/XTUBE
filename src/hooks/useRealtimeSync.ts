import { useEffect, useRef } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function useRealtimeSync(onEvent?: (type: string, data: any) => void) {
  const onEventRef = useRef(onEvent)

  // Keep the latest callback updated in ref
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Establish Local Server-Sent Events (SSE) stream connection
    const eventSource = new EventSource('/api/realtime')

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload && payload.type && payload.type !== 'connected') {
          // Dispatch a unified browser custom event
          const customEvent = new CustomEvent('realtime-sync', {
            detail: { type: payload.type, data: payload.data },
          })
          window.dispatchEvent(customEvent)

          if (onEventRef.current) {
            onEventRef.current(payload.type, payload.data)
          }
        }
      } catch (err) {
        // Heartbeats and non-JSON comments are ignored
      }
    }

    eventSource.onerror = () => {
      // Browser EventSource automatically reconnects on error
    }

    // 2. Establish native Supabase Real-time connection if keys are set
    let channel: any = null
    if (isSupabaseConfigured() && supabase) {
      try {
        channel = supabase
          .channel('schema-db-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public' },
            (payload) => {
              const eventType = payload.eventType.toLowerCase()
              const tableName = payload.table
              const type = `${tableName}:${eventType}`
              const data = eventType === 'delete' ? payload.old : payload.new

              const customEvent = new CustomEvent('realtime-sync', {
                detail: { type, data },
              })
              window.dispatchEvent(customEvent)

              if (onEventRef.current) {
                onEventRef.current(type, data)
              }
            }
          )
          .subscribe()
      } catch (err) {
        console.error('Failed to subscribe to Supabase real-time channel:', err)
      }
    }

    return () => {
      eventSource.close()
      if (channel) {
        try {
          supabase?.removeChannel(channel)
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }, [])
}
