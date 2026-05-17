'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Film,
  Upload,
  CloudUpload,
  Play,
  Pause,
  Volume2,
  Settings,
  Maximize,
  Trash2,
  CheckCircle2,
  Link,
  Image as ImageIcon,
  Shield,
  Clock,
  ChevronDown,
  RefreshCw,
  Eye,
  TrendingUp,
  Radio,
  AlertCircle,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'

interface FileInfo {
  name: string
  resolution: string
  size: string
  duration: string
}

// ─── Thumbnail Gradients ─────────────────────────────────────────────────────

const thumbnailGradients = [
  'from-emerald-900/60 via-teal-800/40 to-cyan-900/30',
  'from-blue-900/60 via-indigo-800/40 to-violet-900/30',
  'from-amber-900/60 via-orange-800/40 to-yellow-900/30',
  'from-rose-900/60 via-pink-800/40 to-red-900/30',
  'from-cyan-900/60 via-sky-800/40 to-blue-900/30',
  'from-violet-900/60 via-purple-800/40 to-fuchsia-900/30',
  'from-lime-900/60 via-green-800/40 to-emerald-900/30',
  'from-orange-900/60 via-red-800/40 to-amber-900/30',
  'from-indigo-900/60 via-blue-800/40 to-sky-900/30',
  'from-pink-900/60 via-rose-800/40 to-fuchsia-900/30',
]

const thumbnailTimecodes = [
  '00:03', '00:08', '00:14', '00:22', '00:31',
  '00:42', '00:55', '01:05', '01:18', '01:25',
]

const premiumPlaceholderImages = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1500627869374-13cd993b1115?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=60',
]


// ─── Quality Options ─────────────────────────────────────────────────────────

const qualityOptions = [
  { value: 'auto', label: 'Auto', desc: 'Recommended' },
  { value: '1080p', label: '1080p', desc: '' },
  { value: '2k', label: '2K', desc: '' },
  { value: '4k', label: '4K', desc: '' },
]

const categoryOptions = [
  'Travel & Nature',
  'Action',
  'Sci-Fi',
  'Gaming',
  'Sports',
  'Documentary',
  'Adventure',
  'Romance',
  'Fantasy',
  'Music',
  'Comedy',
  'Horror',
]

// ─── Main Component ──────────────────────────────────────────────────────────

