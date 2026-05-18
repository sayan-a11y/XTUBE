'use client'

import { useCallback, useEffect, useRef, useState, memo } from 'react'
import Hls from 'hls.js'
import { Megaphone, Volume2, VolumeX } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FooterAdItem {
  id: string
  title: string
  mediaUrl: string
  thumbnailUrl?: string
  adType: 'image' | 'video' | 'gif' | 'html5'
  mediaFormat: string
  linkUrl?: string
}

interface FooterAdsProps {
  ads: FooterAdItem[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FooterAds({ ads }: FooterAdsProps) {
  const ad = ads?.[0] ?? null

  if (!ad) {
    return (
      <div className="w-full px-0 sm:px-6 lg:px-8 pb-4">
        <div
          className={`
            mx-auto max-w-[1600px]
            min-h-[100px] md:min-h-[120px] lg:min-h-[140px]
            rounded-none sm:rounded-2xl
            bg-gradient-to-r from-[#08080c]/80 via-[#0b0b12]/60 to-[#08080c]/80
            backdrop-blur-2xl
            border-y sm:border border-white/5
            flex flex-col items-center justify-center gap-1.5
            select-none
          `}
        >
          <Megaphone className="h-5 w-5 text-white/10" />
          <span className="text-white/20 text-xs font-semibold uppercase tracking-wider">Premium Cinematic Footer Placement</span>
          <span className="text-white/10 text-[10px]">Premium ad-network space active</span>
        </div>
      </div>
    )
  }

  return <FooterAdCard ad={ad} />
}

// ─── Optimized HLS Video Component ──────────────────────────────────────────

interface HlsAdPlayerProps {
  adId: string
  mediaUrl: string
  poster?: string
  isMuted: boolean
  isAmbient?: boolean
}

const HlsAdPlayer = memo(function HlsAdPlayer({
  adId,
  mediaUrl,
  poster,
  isMuted,
  isAmbient = false,
}: HlsAdPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // 1. Intersection Observer to check if the video ad is inside the viewport
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.05 } // Trigger when at least 5% of the card is visible
    )

    observer.observe(video)

    return () => {
      observer.unobserve(video)
    }
  }, [])

  // 2. Initialize and pre-buffer HLS streaming on mount
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const hlsUrl = `/api/streaming/hls/ad/${adId}?type=master`
    let hls: Hls | null = null

    const isHlsFormat = mediaUrl.includes('.m3u8')

    if (isHlsFormat && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 45,
        backBufferLength: 15,
        maxBufferSize: 60 * 1024 * 1024,
        startLevel: -1,
        capLevelToPlayerSize: false,
        startFragPrefetch: true,
        abrEwmaDefaultEstimate: 5000000,
        abrBandWidthFactor: 0.95,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
      })
      hls.loadSource(mediaUrl)
      hls.attachMedia(video)
      hlsRef.current = hls

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoaded(true)
      })

    } else {
      // Standard MP4 playback (Native) - Much faster and prevents MEDIA_ERROR
      video.src = mediaUrl
      
      const handleLoaded = () => {
        setLoaded(true)
      }

      if (video.readyState >= 2) {
        handleLoaded()
      } else {
        video.onloadeddata = handleLoaded
      }
    }

    return () => {
      if (hls) {
        hls.destroy()
        hlsRef.current = null
      }
      video.pause()
      video.removeAttribute('src')
      video.load()
      setLoaded(false)
    }
  }, [adId, mediaUrl])

  // 3. Play/Pause reactively based on viewport visibility
  useEffect(() => {
    const video = videoRef.current
    if (!video || !loaded) return

    if (isVisible) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isVisible, loaded])

  // Sync mute state
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = isMuted
  }, [isMuted])

  return (
    <video
      ref={videoRef}
      poster={poster}
      autoPlay
      loop
      playsInline
      className={`w-full h-full object-cover transition-opacity duration-500 ${
        isAmbient ? 'blur-3xl scale-125 opacity-15' : loaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ willChange: isAmbient ? 'auto' : 'opacity, transform' }}
    />
  )
})

// ─── Ad Card ─────────────────────────────────────────────────────────────────

function FooterAdCard({ ad }: { ad: FooterAdItem }) {
  const [isMuted, setIsMuted] = useState(true)
  const impressionFired = useRef(false)

  // ── Impression tracking ──────────────────────────────────────────────────
  useEffect(() => {
    if (impressionFired.current) return
    impressionFired.current = true

    fetch('/api/footer-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ad.id, incrementImpressions: true }),
    }).catch(() => {})
  }, [ad.id])

  // ── Click tracking ──────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    fetch('/api/footer-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ad.id, incrementClicks: true }),
    }).catch(() => {})

    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }, [ad.id, ad.linkUrl])

  // ── Media renderer ──────────────────────────────────────────────────────
  const renderMedia = () => {
    switch (ad.adType) {
      case 'video':
        return (
          <HlsAdPlayer
            adId={ad.id}
            mediaUrl={ad.mediaUrl}
            poster={ad.thumbnailUrl}
            isMuted={isMuted}
          />
        )

      case 'image':
      case 'gif':
        return (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            loading="eager"
            className="w-full h-full object-cover will-change-transform"
            draggable={false}
          />
        )

      case 'html5':
        return (
          <iframe
            src={ad.mediaUrl}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0 will-change-transform"
            title={ad.title}
            loading="lazy"
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full px-0 sm:px-6 lg:px-8 pb-4">
      <div
        onClick={ad.adType !== 'html5' ? handleClick : undefined}
        className={`
          relative
          mx-auto max-w-[1600px]
          h-[90px] sm:h-[120px] md:h-[150px] lg:h-[180px] xl:h-[200px]
          rounded-none sm:rounded-2xl
          border-y sm:border border-[#e50914]/20
          bg-gradient-to-r from-[#08080c] via-[#0d0d16] to-[#08080c]
          shadow-[0_0_35px_rgba(229,9,20,0.14)]
          overflow-hidden
          ${ad.adType !== 'html5' && ad.linkUrl ? 'cursor-pointer' : ''}
          will-change-transform
          transition-all duration-300
          hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(229,9,20,0.22)] hover:border-[#e50914]/40
        `}
      >
        {/* Background ambient blurring glow (disabled on mobile/tablet to eliminate performance lag) */}
        {ad.adType === 'video' ? (
          <div className="hidden md:block absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
            <HlsAdPlayer
              adId={ad.id}
              mediaUrl={ad.mediaUrl}
              isMuted={true}
              isAmbient={true}
            />
          </div>
        ) : ad.adType === 'image' || ad.adType === 'gif' ? (
          <div className="hidden md:block absolute inset-0 z-0 select-none pointer-events-none overflow-hidden opacity-15">
            <img
              src={ad.mediaUrl}
              alt=""
              className="w-full h-full object-cover blur-3xl scale-125"
            />
          </div>
        ) : null}

        {/* Cinematic Linear Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 z-10 pointer-events-none" />

        {/* Media elements rendered edge-to-edge */}
        <div className="absolute inset-0 z-0 w-full h-full">
          {renderMedia()}
        </div>

        {/* Left cinematic billboard-style details */}
        <div className="absolute inset-y-0 left-0 z-20 flex flex-col justify-center px-6 sm:px-8 md:px-10 lg:px-12 max-w-[70%] sm:max-w-[55%] pointer-events-none select-none">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <span className="bg-[#e50914] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(229,9,20,0.5)] tracking-wider uppercase font-sans">
              AD
            </span>
            {ad.mediaFormat && (
              <span className="text-white/40 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest font-sans">
                &bull; {ad.mediaFormat}
              </span>
            )}
          </div>
          <h3 className="text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-black tracking-tight leading-tight uppercase truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            {ad.title}
          </h3>
          {ad.adType === 'video' && (
            <p className="hidden sm:line-clamp-2 text-white/50 text-[10px] md:text-xs mt-1.5 leading-relaxed max-w-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
              Experience premium cinematic playback in high definition. Click to discover exclusive features and campaign information.
            </p>
          )}
        </div>

        {/* Minimal Mute/Unmute Toggle (only for video adType) */}
        {ad.adType === 'video' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsMuted((prev) => !prev)
            }}
            className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-black/70 hover:bg-black/95 border border-white/10 text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95 backdrop-blur-md shadow-lg cursor-pointer"
            aria-label={isMuted ? 'Unmute ad video' : 'Mute ad video'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
