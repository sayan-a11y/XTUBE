'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from 'react'
import Hls from 'hls.js'
import { Play, Info, ChevronLeft, ChevronRight, Volume2, VolumeX, Megaphone, Maximize2 } from 'lucide-react'

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface HeroAdItem {
  id: string
  title: string
  description?: string
  category?: string
  mediaUrl: string
  thumbnailUrl?: string
  adType: 'image' | 'video'
  mediaFormat: string
  linkUrl?: string
}

interface HeroAdsSliderProps {
  ads: HeroAdItem[]
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const AUTOPLAY_DELAY = 8000  // 8 seconds
const SWIPE_THRESHOLD = 50        // px minimum swipe distance
const MAX_VISIBLE_ADS = 6         // Limit hero ads to display

/* ────────────────────────────────────────────
   Optimized HLS Ad Video Player Component
   ──────────────────────────────────────────── */

interface AdVideoPlayerProps {
  adId: string
  mediaUrl: string
  poster?: string
  isActive: boolean
  isMuted: boolean
  isAdjacent: boolean
  onLoaded: () => void
}

const AdVideoPlayer = memo(function AdVideoPlayer({
  adId,
  mediaUrl,
  poster,
  isActive,
  isMuted,
  isAdjacent,
  onLoaded,
}: AdVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // 1. Check viewport visibility of the hero area to pause if scrolled away
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.05 }
    )

    observer.observe(video)

    return () => {
      observer.unobserve(video)
    }
  }, [])

  // 2. Initialize video source when visible AND (active or adjacent)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let hls: Hls | null = null
    const shouldLoad = isVisible && (isActive || isAdjacent)

    if (shouldLoad) {
      const isHlsFormat = mediaUrl.includes('.m3u8')
      
      if (isHlsFormat && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1,
        })
        hls.loadSource(mediaUrl)
        hls.attachMedia(video)
        hlsRef.current = hls

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoaded(true)
          onLoaded()
          if (isActive) {
            video.play().catch(() => {})
          }
        })
      } else {
        // Standard MP4 playback (Native) - Much faster and doesn't crash on standard MP4s
        video.src = mediaUrl
        
        const handleLoaded = () => {
          setLoaded(true)
          onLoaded()
          if (isActive) {
            video.play().catch(() => {})
          }
        }

        if (video.readyState >= 2) {
          handleLoaded()
        } else {
          video.onloadeddata = handleLoaded
        }
      }
    } else {
      // Suspend loading when off-screen or not active/adjacent
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      video.pause()
      video.removeAttribute('src')
      video.load()
      setLoaded(false)
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
  }, [mediaUrl, isActive, isAdjacent, isVisible, onLoaded])

  // 3. Play/Pause based on active state and visibility
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive && isVisible) {
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {})
      }
    } else {
      video.pause()
    }
  }, [isActive, isVisible])

  // 4. Sync mute status
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = isMuted
  }, [isMuted])

  return (
    <video
      ref={videoRef}
      poster={poster}
      loop
      playsInline
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ willChange: 'opacity, transform' }}
    />
  )
})

/* ────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────── */