export function VideoUploadPage() {
  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 GB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('auto')
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)

  // File info
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploadedVideo, setUploadedVideo] = useState<any | null>(null)
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Array<{
    index: number
    timeSeconds: number
    url: string
  }>>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [quality, setQuality] = useState('1080p')
  const [duration, setDuration] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isTrending, setIsTrending] = useState(false)
  const [isLive, setIsLive] = useState(false)

  // Custom local player states
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [durationVal, setDurationVal] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [videoObjectUrl, setVideoObjectUrl] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Browser Metadata Extraction & Dynamic Client-Side 10 Thumbnail Extraction ───

  const processSelectedFile = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setErrorMessage(null)
    setUploadStage('idle')
    setUploadProgress(0)

    // Pre-fill Title with file name (without extension)
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))

    // Setup local object URL for preview player
    const localUrl = URL.createObjectURL(selectedFile)
    setVideoObjectUrl(localUrl)
    setGeneratedThumbnails([])

    // Load video element in background to extract duration, resolution & 10 real thumbnails
    const tempVideo = document.createElement('video')
    tempVideo.preload = 'metadata'
    tempVideo.src = localUrl
    tempVideo.muted = true
    tempVideo.playsInline = true

    tempVideo.onloadedmetadata = () => {
      const dur = tempVideo.duration || 0
      const width = tempVideo.videoWidth || 1920
      const height = tempVideo.videoHeight || 1080

      const mins = Math.floor(dur / 60)
      const secs = Math.floor(dur % 60)
      const formattedDur = `${mins}:${secs.toString().padStart(2, '0')}`

      setDuration(formattedDur)
      setDurationVal(dur)

      let detectedQuality = '1080p'
      if (width >= 3840 || height >= 2160) detectedQuality = '4k'
      else if (width >= 2560 || height >= 1440) detectedQuality = '2k'
      else if (width >= 1280 || height >= 720) detectedQuality = '1080p'
      else detectedQuality = 'auto'

      setQuality(detectedQuality)
      setSelectedQuality(detectedQuality)

      setFileInfo({
        name: selectedFile.name,
        resolution: width && height ? `${width} × ${height}` : 'HD (1080p)',
        size: (selectedFile.size / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        duration: formattedDur,
      })

      // Generate 10 local thumbnails at equal intervals from duration
      const interval = dur / 11
      const localThumbs: Array<{ index: number; timeSeconds: number; url: string }> = []
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 180
      const ctx = canvas.getContext('2d')

      let index = 0
      const captureFrame = () => {
        if (index < 10) {
          const time = (index + 1) * interval
          tempVideo.currentTime = time

          const handleSeeked = () => {
            if (ctx) {
              ctx.drawImage(tempVideo, 0, 0, 320, 180)
              localThumbs.push({
                index,
                timeSeconds: Math.floor(time),
                url: canvas.toDataURL('image/jpeg', 0.8)
              })
            }
            tempVideo.removeEventListener('seeked', handleSeeked)
            index++
            captureFrame()
          }

          tempVideo.addEventListener('seeked', handleSeeked)
        } else {
          setGeneratedThumbnails(localThumbs)
          setSelectedThumbnail(0)
          // Graceful cleanup of background video
          try {
            tempVideo.src = ''
            tempVideo.load()
          } catch (e) {}
        }
      }
      captureFrame()
    }
  }, [])

  // ─── Chunked Upload Submission ─────────────────────────────────────────

  const handleUploadSubmit = useCallback(async () => {
    if (!file) {
      setErrorMessage('Please select a video file first.')
      return
    }

    try {
      setUploadStage('uploading')
      setUploadProgress(0)
      setUploadedSize('0 GB')
      setUploadSpeed('0 MB/s')
      setErrorMessage(null)

      const startTime = Date.now()

      // 1. Initialize upload session
      const initRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'init',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'video/mp4',
        }),
      })

      if (!initRes.ok) {
        throw new Error(`Session initialization failed: ${await initRes.text()}`)
      }

      const { sessionId, chunkSize, totalChunks } = await initRes.json()

      // 2. Upload chunks in loop
      let uploadedBytes = 0

      for (let i = 0; i < totalChunks; i++) {
        const chunkStart = i * chunkSize
        const chunkEnd = Math.min(file.size, (i + 1) * chunkSize)
        const chunkSlice = file.slice(chunkStart, chunkEnd)
        const currentChunkSize = chunkEnd - chunkStart

        const chunkStartTime = Date.now()

        // Upload chunk with retries
        let retries = 0
        const maxRetries = 3
        let chunkUploaded = false

        while (!chunkUploaded && retries < maxRetries) {
          try {
            const res = await fetch(`/api/upload?chunkIndex=${i}&sessionId=${sessionId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/octet-stream' },
              body: chunkSlice,
            })

            if (!res.ok) throw new Error(`Chunk ${i} failed`)
            chunkUploaded = true
          } catch (err) {
            retries++
            if (retries >= maxRetries) throw err
            await new Promise((r) => setTimeout(r, 500 * retries))
          }
        }

        uploadedBytes += currentChunkSize

        // Calculate Speed & Stats
        const elapsedSecs = (Date.now() - startTime) / 1000
        const chunkElapsedSecs = (Date.now() - chunkStartTime) / 1000
        const progressPercent = Math.min(((i + 1) / totalChunks) * 100, 100)
        setUploadProgress(progressPercent)

        setUploadedSize(`${(uploadedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`)

        const speedMBs = (currentChunkSize / (1024 * 1024)) / (chunkElapsedSecs || 0.1)
        setUploadSpeed(`${speedMBs.toFixed(1)} MB/s`)

        const remainingBytes = file.size - uploadedBytes
        const remainingSecs = remainingBytes / ((uploadedBytes / elapsedSecs) || 1)
        if (remainingSecs > 60) {
          setUploadRemaining(`${Math.ceil(remainingSecs / 60)} mins left`)
        } else {
          setUploadRemaining(`${Math.ceil(remainingSecs)} secs left`)
        }
      }

      // 3. Mark session as complete & send form details
      setUploadStage('processing')
      const completeRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          sessionId,
          title,
          description,
          category: category || 'Travel & Nature',
          duration,
          isHd: quality === '1080p' || quality === '2k' || quality === '4k',
        }),
      })

      if (!completeRes.ok) {
        throw new Error(`Assembling video failed: ${await completeRes.text()}`)
      }

      const { video } = await completeRes.json()
      setUploadedVideo(video)

      // 4. Save chosen custom local base64 thumbnail into the Supabase database in real-time
      if (generatedThumbnails[selectedThumbnail]) {
        try {
          const selectedUrl = generatedThumbnails[selectedThumbnail].url
          const res = await fetch(`/api/videos/${video.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thumbnail: selectedUrl }),
          })
          if (res.ok) {
            const data = await res.json()
            setUploadedVideo(data.video)
          }
        } catch (err) {
          console.error('Failed to update selected thumbnail in Supabase:', err)
        }
      }

      setUploadStage('success')
    } catch (err: any) {
      console.error('Upload error:', err)
      setErrorMessage(err.message || 'An error occurred during upload.')
      setUploadStage('idle')
    }
  }, [file, title, description, category, duration, quality, generatedThumbnails, selectedThumbnail])

  // ─── Select Thumbnail ──────────────────────────────────────────────────

  const handleSelectThumbnail = useCallback((index: number) => {
    setSelectedThumbnail(index)
  }, [])

  // ─── Player Controls ───────────────────────────────────────────────────

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }, [])

  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const val = parseFloat(e.target.value)
    videoRef.current.currentTime = val
    setCurrentTime(val)
  }, [])

  const handleFullscreen = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }, [])

  // ─── Drag & Drop ───────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      const files = e.dataTransfer.files
      if (files.length > 0) processSelectedFile(files[0])
    },
    [processSelectedFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) processSelectedFile(files[0])
    },
    [processSelectedFile]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleResetUpload = useCallback(() => {
    if (videoObjectUrl) {
      URL.revokeObjectURL(videoObjectUrl)
    }
    setVideoObjectUrl('')
    setUploadStage('idle')
    setUploadProgress(0)
    setFileInfo(null)
    setFile(null)
    setUploadedVideo(null)
    setGeneratedThumbnails([])
    setErrorMessage(null)
    setTitle('')
    setDescription('')
    setCategory('')
    setQuality('1080p')
    setDuration('')
    setIsFeatured(false)
    setIsTrending(false)
    setIsLive(false)
    setSelectedThumbnail(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [videoObjectUrl])

  const handleClearForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setCategory('')
    setQuality('1080p')
    setDuration('')
    setIsFeatured(false)
    setIsTrending(false)
    setIsLive(false)
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="w-full p-3 md:p-4 lg:p-6">
        {/* ── Header Section ── */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">Upload Video</h1>
              <p className="mt-1 text-sm text-white/40">Upload a video — preview is auto-generated</p>
            </div>
          </div>

          {/* Tab */}
          <div className="mt-4 flex items-center gap-0 border-b border-white/5">
            <button className="relative flex items-center gap-2 px-4 pb-3 text-sm font-semibold text-white">
              <Film className="h-4 w-4 text-xtube-red" />
              Video
              <motion.div
                layoutId="upload-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-xtube-red"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 gap-5 lg:gap-6 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] w-full">
          {/* ═══════════════════════════════════════════════════════════════════
              LEFT COLUMN — Upload & Interactive Preview
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4 max-w-2xl lg:max-w-none mx-auto w-full">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-xtube-red">1.</span>
                <h2 className="text-lg font-bold text-white">Upload Video</h2>
                <CloudUpload className="h-5 w-5 text-xtube-red" />
              </div>
              {fileInfo && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBrowseClick}
                    className="text-sm font-medium text-xtube-red transition-colors hover:text-xtube-red-hover"
                  >
                    Change File
                  </button>
                  <button
                    onClick={handleResetUpload}
                    className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-red-400"
                    aria-label="Delete file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ── File Info Card ── */}
            <AnimatePresence mode="wait">
              {fileInfo && (
                <motion.div
                  key="file-info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3 p-3 lg:p-4">
                    {/* Thumbnail Preview */}
                    <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg">
                      {generatedThumbnails.length > 0 ? (
                        <img src={generatedThumbnails[selectedThumbnail].url} className="h-full w-full object-cover" alt="Active Frame" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 via-teal-800/40 to-cyan-900/30" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <Film className="h-6 w-6 text-white/40" />
                      </div>
                      <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-semibold text-white">
                        {fileInfo.duration}
                      </div>
                    </div>

                    {/* File Details */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{fileInfo.name}</p>
                      <p className="mt-0.5 text-xs text-white/40">
                        {fileInfo.resolution} &bull; {fileInfo.size} &bull; {fileInfo.duration}
                      </p>
                    </div>

                    {/* Success Indicator */}
                    {uploadStage === 'success' && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                    )}
                    {uploadStage === 'processing' && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                      </div>
                    )}
                    {(uploadStage === 'uploading' || uploadStage === 'idle') && fileInfo && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-xtube-red/10">
                        <Upload className="h-4 w-4 text-xtube-red animate-pulse" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Custom Premium Local Video Player Preview ── */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 backdrop-blur-xl">
              {file && videoObjectUrl ? (
                <div className="relative aspect-video bg-black group/player">
                  <video
                    ref={videoRef}
                    src={videoObjectUrl}
                    className="h-full w-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    muted={isMuted}
                    playsInline
                  />
                  {/* Controls overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 opacity-0 group-hover/player:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="rounded-full bg-xtube-red/90 p-2 text-white hover:bg-xtube-red transition-all"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
                        </button>
                        
                        <button
                          onClick={toggleMute}
                          className="text-white/80 hover:text-white transition-colors"
                        >
                          <Volume2 className={`h-5 w-5 ${isMuted ? 'text-xtube-red' : ''}`} />
                        </button>
                        
                        <span className="text-xs text-white/70">
                          {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {duration || '0:00'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleFullscreen}
                          className="text-white/70 transition-colors hover:text-white"
                        >
                          <Maximize className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Time slider */}
                    <input
                      type="range"
                      min={0}
                      max={durationVal || 100}
                      value={currentTime}
                      onChange={handleSeekChange}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-xtube-red focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-[#0c0c0e] to-[#141416] p-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <Film className="h-6 w-6 text-white/30" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/70">No Video Loaded</h3>
                  <p className="text-xs text-white/30 max-w-xs mt-1">Select a video file to generate scenic mock thumbnails and see the preview player instantly.</p>
                </div>
              )}
            </div>

            {/* ── Drag & Drop Area (shown when idle and no file selected) ── */}
            <AnimatePresence>
              {uploadStage === 'idle' && !file && (
                <motion.div
                  key="upload-area"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                  className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed backdrop-blur-xl transition-all duration-200 ${
                    isDragOver
                      ? 'border-xtube-red bg-xtube-red/5 shadow-[0_0_20px_rgba(229,9,20,0.15)]'
                      : 'border-white/10 bg-[#111111]/60 hover:border-white/20 hover:bg-[#111111]/80'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/mov,video/webm,video/x-mpegURL,application/x-mpegURL"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <motion.div
                    animate={isDragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-xtube-red/10"
                  >
                    <CloudUpload className="h-7 w-7 text-xtube-red" />
                  </motion.div>

                  <div className="text-center">
                    <p className="text-base font-semibold text-white">Drag &amp; drop your video here</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      or{' '}
                      <span className="cursor-pointer text-xtube-red underline underline-offset-2 hover:text-xtube-red-hover">
                        browse files
                      </span>
                    </p>
                  </div>

                  <p className="text-[10px] text-white/25">
                    MP4, MOV, WebM, HLS &bull; Max 5GB
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Paste URL Buttons ── */}
            {uploadStage === 'idle' && !file && (
              <div className="flex items-center gap-3">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111111]/60 px-3 py-2 text-sm font-medium text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-[#111111]/80 hover:text-white">
                  <Link className="h-4 w-4" />
                  Paste Video URL
                </button>
                <button
                  onClick={handleBrowseClick}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111111]/60 px-3 py-2 text-sm font-medium text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-[#111111]/80 hover:text-white"
                >
                  <Upload className="h-4 w-4" />
                  Manual Upload
                </button>
              </div>
            )}

            {/* ── Upload Progress Panel ── */}
            <AnimatePresence>
              {(uploadStage === 'uploading' || uploadStage === 'processing') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 p-3 lg:p-4 backdrop-blur-xl"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {uploadStage === 'processing' ? 'Processing video...' : 'Uploading video to server...'}
                    </span>
                    <span className="text-sm font-bold text-xtube-red">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative mb-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-xtube-red to-red-500"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="absolute left-0 top-0 h-full rounded-full bg-xtube-red blur-sm opacity-50"
                    />
                  </div>

                  {uploadStage === 'uploading' ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-white/30">Uploaded Size</p>
                        <p className="text-xs font-semibold text-white">
                          {uploadedSize} / {fileInfo?.size || '5GB'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30">Speed</p>
                        <p className="text-xs font-semibold text-white">{uploadSpeed}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30">Time Left</p>
                        <p className="text-xs font-semibold text-white">{uploadRemaining}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                      <span>Saving to Supabase real-time database and finalizing...</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Quality Options ── */}
            {uploadStage === 'success' && (
              <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 p-3 lg:p-4 backdrop-blur-xl">
                <div className="mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-white/40" />
                  <span className="text-sm font-semibold text-white">Video Quality</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {qualityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedQuality(opt.value)}
                      className={`relative rounded-lg border px-3 py-2 text-center transition-all ${
                        selectedQuality === opt.value
                          ? 'border-xtube-red/40 bg-xtube-red/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-semibold">{opt.label}</span>
                      {opt.desc && (
                        <span className="block sm:inline sm:ml-1 text-[8px] text-xtube-red font-medium">{opt.desc}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Thumbnail Section (Always Visible & Responsive) ── */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-white/40" />
                  <span className="text-sm font-semibold text-white">Select Thumbnail Poster (10 Options)</span>
                </div>
                {generatedThumbnails.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    Auto-extracted from Video
                  </span>
                )}
              </div>

              {/* Grid of 10 Thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {generatedThumbnails.length > 0 ? (
                  generatedThumbnails.map((thumb) => (
                    <motion.button
                      key={thumb.index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectThumbnail(thumb.index)}
                      className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                        selectedThumbnail === thumb.index
                          ? 'border-xtube-red shadow-[0_0_12px_rgba(229,9,20,0.4)]'
                          : 'border-transparent hover:border-white/20'
                      }`}
                    >
                      <img
                        src={thumb.url}
                        alt={`Thumbnail ${thumb.index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[8px] font-semibold text-white">
                        {Math.floor(thumb.timeSeconds / 60)}:{(thumb.timeSeconds % 60).toString().padStart(2, '0')}
                      </div>
                      {selectedThumbnail === thumb.index && (
                        <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-xtube-red shadow-md">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </motion.button>
                  ))
                ) : (
                  // Default mock premium scenic thumbnails
                  Array.from({ length: 10 }).map((_, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedThumbnail(i)}
                      className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                        selectedThumbnail === i
                          ? 'border-xtube-red shadow-[0_0_12px_rgba(229,9,20,0.4)]'
                          : 'border-transparent hover:border-white/20'
                      }`}
                    >
                      <img
                        src={premiumPlaceholderImages[i]}
                        alt={`Scenic Frame ${i + 1}`}
                        className="h-full w-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
                      />
                      <div className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[8px] font-semibold text-white/70">
                        {thumbnailTimecodes[i]}
                      </div>
                      {selectedThumbnail === i && (
                        <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-xtube-red shadow-md">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </motion.button>
                  ))
                )}
              </div>

              <div className="mt-3 flex items-start gap-2 text-white/40">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed">
                  Select your poster thumbnail from the 10 options. The chosen thumbnail is automatically uploaded to Supabase in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              RIGHT COLUMN — Video Details
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4 max-w-2xl lg:max-w-none mx-auto w-full">
            {/* Section Header */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-xtube-red">2.</span>
              <h2 className="text-lg font-bold text-white">Video Details</h2>
              <PencilIcon className="h-5 w-5 text-xtube-red" />
            </div>

            {/* ── Form Card ── */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 backdrop-blur-xl">
              <div className="space-y-4 p-3 lg:p-4">
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">
                      Title <span className="text-xtube-red">*</span>
                    </label>
                    <span className="text-xs text-white/30">
                      {title.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    placeholder="Enter video title"
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-xtube-red/40 focus:ring-1 focus:ring-xtube-red/20"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Description</label>
                    <span className="text-xs text-white/30">
                      {description.length}/500
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                    placeholder="Describe your video..."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-white/10 bg-[#0a0a0a] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-xtube-red/40 focus:ring-1 focus:ring-xtube-red/20"
                  />
                </div>

                {/* Category + Quality */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white/70 focus:ring-xtube-red/20 [&_svg]:text-white/30">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white focus:bg-white/5 focus:text-white">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Quality</label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger className="w-full rounded-lg border-white/10 bg-[#0a0a0a] text-sm text-white/70 focus:ring-xtube-red/20 [&_svg]:text-white/30">
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="auto" className="text-white focus:bg-white/5 focus:text-white">Auto</SelectItem>
                        <SelectItem value="1080p" className="text-white focus:bg-white/5 focus:text-white">1080p</SelectItem>
                        <SelectItem value="2k" className="text-white focus:bg-white/5 focus:text-white">2K</SelectItem>
                        <SelectItem value="4k" className="text-white focus:bg-white/5 focus:text-white">4K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Duration</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Auto-generated"
                      readOnly={!!fileInfo}
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-xtube-red/40 focus:ring-1 focus:ring-xtube-red/20 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 rounded-lg border border-white/5 bg-[#0a0a0a]/50 p-3 lg:p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={isFeatured}
                      onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
                      className="border-white/20 data-[state=checked]:bg-xtube-red data-[state=checked]:border-xtube-red"
                    />
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-white/30" />
                      <span className="text-sm text-white/70">Featured</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={isTrending}
                      onCheckedChange={(checked) => setIsTrending(checked as boolean)}
                      className="border-white/20 data-[state=checked]:bg-xtube-red data-[state=checked]:border-xtube-red"
                    />
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-white/30" />
                      <span className="text-sm text-white/70">Trending</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={isLive}
                      onCheckedChange={(checked) => setIsLive(checked as boolean)}
                      className="border-white/20 data-[state=checked]:bg-xtube-red data-[state=checked]:border-xtube-red"
                    />
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-white/30" />
                      <span className="text-sm text-white/70">Live</span>
                    </div>
                  </label>
                </div>

                {/* Error Message Display */}
                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={uploadStage === 'success' ? handleResetUpload : handleClearForm}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/60 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {uploadStage === 'success' ? 'Reset' : 'Clear'}
                  </motion.button>
                  {uploadStage === 'success' ? (
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(16,185,129,0.4)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleResetUpload}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Upload Another Video
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={uploadStage === 'idle' && file ? { scale: 1.02, boxShadow: '0 0 25px rgba(229,9,20,0.4)' } : {}}
                      whileTap={uploadStage === 'idle' && file ? { scale: 0.98 } : {}}
                      onClick={handleUploadSubmit}
                      disabled={uploadStage !== 'idle' || !file}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-all ${
                        uploadStage !== 'idle' || !file
                          ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed shadow-none'
                          : 'bg-xtube-red hover:bg-xtube-red-hover'
                      }`}
                    >
                      {uploadStage === 'uploading' && (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Uploading ({Math.round(uploadProgress)}%)</span>
                        </>
                      )}
                      {uploadStage === 'processing' && (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Processing...</span>
                        </>
                      )}
                      {uploadStage === 'idle' && (
                        <>
                          <Upload className="h-4 w-4" />
                           <span>Upload Video</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Legal Notice ── */}
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/50 backdrop-blur-xl">
              <div className="flex items-start gap-3 p-3 lg:p-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-xtube-red/10">
                  <Shield className="h-4 w-4 text-xtube-red" />
                </div>
                <p className="text-[11px] leading-relaxed text-white/35">
                  By uploading, you confirm that you own the rights to this content and agree to our{' '}
                  <span className="cursor-pointer text-xtube-red hover:text-xtube-red-hover">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="cursor-pointer text-xtube-red hover:text-xtube-red-hover">
                    Community Guidelines
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Pencil Icon ─────────────────────────────────────────────────────────────

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}
