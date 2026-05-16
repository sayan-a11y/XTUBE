'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Hls from 'hls.js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Settings,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  Subtitles,
  MonitorPlay,
  Bell,
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Eye,
  Search,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Comments } from '@/components/streaming/Comments'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoPlayerProps {
  video: {
    id: string
    title: string
    description: string
    videoUrl: string
    thumbnail: string
    views: number
    duration: string
    category: string
    isHd: boolean
    createdAt: string
  }
  relatedVideos: Array<{
    id: string
    title: string
    thumbnail: string
    duration: string
    views: number
    category: string
  }>
  comments: Array<{
    id: string
    content: string
    likes: number
    createdAt: string
    user: {
      id: string
      username: string
      avatar: string | null
    }
    replies?: Array<{
      id: string
      content: string
      likes: number
      createdAt: string
      user: {
        id: string
        username: string
        avatar: string | null
      }
      replies?: Array<never>
    }>
  }>
  onAddComment: (content: string, parentId?: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return views.toString()
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffMinutes > 0) return `${diffMinutes} min ago`
  return 'Just now'
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) {
    return `${hrs}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ─── Quality / Speed options ─────────────────────────────────────────────────

const QUALITY_OPTIONS = [
  { label: 'Auto', value: 'auto' },
  { label: '1080p', value: '1080' },
  { label: '720p', value: '720' },
  { label: '480p', value: '480' },
]

const SPEED_OPTIONS = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1x (Normal)', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
]

// ─── Main Component ──────────────────────────────────────────────────────────

export function VideoPlayer({ video, relatedVideos, comments, onAddComment }: VideoPlayerProps) {
  // Store
  const goBack = useAppStore((s) => s.goBack)
  const theaterMode = useAppStore((s) => s.theaterMode)
  const setTheaterMode = useAppStore((s) => s.setTheaterMode)
  const navigateToVideo = useAppStore((s) => s.navigateToVideo)

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showCenterPlay, setShowCenterPlay] = useState(false)
  const [quality, setQuality] = useState('auto')
  const [speed, setSpeed] = useState(1)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [autoPlayNext, setAutoPlayNext] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // ─── Controls auto-hide ──────────────────────────────────────────────────

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
        setShowQualityMenu(false)
        setShowSpeedMenu(false)
      }, 3000)
    }
  }, [isPlaying])

  const handleMouseMove = useCallback(() => {
    resetControlsTimeout()
  }, [resetControlsTimeout])

  // ─── Playback controls ───────────────────────────────────────────────────

  const togglePlay = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) {
      vid.play()
      setIsPlaying(true)
      setShowCenterPlay(true)
      setTimeout(() => setShowCenterPlay(false), 600)
    } else {
      vid.pause()
      setIsPlaying(false)
    }
    resetControlsTimeout()
  }, [resetControlsTimeout])

  const toggleMute = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = !vid.muted
    setIsMuted(vid.muted)
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current
    if (!vid) return
    const val = parseFloat(e.target.value)
    vid.volume = val
    setVolume(val)
    if (val === 0) {
      vid.muted = true
      setIsMuted(true)
    } else if (vid.muted) {
      vid.muted = false
      setIsMuted(false)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const vid = videoRef.current
    const bar = progressRef.current
    if (!vid || !bar) return
    const rect = bar.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    vid.currentTime = pos * duration
  }, [duration])

  const handleSpeedChange = useCallback((val: number) => {
    const vid = videoRef.current
    if (!vid) return
    vid.playbackRate = val
    setSpeed(val)
    setShowSpeedMenu(false)
  }, [])

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'arrowleft':
          e.preventDefault()
          if (videoRef.current) videoRef.current.currentTime -= 10
          break
        case 'arrowright':
          e.preventDefault()
          if (videoRef.current) videoRef.current.currentTime += 10
          break
        case 'arrowup':
          e.preventDefault()
          if (videoRef.current) {
            const newVol = Math.min(1, videoRef.current.volume + 0.1)
            videoRef.current.volume = newVol
            setVolume(newVol)
            if (videoRef.current.muted) {
              videoRef.current.muted = false
              setIsMuted(false)
            }
          }
          break
        case 'arrowdown':
          e.preventDefault()
          if (videoRef.current) {
            const newVol = Math.max(0, videoRef.current.volume - 0.1)
            videoRef.current.volume = newVol
            setVolume(newVol)
            if (newVol === 0) {
              videoRef.current.muted = true
              setIsMuted(true)
            }
          }
          break
        case 'escape':
          if (isFullscreen) toggleFullscreen()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, toggleFullscreen, toggleMute, isFullscreen])

  // ─── Video event listeners ───────────────────────────────────────────────

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    const onTimeUpdate = () => setCurrentTime(vid.currentTime)
    const onLoadedMetadata = () => setDuration(vid.duration)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onProgress = () => {
      if (vid.buffered.length > 0) {
        setBuffered(vid.buffered.end(vid.buffered.length - 1))
      }
    }
    const onEnded = () => {
      setIsPlaying(false)
      if (autoPlayNext && relatedVideos.length > 0) {
        navigateToVideo(relatedVideos[0].id)
      }
    }

    vid.addEventListener('timeupdate', onTimeUpdate)
    vid.addEventListener('loadedmetadata', onLoadedMetadata)
    vid.addEventListener('play', onPlay)
    vid.addEventListener('pause', onPause)
    vid.addEventListener('progress', onProgress)
    vid.addEventListener('ended', onEnded)

    return () => {
      vid.removeEventListener('timeupdate', onTimeUpdate)
      vid.removeEventListener('loadedmetadata', onLoadedMetadata)
      vid.removeEventListener('play', onPlay)
      vid.removeEventListener('pause', onPause)
      vid.removeEventListener('progress', onProgress)
      vid.removeEventListener('ended', onEnded)
    }
  }, [autoPlayNext, relatedVideos, navigateToVideo])

  // ─── HLS Streaming Support ──────────────────────────────────────────────────

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    const url = video.videoUrl
    let hls: Hls | null = null

    if (url && url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        })
        hls.loadSource(url)
        hls.attachMedia(vid)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError()
                break
              default:
                hls?.destroy()
                break
            }
          }
        })
      } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
        vid.src = url
      }
    } else {
      vid.src = url
    }

    return () => {
      if (hls) hls.destroy()
    }
  }, [video.videoUrl])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowQualityMenu(false)
      setShowSpeedMenu(false)
      setShowMoreMenu(false)
    }
    if (showQualityMenu || showSpeedMenu || showMoreMenu) {
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, { once: true })
      }, 50)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showQualityMenu, showSpeedMenu, showMoreMenu])

  // ─── Computed values ─────────────────────────────────────────────────────

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  // ─── Extract hashtags from description ────────────────────────────────────

  const hashtags = video.description?.match(/#\w+/g) || []
  const descriptionWithoutTags = video.description?.replace(/#\w+/g, '').trim() || ''

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* ═══════════════════════════════════════════════════════════════════
          PREMIUM TOPBAR
          ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/5 bg-[#050505]/95 px-4 backdrop-blur-xl sm:px-6">
        {/* Left: Back + Logo + Search */}
        <div className="flex items-center gap-3">
          {/* Back button - transparent minimal */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-xtube-red">
              <span className="text-[10px] font-black text-white">X</span>
            </div>
            <span className="hidden text-base font-bold text-white sm:inline">Xtube</span>
          </div>

          {/* Premium Search Bar */}
          <div className="ml-2 hidden md:flex">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#111111] px-4 py-1.5 transition-all duration-200 focus-within:border-xtube-red/30 focus-within:shadow-[0_0_15px_rgba(229,9,20,0.1)]">
              <Search className="h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search videos, categories..."
                className="w-48 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none lg:w-64"
                aria-label="Search videos"
              />
            </div>
          </div>
        </div>

        {/* Right: Notification + Avatar */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-xtube-red text-[10px] font-bold text-white">
              3
            </span>
          </motion.button>

          {/* User avatar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-xtube-red to-red-700 ring-2 ring-xtube-red/20"
            aria-label="User profile"
          >
            <span className="text-xs font-bold text-white">A</span>
          </motion.button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT - TWO COLUMN LAYOUT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className={`mx-auto ${theaterMode ? 'max-w-full' : 'max-w-[1800px]'} px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6`}>
        <div className={`flex flex-col ${theaterMode ? '' : 'lg:flex-row'} gap-5 lg:gap-6`}>

          {/* ─── LEFT: Player + Video Info + Description + Comments ───────── */}
          <div className={`${theaterMode ? 'w-full' : 'lg:flex-1'} min-w-0`}>
            {/* ─── Video Player Container ──────────────────────────────── */}
            <div
              ref={containerRef}
              className="video-player-container group relative bg-black rounded-xl overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                if (isPlaying) setShowControls(false)
              }}
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                className="h-full w-full cursor-pointer aspect-video"
                poster={video.thumbnail}
                preload="metadata"
                onClick={togglePlay}
                onDoubleClick={toggleFullscreen}
                playsInline
              />

              {/* Center play/pause overlay animation */}
              <AnimatePresence>
                {showCenterPlay && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.3 }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                      {isPlaying ? (
                        <Play className="h-10 w-10 text-white ml-1" fill="currentColor" />
                      ) : (
                        <Pause className="h-10 w-10 text-white" fill="currentColor" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Large center play button when paused */}
              <AnimatePresence>
                {!isPlaying && !showCenterPlay && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={togglePlay}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-xtube-red/90 text-white shadow-[0_0_30px_rgba(229,9,20,0.4)] transition-colors hover:bg-xtube-red-hover sm:h-20 sm:w-20"
                      aria-label="Play video"
                    >
                      <Play className="h-8 w-8 ml-1 sm:h-10 sm:w-10" fill="currentColor" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top gradient for back button area */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />

              {/* Controls overlay */}
              <motion.div
                animate={{ opacity: showControls ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{ pointerEvents: showControls ? 'auto' : 'none' }}
              >
                {/* Bottom gradient */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

                <div className="relative px-3 pb-3 sm:px-4 sm:pb-4">
                  {/* Progress bar */}
                  <div
                    ref={progressRef}
                    className="group/progress mb-3 h-1 cursor-pointer rounded-full bg-white/20 transition-all hover:h-1.5 relative"
                    onClick={handleSeek}
                    role="slider"
                    aria-label="Video progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                  >
                    {/* Buffered */}
                    <div
                      className="absolute top-0 left-0 h-full rounded-full bg-white/20"
                      style={{ width: `${bufferedProgress}%` }}
                    />
                    {/* Progress fill */}
                    <div
                      className="absolute top-0 left-0 h-full rounded-full bg-xtube-red transition-all"
                      style={{ width: `${progress}%` }}
                    />
                    {/* Progress dot */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-xtube-red opacity-0 shadow-[0_0_10px_rgba(229,9,20,0.5)] transition-opacity group-hover/progress:opacity-100"
                      style={{ left: `${progress}%` }}
                    />
                  </div>

                  {/* Control buttons row */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {/* Play/Pause */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={togglePlay}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" fill="currentColor" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                      )}
                    </motion.button>

                    {/* Skip Back */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10 }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Skip back 10 seconds"
                    >
                      <SkipBack className="h-4 w-4" />
                    </motion.button>

                    {/* Skip Forward */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10 }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Skip forward 10 seconds"
                    >
                      <SkipForward className="h-4 w-4" />
                    </motion.button>

                    {/* Volume */}
                    <div className="group/vol flex items-center gap-0.5">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleMute}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        <VolumeIcon className="h-5 w-5" />
                      </motion.button>
                      <div className="w-0 overflow-hidden transition-all duration-200 group-hover/vol:w-20">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-xtube-red"
                          aria-label="Volume"
                        />
                      </div>
                    </div>

                    {/* Time display */}
                    <div className="ml-2 text-xs text-white/80 sm:text-sm">
                      <span className="font-medium">{formatTime(currentTime)}</span>
                      <span className="text-white/40"> / </span>
                      <span className="text-white/60">{formatTime(duration)}</span>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Subtitles CC */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Subtitles"
                    >
                      <Subtitles className="h-5 w-5" />
                    </motion.button>

                    {/* Speed */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowSpeedMenu((prev) => !prev)
                          setShowQualityMenu(false)
                        }}
                        className="flex h-9 items-center gap-0.5 rounded-full px-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Playback speed"
                      >
                        <span>{speed === 1 ? '1x' : `${speed}x`}</span>
                      </motion.button>
                      <AnimatePresence>
                        {showSpeedMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full right-0 mb-2 min-w-[140px] overflow-hidden rounded-xl border border-white/5 bg-[#111111]/95 py-1 shadow-2xl backdrop-blur-xl"
                          >
                            {SPEED_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSpeedChange(opt.value)
                                }}
                                className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                                  speed === opt.value ? 'text-xtube-red' : 'text-white/70'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Settings / Quality */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowQualityMenu((prev) => !prev)
                          setShowSpeedMenu(false)
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Video quality"
                      >
                        <Settings className="h-5 w-5" />
                      </motion.button>
                      <AnimatePresence>
                        {showQualityMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full right-0 mb-2 min-w-[140px] overflow-hidden rounded-xl border border-white/5 bg-[#111111]/95 py-1 shadow-2xl backdrop-blur-xl"
                          >
                            <div className="px-4 py-1.5 text-xs font-semibold text-white/40 uppercase">Quality</div>
                            {QUALITY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setQuality(opt.value)
                                  setShowQualityMenu(false)
                                }}
                                className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                                  quality === opt.value ? 'text-xtube-red' : 'text-white/70'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Theater mode */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setTheaterMode(!theaterMode)}
                      className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label={theaterMode ? 'Exit theater mode' : 'Theater mode'}
                    >
                      <MonitorPlay className="h-5 w-5" />
                    </motion.button>

                    {/* Fullscreen */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleFullscreen}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? (
                        <Minimize className="h-5 w-5" />
                      ) : (
                        <Maximize className="h-5 w-5" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ─── Video Info Section ──────────────────────────────────── */}
            <div className="mt-4 px-1 sm:px-2">
              {/* Video Title */}
              <motion.h1
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold text-white sm:text-xl lg:text-2xl leading-tight"
              >
                {video.title}
              </motion.h1>

              {/* Channel info + Action buttons row */}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Channel Info */}
                <div className="flex items-center gap-3">
                  {/* Channel Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-white/10 flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {video.category.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white truncate">{video.category} Films</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
                    </div>
                    <span className="text-xs text-white/50">{formatViews(Math.floor(video.views * 0.8))} subscribers</span>
                  </div>
                  {/* Subscribe Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="ml-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-white/90 sm:text-sm"
                    aria-label="Subscribe"
                  >
                    Subscribe
                  </motion.button>
                </div>

                {/* Engagement Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Like/Dislike group */}
                  <div className="flex items-center overflow-hidden rounded-full bg-[#1a1a1a]">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setLiked(!liked)
                        if (disliked) setDisliked(false)
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                        liked ? 'text-xtube-red' : 'text-white/80 hover:text-white'
                      }`}
                      aria-label="Like"
                    >
                      <ThumbsUp className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
                      <span>{formatViews(128000)}</span>
                    </motion.button>
                    <div className="h-6 w-px bg-white/10" />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setDisliked(!disliked)
                        if (liked) setLiked(false)
                      }}
                      className={`flex items-center px-3 py-2 transition-colors ${
                        disliked ? 'text-xtube-red' : 'text-white/60 hover:text-white'
                      }`}
                      aria-label="Dislike"
                    >
                      <ThumbsDown className="h-4 w-4" fill={disliked ? 'currentColor' : 'none'} />
                    </motion.button>
                  </div>

                  {/* Share */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 rounded-full bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-[#252525] hover:text-white"
                    aria-label="Share"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </motion.button>

                  {/* Save */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setBookmarked(!bookmarked)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      bookmarked
                        ? 'bg-xtube-red/20 text-xtube-red'
                        : 'bg-[#1a1a1a] text-white/80 hover:bg-[#252525] hover:text-white'
                    }`}
                    aria-label={bookmarked ? 'Remove bookmark' : 'Save'}
                  >
                    <Bookmark className="h-4 w-4" fill={bookmarked ? 'currentColor' : 'none'} />
                    <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
                  </motion.button>

                  {/* More */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMoreMenu((prev) => !prev)
                      }}
                      className="flex items-center justify-center rounded-full bg-[#1a1a1a] p-2 text-white/80 transition-colors hover:bg-[#252525] hover:text-white"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </motion.button>
                    <AnimatePresence>
                      {showMoreMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-white/5 bg-[#111111]/95 py-1 shadow-2xl backdrop-blur-xl"
                        >
                          <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                            <Share2 className="h-4 w-4" /> Embed
                          </button>
                          <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                            <Share2 className="h-4 w-4" /> Report
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* ─── Description Box (Glassmorphism) ─────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 rounded-xl border border-white/5 bg-[#111111]/80 p-3 backdrop-blur-xl sm:p-4"
              >
                {/* Views + Date */}
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-white/50" />
                    {formatViews(video.views)} views
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/60">{formatRelativeDate(video.createdAt)}</span>
                  {video.isHd && (
                    <>
                      <span className="text-white/30">•</span>
                      <span className="rounded bg-xtube-red px-1.5 py-0.5 text-[10px] font-bold text-white">
                        HD
                      </span>
                    </>
                  )}
                </div>

                {/* Hashtags */}
                {hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium text-xtube-red hover:text-xtube-red-hover cursor-pointer transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description text */}
                <div className="mt-2">
                  <div
                    className={`text-sm leading-relaxed text-white/70 ${
                      !showFullDescription ? 'line-clamp-3' : ''
                    }`}
                  >
                    {descriptionWithoutTags || video.description}
                  </div>
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 text-xs font-semibold text-white/50 transition-colors hover:text-xtube-red sm:text-sm"
                  >
                    {showFullDescription ? 'Show less' : '...more'}
                  </button>
                </div>
              </motion.div>

              {/* ─── Comments Section ─────────────────────────────────── */}
              <div className="mt-6">
                <Comments
                  videoId={video.id}
                  comments={comments}
                  onAddComment={onAddComment}
                  loading={false}
                />
              </div>
            </div>
          </div>

          {/* ─── RIGHT SIDEBAR: Up Next ───────────────────────────────── */}
          <div className={`${theaterMode ? 'mt-6' : 'lg:w-[360px] xl:w-[400px]'} flex-shrink-0 px-1 sm:px-2 lg:px-0`}>
            {/* Up Next header + Autoplay toggle */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-white sm:text-lg">Up Next</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Autoplay</span>
                <button
                  onClick={() => setAutoPlayNext(!autoPlayNext)}
                  className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                    autoPlayNext ? 'bg-xtube-red' : 'bg-white/20'
                  }`}
                  aria-label={autoPlayNext ? 'Disable autoplay' : 'Enable autoplay'}
                >
                  <motion.div
                    animate={{ x: autoPlayNext ? 16 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>
            </div>

            {/* Related videos list */}
            <div className="space-y-2 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-1 custom-scrollbar">
              {relatedVideos.map((rv, idx) => (
                <motion.div
                  key={rv.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  onClick={() => navigateToVideo(rv.id)}
                  className="group flex cursor-pointer gap-3 rounded-lg p-1.5 transition-all duration-200 hover:bg-white/5"
                  role="button"
                  tabIndex={0}
                  aria-label={`Watch ${rv.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigateToVideo(rv.id)
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-[68px] w-[120px] flex-shrink-0 overflow-hidden rounded-lg bg-[#111111] sm:h-[94px] sm:w-[168px]">
                    <img
                      src={rv.thumbnail}
                      alt={rv.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Duration badge */}
                    <div className="absolute bottom-1.5 right-1.5">
                      <span className="flex items-center gap-0.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        <Clock className="h-2.5 w-2.5" />
                        {rv.duration}
                      </span>
                    </div>
                    {/* Hover play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-xtube-red/90 shadow-lg">
                        <Play className="h-4 w-4 text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    {/* Cinematic hover glow */}
                    <div className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 shadow-[inset_0_0_20px_rgba(229,9,20,0.15)]" />
                  </div>

                  {/* Video info */}
                  <div className="min-w-0 flex-1 py-0.5">
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-white transition-colors duration-200 group-hover:text-xtube-red">
                      {rv.title}
                    </h3>
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-xs text-white/40 truncate">{rv.category} Films</p>
                      <div className="flex items-center gap-1.5 text-xs text-white/40">
                        <span className="flex items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          {formatViews(rv.views)} views
                        </span>
                        <span>•</span>
                        <span>3 days ago</span>
                      </div>
                    </div>
                  </div>

                  {/* More options */}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 self-start p-1 text-white/0 transition-colors group-hover:text-white/40 hover:text-white"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
