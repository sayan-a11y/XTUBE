import { registerRealtimeClient, unregisterRealtimeClient } from '@/lib/realtime'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected message
      try {
        controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))
      } catch (err) {
        console.error('Failed to enqueue initial connect message:', err)
        return
      }

      // Register the client to receive broadcasts
      const clientId = registerRealtimeClient((event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          )
        } catch (err) {
          console.log(`Real-time client ${clientId} disconnected, unregistering...`)
          unregisterRealtimeClient(clientId)
        }
      })

      // Keep-alive heartbeat interval to prevent timeouts
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch (err) {
          clearInterval(heartbeatInterval)
          unregisterRealtimeClient(clientId)
        }
      }, 15000)

      // Handle request abortion
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        unregisterRealtimeClient(clientId)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx/Cloudflare
    },
  })
}
