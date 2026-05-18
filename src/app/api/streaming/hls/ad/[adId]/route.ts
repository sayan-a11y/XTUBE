import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import {
  generateMasterManifest,
  type QualityName,
} from '@/lib/streaming/hls-engine'

// GET /api/streaming/hls/ad/[adId]
// Serves HLS streaming manifest and segment redirects for premium ads.
//   ?type=master                       → Master .m3u8 manifest (480p to 4K)
//   ?type=playlist&quality=1080p       → Quality-specific media playlist
//   ?type=segment&quality=1080p&index=0 → Redirect to raw segment data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const { adId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'master'
    const quality = (searchParams.get('quality') || '1080p') as QualityName

    // 1. Resolve ad from database (checks HeroAd, FooterAd, and Ad models)
    let mediaUrl = ''
    let mediaFormat = 'mp4'

    const heroAd = await db.heroAd.findUnique({ where: { id: adId } })
    if (heroAd) {
      mediaUrl = heroAd.mediaUrl
      mediaFormat = heroAd.mediaFormat
    } else {
      const footerAd = await db.footerAd.findUnique({ where: { id: adId } })
      if (footerAd) {
        mediaUrl = footerAd.mediaUrl
        mediaFormat = footerAd.mediaFormat
      } else {
        const ad = await db.ad.findUnique({ where: { id: adId } })
        if (ad) {
          mediaUrl = ad.mediaUrl || ''
          mediaFormat = ad.mediaFormat || 'mp4'
        }
      }
    }

    if (!mediaUrl) {
      return NextResponse.json(
        { error: 'Ad asset not found', code: 'AD_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Default ad duration (30 seconds) — updated natively by the video player once loaded
    const duration = 30.0

    // ─── 2. Serve Master Manifest ──────────────────────────────────────────
    if (type === 'master') {
      const qualities: QualityName[] = ['480p', '720p', '1080p', '2K', '4K']
      const manifest = generateMasterManifest(qualities)

      return new NextResponse(manifest, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache master manifest heavily
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // ─── 3. Serve Media Playlist (Single-segment progressive HLS representation) ──
    if (type === 'playlist') {
      const qualities: QualityName[] = ['480p', '720p', '1080p', '2K', '4K']
      const validQuality = qualities.includes(quality) ? quality : '1080p'

      const playlistLines = [
        '#EXTM3U',
        '#EXT-X-VERSION:6',
        `#EXT-X-TARGETDURATION:${Math.max(Math.ceil(duration), 1)}`,
        '#EXT-X-MEDIA-SEQUENCE:0',
        '#EXT-X-PLAYLIST-TYPE:VOD',
        `#EXTINF:${duration.toFixed(3)},`,
        `segment?quality=${validQuality}&index=0`,
        '#EXT-X-ENDLIST',
      ]

      return new NextResponse(playlistLines.join('\n') + '\n', {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache playlist long-term
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // ─── 4. Serve Segment Proxy / Redirect ────────────────────────────────
    if (type === 'segment') {
      const index = parseInt(searchParams.get('index') || '0', 10)

      if (index === 0) {
        // Redirect to CDN-hosted video asset. The browser will handle caching.
        // HLS.js uses standard HTTP range requests on this target if supported.
        return NextResponse.redirect(mediaUrl, {
          status: 307,
          headers: {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }

      return NextResponse.json(
        { error: 'Segment index out of range for ad', code: 'SEGMENT_UNAVAILABLE' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid type parameter. Use: master, playlist, or segment', code: 'INVALID_TYPE' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[HLS Ad API Error]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