export function HeroAdsSlider({ ads }: HeroAdsSliderProps) {
  // Limit display to max visible ads
  const visibleAds = useMemo(() => ads.slice(0, MAX_VISIBLE_ADS), [ads])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)
  const [videoLoaded, setVideoLoaded] = useState<Record<string, boolean>>({})
  const [isHovering, setIsHovering] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const hasMultipleAds = visibleAds.length > 1

  // Handle bounds check
  useEffect(() => {
    if (currentIndex >= visibleAds.length && visibleAds.length > 0) {
      setCurrentIndex(0)
    }
  }, [visibleAds.length, currentIndex])

  const safeIndex = currentIndex < visibleAds.length ? currentIndex : 0

  /* ── Derived indices ── */
  const nextIndex = useMemo(
    () => (visibleAds.length > 0 ? (safeIndex + 1) % visibleAds.length : 0),
    [safeIndex, visibleAds.length]
  )

  const prevIndex = useMemo(
    () => (visibleAds.length > 0 ? (safeIndex - 1 + visibleAds.length) % visibleAds.length : 0),
    [safeIndex, visibleAds.length]
  )

  /* ── Navigation ── */
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const goToNext = useCallback(() => {
    if (!visibleAds.length) return
    setCurrentIndex((prev) => (prev + 1) % visibleAds.length)
  }, [visibleAds.length])

  const goToPrev = useCallback(() => {
    if (!visibleAds.length) return
    setCurrentIndex((prev) => (prev - 1 + visibleAds.length) % visibleAds.length)
  }, [visibleAds.length])

  /* ── Autoplay ── */
  useEffect(() => {
    if (!hasMultipleAds || isPaused) return

    autoplayRef.current = setInterval(goToNext, AUTOPLAY_DELAY)

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
      }
    }
  }, [goToNext, hasMultipleAds, isPaused])

  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth >= 768) {
      setIsPaused(true)
      setIsHovering(true)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false)
    setIsHovering(false)
  }, [])

  /* ── Click and Impression Tracking ── */
  const impressionFiredRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!visibleAds.length) return
    const currentAd = visibleAds[safeIndex]
    if (!currentAd || impressionFiredRef.current.has(currentAd.id)) return

    impressionFiredRef.current.add(currentAd.id)

    fetch('/api/hero-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentAd.id, incrementImpressions: true }),
    }).catch(() => {})
  }, [safeIndex, visibleAds])

  const handleWatchNow = useCallback(() => {
    if (!visibleAds.length) return
    const currentAd = visibleAds[safeIndex]
    if (!currentAd) return

    fetch('/api/hero-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentAd.id, incrementClicks: true }),
    }).catch(() => {})

    if (currentAd.linkUrl) {
      window.open(currentAd.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }, [safeIndex, visibleAds])

  /* ── Swipe Support ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return
      if (!hasMultipleAds) return

      const deltaX = e.changedTouches[0].clientX - touchStartX.current
      const deltaY = e.changedTouches[0].clientY - touchStartY.current

      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          goToNext()
        } else {
          goToPrev()
        }
      }

      touchStartX.current = null
      touchStartY.current = null
    },
    [goToNext, goToPrev, hasMultipleAds]
  )

  /* ── Keyboard Support ── */
  useEffect(() => {
    if (!hasMultipleAds) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev, hasMultipleAds])

  const handleVideoLoaded = useCallback((id: string) => {
    setVideoLoaded((prev) => ({ ...prev, [id]: true }))
  }, [])

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      containerRef.current.requestFullscreen().catch(() => {})
    }
  }, [])

  if (!visibleAds.length) {
    return (
      <div
        className="relative w-full overflow-hidden select-none"
        style={{ background: '#050505' }}
        role="region"
        aria-label="Hero advertisement space"
      >
        <div className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] lg:h-[65vh] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#050505] to-[#080810]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-[#ff1e1e]/[0.03] blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-white/5 bg-[#0B0B0F]/80 backdrop-blur-xl">
              <Megaphone className="h-8 w-8 sm:h-10 sm:w-10 text-[#ff1e1e]/40" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/30 tracking-tight">
                No Hero Ads Available
              </h2>
              <p className="text-sm text-white/15 max-w-md">
                Hero ads will appear here once uploaded from the admin panel
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-dashed border-white/10 bg-white/[0.02] px-4 py-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#ff1e1e]/30" />
              <span className="text-[11px] text-white/20 font-medium">Hero Ad Space</span>
              <div className="h-1.5 w-1.5 rounded-full bg-[#ff1e1e]/30" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
        </div>
      </div>
    )
  }

  const currentAd = visibleAds[safeIndex]

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none"
      style={{ background: '#050505' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Hero advertisement slider"
      aria-roledescription="carousel"
    >
      {/* ── Slide Deck Area ── */}
      <div className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] lg:h-[65vh] overflow-hidden">
        {visibleAds.map((ad, idx) => {
          const isActive = idx === safeIndex
          const isNext = idx === nextIndex
          const isPrev = idx === prevIndex
          // Smart window: Only render the active, next, or previous slide to keep DOM/memory light
          const isRendered = isActive || isNext || isPrev

          if (!isRendered) return null

          return (
            <div
              key={ad.id}
              className="absolute inset-0 transition-all duration-[1100ms] cubic-bezier(0.16, 1, 0.3, 1) will-change-transform"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive
                  ? 'translate3d(0, 0, 0) scale(1)'
                  : isNext
                  ? 'translate3d(100%, 0, 0) scale(0.97)'
                  : 'translate3d(-100%, 0, 0) scale(0.97)',
                pointerEvents: isActive ? 'auto' : 'none',
                zIndex: isActive ? 10 : 0,
              }}
            >
              {ad.adType === 'video' ? (
                <>
                  {!videoLoaded[ad.id] && (
                    <div className="absolute inset-0 animate-shimmer z-0" />
                  )}
                  <AdVideoPlayer
                    adId={ad.id}
                    mediaUrl={ad.mediaUrl}
                    poster={ad.thumbnailUrl || undefined}
                    isActive={isActive}
                    isMuted={videoMuted}
                    isAdjacent={isNext || isPrev}
                    onLoaded={() => handleVideoLoaded(ad.id)}
                  />
                  {/* Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/30 to-transparent" />
                </>
              ) : (
                <>
                  {/* Highly optimized parallax image */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={ad.mediaUrl}
                      alt={ad.title}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      fetchPriority={idx === 0 ? 'high' : 'low'}
                      decoding={isActive ? 'sync' : 'async'}
                      className={`h-full w-full object-cover transition-transform duration-[20s] linear ${
                        isActive ? 'scale-106' : 'scale-100'
                      }`}
                      style={{ willChange: 'transform' }}
                    />
                  </div>
                  {/* Cinematic overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-[#050505]/10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/40 to-transparent" />
                </>
              )}
              {/* Subtle vignette */}
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,5,5,0.4) 100%)',
              }} />
            </div>
          )
        })}

        {/* ── Content overlay (Single overlay synced with currentIndex for smooth text cross-fade) ── */}
        <div className="absolute inset-0 flex items-end pointer-events-none z-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 pb-16 sm:pb-20 md:pb-24 lg:pb-28 xl:pb-32">
            <div className="max-w-xl space-y-3 sm:space-y-4 pointer-events-auto">
              {/* Sponsored badge */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-[#ff1e1e]/10 border border-[#ff1e1e]/20 px-3 py-1">
                  <Megaphone className="h-3 w-3 text-[#ff1e1e]" />
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#ff1e1e]">
                    Sponsored
                  </span>
                </div>
              </div>

              {/* Category badge */}
              {currentAd.category && (
                <div>
                  <span className="inline-flex items-center rounded-sm bg-[#ff1e1e] px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_12px_rgba(255,30,30,0.3)]">
                    {currentAd.category}
                  </span>
                </div>
              )}

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.05] tracking-tight transition-all duration-300">
                {currentAd.title}
              </h2>

              {/* Description */}
              {currentAd.description && (
                <p className="line-clamp-2 text-sm sm:text-base text-white/50 max-w-md leading-relaxed">
                  {currentAd.description}
                </p>
              )}

              {/* CTA buttons */}
              <div className="flex items-center gap-3 pt-2 sm:pt-3">
                <button
                  onClick={handleWatchNow}
                  className="flex items-center gap-2 rounded-md bg-[#ff1e1e] px-5 py-2.5 sm:px-7 sm:py-3 md:px-8 md:py-3.5 text-sm sm:text-base font-semibold text-white transition-all hover:bg-[#ff2e2e] shadow-[0_0_20px_rgba(255,30,30,0.4)] hover:scale-104 active:scale-96 cursor-pointer"
                >
                  <Play className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />
                  Watch Now
                </button>

                <button
                  className="glass flex items-center gap-2 rounded-md px-5 py-2.5 sm:px-7 sm:py-3 md:px-8 md:py-3.5 text-sm sm:text-base font-semibold text-white transition-all hover:bg-white/12 hover:scale-104 active:scale-96 cursor-pointer"
                >
                  <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                  More Info
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Video controls (top right) ── */}
        {currentAd.adType === 'video' && videoLoaded[currentAd.id] && (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-30 flex items-center gap-2">
            {/* Mute/Unmute */}
            <button
              onClick={() => setVideoMuted((m) => !m)}
              className="glass flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-white/70 hover:text-white transition-colors hover:scale-110 active:scale-90 cursor-pointer"
              aria-label={videoMuted ? 'Unmute video' : 'Mute video'}
            >
              {videoMuted ? (
                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="glass hidden md:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-white/70 hover:text-white transition-colors hover:scale-110 active:scale-90 cursor-pointer"
              aria-label="Fullscreen"
            >
              <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}

        {/* ── Navigation arrows (visible on desktop) ── */}
        {hasMultipleAds && (
          <>
            {/* Previous */}
            <button
              onClick={goToPrev}
              className="hidden md:flex absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-30 glass h-11 w-11 lg:h-14 lg:w-14 items-center justify-center rounded-full text-white/60 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Previous ad"
            >
              <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>

            {/* Next */}
            <button
              onClick={goToNext}
              className="hidden md:flex absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-30 glass h-11 w-11 lg:h-14 lg:w-14 items-center justify-center rounded-full text-white/60 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Next ad"
            >
              <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>
          </>
        )}

        {/* ── Slider indicators ── */}
        {hasMultipleAds && (
          <div className="absolute bottom-5 sm:bottom-7 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
            {visibleAds.map((ad, index) => (
              <button
                key={ad.id}
                onClick={() => goToSlide(index)}
                aria-label={`Go to ad ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : undefined}
                className="relative h-[6px] rounded-full transition-all duration-300 cursor-pointer overflow-hidden"
                style={{
                  width: index === safeIndex ? 36 : 6,
                  background: index === safeIndex ? '#ff1e1e' : 'rgba(255, 255, 255, 0.25)',
                  boxShadow: index === safeIndex ? '0 0 8px rgba(255,30,30,0.5)' : 'none',
                }}
              />
            ))}
          </div>
        )}

        {/* ── Bottom fade-to-content gradient ── */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-20 pointer-events-none" />

        {/* ── Hover red glow on edges ── */}
        {isHovering && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#ff1e1e]/20 to-transparent z-30 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#ff1e1e]/20 to-transparent z-30 pointer-events-none" />
          </>
        )}
      </div>
    </div>
  )
}
