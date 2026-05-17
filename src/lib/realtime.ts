import { randomUUID } from 'crypto'

export interface RealtimeEvent {
  type: string
  data: any
  timestamp: string
}

type ClientCallback = (event: RealtimeEvent) => void

// Keep a global registry of active realtime clients on globalThis to survive HMR in dev mode
const globalClients = globalThis as unknown as {
  realtimeClients: Map<string, ClientCallback> | undefined
}

if (!globalClients.realtimeClients) {
  globalClients.realtimeClients = new Map<string, ClientCallback>()
}

const clients = globalClients.realtimeClients

/**
 * Register a client response handler for real-time broadcasts
 */
export function registerRealtimeClient(onEvent: ClientCallback): string {
  const id = randomUUID()
  clients.set(id, onEvent)
  return id
}

/**
 * Unregister a client response handler
 */
export function unregisterRealtimeClient(id: string): void {
  clients.delete(id)
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcastRealtimeEvent(type: string, data: any): void {
  const event: RealtimeEvent = {
    type,
    data,
    timestamp: new Date().toISOString(),
  }

  // Broadcast to all local SSE clients
  clients.forEach((callback, id) => {
    try {
      callback(event)
    } catch (err) {
      // Remove stale client
      clients.delete(id)
    }
  })
}
