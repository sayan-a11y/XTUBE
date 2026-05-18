import { db } from '@/lib/db'
import { broadcastRealtimeEvent } from '@/lib/realtime'
import { deleteObject, getSignedUrl, getProvider } from '@/lib/storage/r2-client'
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

    // Sign URLs if needed
    let playUrl = video.videoUrl
    let thumbUrl = video.thumbnail
    const provider = getProvider()
    const publicUrl = process.env.R2_PUBLIC_URL || ''

    if (provider === 'r2') {
      if (playUrl && playUrl.startsWith(publicUrl)) {
        const key = playUrl.replace(publicUrl, '').replace(/^\//, '')
        const signed = await getSignedUrl(key, 3600)
        playUrl = signed.url
      }
      if (thumbUrl && thumbUrl.startsWith(publicUrl)) {
        const key = thumbUrl.replace(publicUrl, '').replace(/^\//, '')
        const signed = await getSignedUrl(key, 3600)
        thumbUrl = signed.url
      }
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

    return NextResponse.json({ video: { ...video, videoUrl: playUrl, thumbnail: thumbUrl, views: video.views + 1 } })
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

    // 1. Fetch the video details first to obtain URLs
    const video = await db.video.findUnique({
      where: { id },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // 2. Delete related records to satisfy Foreign Key constraints
    await db.$transaction([
      db.comment.deleteMany({ where: { videoId: id } }),
      db.bookmark.deleteMany({ where: { videoId: id } }),
      db.history.deleteMany({ where: { videoId: id } }),
      db.watchProgress.deleteMany({ where: { videoId: id } }),
      db.videoAd.deleteMany({ where: { videoId: id } }),
      db.video.delete({ where: { id } }),
    ])

    // 3. Delete files from Cloudflare R2 / Local Storage automatically
    const publicUrl = process.env.R2_PUBLIC_URL || ''

    if (video.videoUrl) {
      let videoKey = ''
      if (video.videoUrl.startsWith(publicUrl)) {
        videoKey = video.videoUrl.replace(publicUrl, '').replace(/^\//, '')
      } else if (video.videoUrl.startsWith('/')) {
        videoKey = video.videoUrl.replace(/^\//, '')
      }

      if (videoKey) {
        console.log(`[Storage Cleanup] Deleting video object: ${videoKey}`)
        await deleteObject(videoKey).catch((err) =>
          console.error(`[Storage Cleanup Error] Failed to delete video file ${videoKey}:`, err)
        )
      }
    }

    if (video.thumbnailUrl) {
      let thumbnailKey = ''
      if (video.thumbnailUrl.startsWith(publicUrl)) {
        thumbnailKey = video.thumbnailUrl.replace(publicUrl, '').replace(/^\//, '')
      } else if (video.thumbnailUrl.startsWith('/')) {
        thumbnailKey = video.thumbnailUrl.replace(/^\//, '')
      }

      if (thumbnailKey) {
        console.log(`[Storage Cleanup] Deleting thumbnail object: ${thumbnailKey}`)
        await deleteObject(thumbnailKey).catch((err) =>
          console.error(`[Storage Cleanup Error] Failed to delete thumbnail file ${thumbnailKey}:`, err)
        )
      }
    }

    // Broadcast the deletion in real-time
    broadcastRealtimeEvent('video:deleted', { id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}

