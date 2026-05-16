'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, ChevronLeft, ChevronRight, Volume2, VolumeX, Megaphone } from 'lucide-react'
import { useAppStore } from '@/lib/store'

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
}

interface HeroAdsSliderProps {
  ads: HeroAdItem[]
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const AUTOPLAY_DELAY = 30_000     // 30 seconds (demo — change to 1_800_000 for 30 min)
const TRANSITION_SPEED = 1_200    // ms
const SWIPE_THRESHOLD = 50        // px minimum swipe distance

/* ────────────────────────────────────────────
   Staggered content animation variants
   ──────────────────────────────────────────── */

const contentVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.25 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
}

const contentItem = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: 'blur(2px)',
    transition: { duration: 0.25, ease: 'easeIn' },
  },
}

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function HeroAdsSlider({ ads }: HeroAdsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)
  const [videoLoaded, setVideoLoaded] = useState<Record<string, boolean>>({})
  const [isHovering, setIsHovering] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const navigateToVideo = useAppStore((s) => s.navigateToVideo)

  const hasMultipleAds = ads.length > 1

  /* ── Derived indices ── */
  const nextIndex = useMemo(
    () => (currentIndex + 1) % ads.length,
    [currentIndex, ads.length],
  )

  /* ── Go to slide ── */
  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex((prev) => {
        if (prev === index) return prev
        return index
      })
    },
    [],
  )

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ads.length)
  }, [ads.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length)
  }, [ads.length])

  /* ── Autoplay ── */
  useEffect(() => {
    if (!hasMultipleAds) return

    // Clear any existing timer
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
      autoplayRef.current = null
    }

    // Don't start if paused (hover on desktop)
    if (isPaused) return

    autoplayRef.current = setInterval(goToNext, AUTOPLAY_DELAY)

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
        autoplayRef.current = null
      }
    }
  }, [goToNext, hasMultipleAds, isPaused])

  /* ── Pause on hover (desktop only) ── */
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

  /* ── Video: pause when not active, play when active ── */
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (!video) return
      const ad = ads[currentIndex]
      if (ad && id === ad.id && ad.adType === 'video') {
        // Small delay so transition starts before playing
        const timer = setTimeout(() => {
          video.play().catch(() => {})
        }, 300)
        return () => clearTimeout(timer)
      } else {
        video.pause()
      }
    })
  }, [currentIndex, ads])

  /* ── Touch / Swipe support ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return

      const deltaX = e.changedTouches[0].clientX - touchStartX.current
      const deltaY = e.changedTouches[0].clientY - touchStartY.current

      // Only trigger if horizontal swipe is dominant and exceeds threshold
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
    [goToNext, goToPrev],
  )

  /* ── Keyboard support ── */
  useEffect(() => {
    if (!hasMultipleAds) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
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

  /* ── Video loaded handler ── */
  const handleVideoLoaded = useCallback((id: string) => {
    setVideoLoaded((prev) => ({ ...prev, [id]: true }))
  }, [])

  /* ── Early returns ── */
  if (!ads.length) return null

  const currentAd = ads[currentIndex]

  /* ────────────────────────────────────────────
     Render
     ──────────────────────────────────────────── */

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
      {/* ── Slide area ── */}
      <div className="relative h-[48vh] md:h-[60vh] lg:h-[78vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAd.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TRANSITION_SPEED / 1000, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 will-change-transform"
          >
            {/* ── Background media ── */}
            {currentAd.adType === 'video' ? (
              <>
                {/* Shimmer placeholder while video loads */}
                {!videoLoaded[currentAd.id] && (
                  <div className="absolute inset-0 animate-shimmer z-0" />
                )}

                <video
                  ref={(el) => {
                    videoRefs.current[currentAd.id] = el
                  }}
                  src={currentAd.mediaUrl}
                  poster={currentAd.thumbnailUrl || undefined}
                  autoPlay
                  muted={videoMuted}
                  loop
                  playsInline
                  onLoadedData={() => handleVideoLoaded(currentAd.id)}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                    videoLoaded[currentAd.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ willChange: 'transform' }}
                />

                {/* Video gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/30 to-transparent" />
              </>
            ) : (
              <>
                {/* Parallax zoom image */}
                <motion.div
                  className="absolute inset-0 overflow-hidden"
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.05 }}
                  transition={{
                    duration: AUTOPLAY_DELAY / 1000,
                    ease: 'linear',
                  }}
                  style={{ willChange: 'transform' }}
                >
                  <img
                    src={currentAd.mediaUrl}
                    alt={currentAd.title}
                    loading={currentIndex === 0 ? 'eager' : 'lazy'}
                    fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
                    className="h-full w-full object-cover"
                  />
                </motion.div>

                {/* Cinematic dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-[#050505]/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/40 to-transparent" />
              </>
            )}

            {/* ── Subtle vignette ── */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,5,5,0.4) 100%)',
            }} />
          </motion.div>
        </AnimatePresence>

        {/* ── Preload next slide (hidden) ── */}
        {hasMultipleAds && (
          <div className="pointer-events-none absolute inset-0 opacity-0" aria-hidden="true">
            {ads[nextIndex]?.adType === 'image' && (
              <img
                src={ads[nextIndex].mediaUrl}
                alt=""
                loading="eager"
                className="h-full w-full object-cover"
              />
            )}
            {ads[nextIndex]?.adType === 'video' && (
              <video
                src={ads[nextIndex].mediaUrl}
                poster={ads[nextIndex].thumbnailUrl || undefined}
                muted
                preload="auto"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        )}

        {/* ── Content overlay ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentAd.id}`}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 flex items-end"
          >
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 pb-20 sm:pb-24 md:pb-28 lg:pb-32">
              <div className="max-w-xl space-y-3 sm:space-y-4">
                {/* Sponsored badge */}
                <motion.div variants={contentItem} className="flex items-center gap-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-xtube-red" />
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-xtube-red">
                    Sponsored
                  </span>
                </motion.div>

                {/* Category badge */}
                {currentAd.category && (
                  <motion.div variants={contentItem}>
                    <span className="inline-flex items-center rounded-sm bg-xtube-red px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white">
                      {currentAd.category}
                    </span>
                  </motion.div>
                )}

                {/* Title */}
                <motion.h2
                  variants={contentItem}
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight"
                >
                  {currentAd.title}
                </motion.h2>

                {/* Description */}
                {currentAd.description && (
                  <motion.p
                    variants={contentItem}
                    className="line-clamp-2 text-sm sm:text-base text-white/50 max-w-md leading-relaxed"
                  >
                    {currentAd.description}
                  </motion.p>
                )}

                {/* CTA buttons */}
                <motion.div variants={contentItem} className="flex items-center gap-3 pt-1 sm:pt-2">
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(229,9,20,0.4)' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigateToVideo(currentAd.id)}
                    className="flex items-center gap-2 rounded-md bg-xtube-red px-5 py-2.5 sm:px-7 sm:py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-xtube-red-hover red-glow-subtle"
                  >
                    <Play className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />
                    Watch Now
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.12)' }}
                    whileTap={{ scale: 0.96 }}
                    className="glass flex items-center gap-2 rounded-md px-5 py-2.5 sm:px-7 sm:py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                    More Info
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Video mute toggle ── */}
        {currentAd.adType === 'video' && videoLoaded[currentAd.id] && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setVideoMuted((m) => !m)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 glass flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-white/70 hover:text-white transition-colors"
            aria-label={videoMuted ? 'Unmute video' : 'Mute video'}
          >
            {videoMuted ? (
              <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </motion.button>
        )}

        {/* ── Navigation arrows (hidden on mobile) ── */}
        {hasMultipleAds && (
          <>
            {/* Previous */}
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={goToPrev}
              className="hidden md:flex absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-20 glass h-11 w-11 lg:h-12 lg:w-12 items-center justify-center rounded-full text-white/70 hover:text-white transition-all duration-200"
              aria-label="Previous ad"
            >
              <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
            </motion.button>

            {/* Next */}
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={goToNext}
              className="hidden md:flex absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-20 glass h-11 w-11 lg:h-12 lg:w-12 items-center justify-center rounded-full text-white/70 hover:text-white transition-all duration-200"
              aria-label="Next ad"
            >
              <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
            </motion.button>
          </>
        )}

        {/* ── Slider indicators ── */}
        {hasMultipleAds && (
          <div className="absolute bottom-5 sm:bottom-7 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {ads.map((ad, index) => (
              <button
                key={ad.id}
                onClick={() => goToSlide(index)}
                aria-label={`Go to ad ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : undefined}
                className="relative h-[6px] overflow-hidden rounded-full transition-all duration-300 cursor-pointer"
              >
                {index === currentIndex ? (
                  <motion.div
                    layoutId="hero-ads-dot"
                    className="h-full rounded-full"
                    style={{ backgroundColor: '#ff1e1e' }}
                    initial={false}
                    animate={{ width: 32 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                ) : (
                  <div className="h-full w-[6px] rounded-full bg-white/30 hover:bg-white/50 transition-colors duration-200" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Bottom fade-to-content gradient ── */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  )
}
