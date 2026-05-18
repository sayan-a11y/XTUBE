import { useEffect, useRef } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface RealtimeSyncEvent {
  type: string
  data: any
}

// Global singletons to prevent socket connection multiplication and HTTP thread exhaustion
let globalEventSource: EventSource | null = null
let globalSupabaseChannel: any = null
let activeListenersCount = 0

function initGlobalRealtimeSync() {
  if (typeof window === 'undefined') return

  if (!globalEventSource) {
    globalEventSource = new EventSource('/api/realtime')
    globalEventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload && payload.type && payload.type !== 'connected') {
          const customEvent = new CustomEvent('realtime-sync', {
            detail: { type: payload.type, data: payload.data },
          })
          window.dispatchEvent(customEvent)
        }
      } catch (err) {
        // Heartbeats and non-JSON comments are ignored
      }
    }
    globalEventSource.onerror = () => {
      // Browser EventSource automatically reconnects on error
    }
  }

  if (isSupabaseConfigured() && supabase && !globalSupabaseChannel) {
    try {
      globalSupabaseChannel = supabase
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
          }
        )
        .subscribe()
    } catch (err) {
      console.error('Failed to subscribe to Supabase real-time channel:', err)
    }
  }
}

function cleanupGlobalRealtimeSync() {
  if (activeListenersCount <= 0) {
    if (globalEventSource) {
      globalEventSource.close()
      globalEventSource = null
    }
    if (globalSupabaseChannel) {
      try {
        supabase?.removeChannel(globalSupabaseChannel)
      } catch {
        // Ignore cleanup errors
      }
      globalSupabaseChannel = null
    }
  }
}

export function useRealtimeSync(onEvent?: (type: string, data: any) => void) {
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Increment active listener counter and initialize connection singleton
    activeListenersCount++
    initGlobalRealtimeSync()

    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent<RealtimeSyncEvent>
      if (onEventRef.current) {
        onEventRef.current(customEvent.detail.type, customEvent.detail.data)
      }
    }

    window.addEventListener('realtime-sync', handleSyncEvent)

    return () => {
      window.removeEventListener('realtime-sync', handleSyncEvent)
      activeListenersCount--
      
      // Cleanup connections if zero listeners remain
      cleanupGlobalRealtimeSync()
    }
  }, [])
}
