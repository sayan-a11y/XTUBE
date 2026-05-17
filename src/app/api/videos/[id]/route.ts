import { db } from '@/lib/db'
import { broadcastRealtimeEvent } from '@/lib/realtime'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const video = await db.video.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Increment views in background
    db.video.update({
      where: { id },
      data: { views: { increment: 1 } },
    }).catch((err) => console.error('Failed to increment video views:', err))

    // Record analytics in background
    db.analytics.create({
      data: {
        device: 'desktop',
        views: 1,
        watchTime: 0,
      },
    }).catch((err) => console.error('Failed to create analytics:', err))

    return NextResponse.json({ video: { ...video, views: video.views + 1 } })
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const video = await db.video.update({
      where: { id },
      data: body,
    })

    // Broadcast the update in real-time
    broadcastRealtimeEvent('video:updated', video)

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.video.delete({ where: { id } })

    // Broadcast the deletion in real-time
    broadcastRealtimeEvent('video:deleted', { id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}

