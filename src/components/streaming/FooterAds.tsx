'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Volume2, VolumeX, X } from 'lucide-react'

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
  const [isVisible, setIsVisible] = useState(true)
  const ad = ads?.[0] ?? null

  // ── Empty State ──────────────────────────────────────────────────────────
  if (!ad) {
    return (
      <div className="w-full px-0 sm:px-6 lg:px-8">
        <div
          className={`
            mx-auto max-w-[1600px]
            min-h-[80px] md:min-h-[100px] lg:min-h-[120px]
            rounded-none sm:rounded-xl
            bg-[#0a0a0a]/60 backdrop-blur-xl
            border-y sm:border border-white/5
            flex flex-col items-center justify-center gap-1
            select-none
          `}
        >
          <Megaphone className="h-5 w-5 text-white/10" />
          <span className="text-white/20 text-xs font-semibold uppercase tracking-wider">Footer Ad Space</span>
          <span className="text-white/10 text-[10px]">Advertise with premium cinematic placements</span>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <FooterAdCard ad={ad} onClose={() => setIsVisible(false)} />
      )}
    </AnimatePresence>
  )
}

// ─── Ad Card ─────────────────────────────────────────────────────────────────

function FooterAdCard({ ad, onClose }: { ad: FooterAdItem; onClose: () => void }) {
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const impressionFired = useRef(false)

  // ── Impression tracking (fire once) ─────────────────────────────────────
  useEffect(() => {
    if (impressionFired.current) return
    impressionFired.current = true

    fetch('/api/footer-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ad.id, incrementImpressions: true }),
    }).catch(() => {
      // Silently fail — ad tracking should not break the UI
    })
  }, [ad.id])

  // ── Click tracking ──────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    fetch('/api/footer-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ad.id, incrementClicks: true }),
    }).catch(() => {
      // Silently fail
    })

    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }, [ad.id, ad.linkUrl])

  // ── Video controls ──────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }, [])

  // ── Media renderer ──────────────────────────────────────────────────────
  const renderMedia = () => {
    switch (ad.adType) {
      case 'video':
        return (
          <video
            ref={videoRef}
            src={ad.mediaUrl}
            poster={ad.thumbnailUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover will-change-transform transition-opacity duration-500"
            preload="auto"
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
    <div className="w-full px-0 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95, transition: { duration: 0.2 } }}
        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
        whileHover={{ 
          boxShadow: '0 0 35px rgba(255,30,30,0.18)', 
          borderColor: 'rgba(255,30,30,0.25)' 
        }}
        onClick={ad.adType !== 'html5' ? handleClick : undefined}
        className={`
          relative
          mx-auto max-w-[1600px]
          h-[90px] sm:h-[130px] md:h-[150px] lg:h-[180px]
          rounded-none sm:rounded-2xl
          border-y sm:border border-[#ff1e1e]/10
          bg-[#050508]/95 backdrop-blur-2xl
          shadow-[0_0_35px_rgba(255,30,30,0.12)]
          overflow-hidden
          ${ad.adType !== 'html5' && ad.linkUrl ? 'cursor-pointer' : ''}
          will-change-transform
        `}
      >
        {/* Background ambient blurring glow (adds extreme cinematic depth) */}
        {ad.adType === 'video' ? (
          <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden opacity-20">
            <video
              src={ad.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover blur-3xl scale-125"
            />
          </div>
        ) : ad.adType === 'image' || ad.adType === 'gif' ? (
          <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden opacity-20">
            <img
              src={ad.mediaUrl}
              alt=""
              className="w-full h-full object-cover blur-3xl scale-125"
            />
          </div>
        ) : null}

        {/* Cinematic Linear Gradient overlay to shield text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent z-10 pointer-events-none" />

        {/* Interactive Close (X) button at the top-right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
          aria-label="Dismiss Campaign"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Media elements rendered edge-to-edge */}
        <div className="absolute inset-0 z-0 w-full h-full">
          {renderMedia()}
        </div>

        {/* Left billing details card overlay */}
        <div className="absolute inset-y-0 left-0 z-20 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-10 max-w-[65%] sm:max-w-[50%] pointer-events-none select-none">
          <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
            <span className="bg-[#ff1e1e] text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,30,30,0.4)] tracking-wide uppercase">
              AD
            </span>
            {ad.mediaFormat && (
              <span className="text-white/40 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                &bull; {ad.mediaFormat}
              </span>
            )}
          </div>
          <h3 className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-black tracking-tight leading-tight uppercase truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {ad.title}
          </h3>
          {ad.adType === 'video' && (
            <p className="hidden sm:line-clamp-1 text-white/50 text-[10px] md:text-xs mt-1 leading-relaxed max-w-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              Experience dynamic premium cinema playback. Click to discover more features.
            </p>
          )}
        </div>

        {/* Minimal Mute/Unmute Toggle (only for video adType) */}
        {ad.adType === 'video' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleMute()
            }}
            className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-30 flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
            aria-label={isMuted ? 'Unmute ad video' : 'Mute ad video'}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </motion.div>
    </div>
  )
}
