import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// ─── POST /api/thumbnails/generate ───────────────────────────────────────────
// Generates placeholder thumbnails for a video.
// Since we can't run ffmpeg in the sandbox, this creates placeholder entries
// in the database and updates the video's thumbnailUrls field.

interface ThumbnailGenerateRequest {
  videoId: string
  count?: number      // number of thumbnails to generate (default: 6)
  interval?: number   // interval in seconds between thumbnails (default: auto)
}

export async function POST(request: NextRequest) {
  try {
    const body: ThumbnailGenerateRequest = await request.json()
    const { videoId, count = 6, interval } = body

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required', code: 'MISSING_VIDEO_ID' },
        { status: 400 }
      )
    }

    // Fetch the video
    const video = await db.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        durationSeconds: true,
        thumbnailUrls: true,
        videoUrl: true,
        thumbnail: true,
      },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found', code: 'VIDEO_NOT_FOUND' },
        { status: 404 }
      )
    }

    const duration = video.durationSeconds || 300
    const effectiveCount = Math.min(count, 12) // cap at 12 thumbnails
    const effectiveInterval = interval || Math.floor(duration / (effectiveCount + 1))

    const premiumPlaceholderImages = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60', // Futuristic neon abstract
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=60', // Premium creative poster
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=60', // Cinema camera widescreen
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=60', // Red theatre seats cinema hall
      'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&auto=format&fit=crop&q=60', // Intense cosmic dramatic sky
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=60', // Esports gaming setup neon
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60', // Dark game aesthetic controller
      'https://images.unsplash.com/photo-1500627869374-13cd993b1115?w=400&auto=format&fit=crop&q=60', // Emerald green forest overhead
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&auto=format&fit=crop&q=60', // Misty high mountains alpine landscape
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=60', // Golden hour beach tropical sunset
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=60', // Cyber virtual earth abstract network
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=60', // Neon stage lights live concert
    ]

    // Generate placeholder thumbnail entries
    const thumbnails: {
      index: number
      timeSeconds: number
      url: string
      width: number
      height: number
    }[] = []

    for (let i = 0; i < effectiveCount; i++) {
      const timeSeconds = effectiveInterval * (i + 1)
      if (timeSeconds >= duration) break

      thumbnails.push({
        index: i,
        timeSeconds,
        // Curate a beautiful, non-broken, high-resolution simulated thumbnail frame
        url: premiumPlaceholderImages[i % premiumPlaceholderImages.length],
        width: 320,
        height: 180,
      })
    }

    // Also generate a WebVTT preview sprite sheet URL placeholder
    const previewUrl = `/api/streaming/hls/${videoId}?type=preview`

    // Update the video record with generated thumbnail URLs
    const thumbnailUrls = JSON.stringify(thumbnails)
    await db.video.update({
      where: { id: videoId },
      data: {
        thumbnailUrls,
        previewUrl,
        // Auto-assign the first gorgeous generated frame if it's currently a placeholder image
        ...(video.thumbnail === '/placeholder.jpg' && thumbnails.length > 0
          ? { thumbnail: thumbnails[0].url }
          : {}),
      },
    })

    return NextResponse.json({
      success: true,
      videoId,
      generated: thumbnails.length,
      thumbnails,
      previewUrl,
      message: thumbnails.length > 0
        ? 'Placeholder thumbnails generated. In production, ffmpeg would extract real frames.'
        : 'Video too short for thumbnail generation.',
    })
  } catch (error) {
    console.error('[Thumbnail Generate API Error]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
