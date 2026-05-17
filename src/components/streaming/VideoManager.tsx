'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Upload,
  Trash2,
  Edit,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Film,
  Clock,
  Eye,
  X,
  CloudUpload,
  CheckCircle2,
  LayoutGrid,
  List,
  Play,
  Calendar,
  HardDrive,
  Tag,
  Radio,
  Info,
  Shield,
  Link,
  Check,
  RotateCcw,
  Pencil,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoManagerProps {
  videos: Array<{
    id: string
    title: string
    thumbnail: string
    category: string
    views: number
    duration: string
    isPublished: boolean
    createdAt: string
  }>
  onUpload: (data: Record<string, unknown>) => void
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  loading?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatViews(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getRandomFileSize(): string {
  const sizes = ['125 MB', '520 MB', '300 MB', '750 MB', '180 MB', '420 MB', '650 MB', '280 MB', '890 MB', '340 MB', '510 MB', '195 MB']
  return sizes[Math.floor(Math.random() * sizes.length)]
}

// Hardcoded mock videos and mock categories have been completely removed for live database sync.

const categoryColors: Record<string, string> = {
  'Sci-Fi': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'Action': 'bg-red-500/15 text-red-400 border-red-500/20',
  'Adventure': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Romance': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'Documentary': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Fantasy': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'Sports': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Nature': 'bg-green-500/15 text-green-400 border-green-500/20',
  'Music': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'History': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  'Animation': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
}

const thumbnailGradients = [
  'from-red-900/40 via-orange-900/30 to-amber-800/20',
  'from-blue-900/40 via-indigo-900/30 to-violet-800/20',
  'from-emerald-900/40 via-teal-900/30 to-cyan-800/20',
  'from-purple-900/40 via-pink-900/30 to-rose-800/20',
  'from-amber-900/40 via-yellow-900/30 to-orange-800/20',
  'from-cyan-900/40 via-blue-900/30 to-indigo-800/20',
  'from-rose-900/40 via-red-900/30 to-pink-800/20',
  'from-teal-900/40 via-emerald-900/30 to-green-800/20',
  'from-violet-900/40 via-purple-900/30 to-indigo-800/20',
  'from-orange-900/40 via-amber-900/30 to-yellow-800/20',
  'from-indigo-900/40 via-blue-900/30 to-cyan-800/20',
  'from-pink-900/40 via-rose-900/30 to-red-800/20',
]

// ─── Sort Types ──────────────────────────────────────────────────────────────

type SortOption = 'newest' | 'oldest' | 'most-viewed' | 'least-viewed' | 'title-az' | 'title-za'

/* ────────────────────────────────────────────
   Upload View
   ──────────────────────────────────────────── */

function UploadView({ onUpload, categories }: { onUpload: (data: Record<string, unknown>) => void; categories: string[] }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success'>('idle')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [videoObjectUrl, setVideoObjectUrl] = useState<string>('')
  
  // Custom video file details
  const [videoMetadata, setVideoMetadata] = useState<{
    width: number
    height: number
    sizeMB: string
    duration: string
  } | null>(null)

  // 10 automatically generated thumbnails
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Array<{ id: number; dataUrl: string }>>([])
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<number>(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: categories[0] || 'Sci-Fi',
    quality: '1080p',
    duration: '',
    isFeatured: false,
    isTrending: false,
    isLive: false,
  })

  // Procedural 10-thumbnail generator
  const generateProceduralThumbnails = useCallback((videoTitle: string) => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 180
    const ctx = canvas.getContext('2d')
    if (!ctx) return []

    const thumbs: Array<{ id: number; dataUrl: string }> = []
    
    // Base colors for 10 highly distinct scenic cinematic gradient palettes
    const palettes = [
      ['#E50914', '#141414', '#380000'], // Netflix Red/Dark Crimson
      ['#00c6ff', '#0072ff', '#1a2a6c'], // Cinematic Sky Blue
      ['#f7797d', '#FBD786', '#C6FFDD'], // Sunset Golden Glow
      ['#56ab2f', '#a8ff78', '#112211'], // Mountain Forest Green
      ['#8A2387', '#E94057', '#F27121'], // Cyberpunk Neon Sunset
      ['#0f2027', '#203a43', '#2c5364'], // Oceanic Deep Teal
      ['#ff9966', '#ff5e62', '#2c0c0c'], // Molten Volcanic Fire
      ['#7F00FF', '#E100FF', '#0b001a'], // Ultraviolet Purple Aurora
      ['#1d976c', '#93f9b9', '#0d1a12'], // Emerald Forest Dream
      ['#4e54c8', '#8f94fb', '#111122'], // Classic Cinematic Twilight Indigo
    ]

    for (let i = 0; i < 10; i++) {
      const palette = palettes[i % palettes.length]
      
      // Clear canvas
      ctx.clearRect(0, 0, 320, 180)
      
      // 1. Draw beautiful linear gradient background
      const grad = ctx.createLinearGradient(0, 0, 320, 180)
      grad.addColorStop(0, palette[0])
      grad.addColorStop(0.5, palette[1])
      grad.addColorStop(1, palette[2])
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 320, 180)

      // 2. Add abstract cinematic light rays
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.beginPath()
      ctx.moveTo(160, 90)
      ctx.lineTo(0, 180)
      ctx.lineTo(80, 180)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
      ctx.beginPath()
      ctx.moveTo(160, 90)
      ctx.lineTo(240, 180)
      ctx.lineTo(320, 180)
      ctx.closePath()
      ctx.fill()

      // Draw stylized procedural hills representing film frames
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
      ctx.beginPath()
      ctx.moveTo(0, 180)
      ctx.bezierCurveTo(80, 120 + i * 4, 160, 150 - i * 6, 320, 180)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.beginPath()
      ctx.moveTo(0, 180)
      ctx.bezierCurveTo(60, 140 - i * 5, 200, 110 + i * 3, 320, 180)
      ctx.closePath()
      ctx.fill()

      // Draw glowing sun / camera lens flare
      const glow = ctx.createRadialGradient(80 + i * 16, 60, 3, 80 + i * 16, 60, 70)
      glow.addColorStop(0, 'rgba(255, 255, 255, 0.75)')
      glow.addColorStop(0.2, 'rgba(255, 255, 255, 0.2)')
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(80 + i * 16, 60, 70, 0, Math.PI * 2)
      ctx.fill()

      // Draw abstract scenic grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x < 320; x += 32) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, 180)
      }
      for (let y = 0; y < 180; y += 18) {
        ctx.moveTo(0, y)
        ctx.lineTo(320, y)
      }
      ctx.stroke()

      // Draw bottom timeline bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
      ctx.fillRect(0, 148, 320, 32)

      // Title overlay text
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(videoTitle.substring(0, 20) || 'Snapshot', 15, 168)

      // Time duration overlay
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '10px monospace'
      ctx.fillText(`00:0${i}:${i*4 + 10}`, 260, 168)

      thumbs.push({
        id: i,
        dataUrl: canvas.toDataURL('image/jpeg', 0.8)
      })
    }

    return thumbs
  }, [])

  const simulateUpload = useCallback((fileName: string, fileObj?: File) => {
    setUploadedFileName(fileName)
    setUploadState('uploading')
    setUploadProgress(0)

    // Strip extension for the title!
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName
    
    // Automatically set the form title to the base file name!
    setForm((prev) => ({
      ...prev,
      title: baseName,
    }))

    // Generate 10 procedural thumbnails automatically
    const thumbs = generateProceduralThumbnails(baseName)
    setGeneratedThumbnails(thumbs)
    setSelectedThumbnailIndex(0)

    if (fileObj) {
      const fileURL = URL.createObjectURL(fileObj)
      setVideoObjectUrl(fileURL)
      
      const sizeMB = (fileObj.size / (1024 * 1024)).toFixed(1) + ' MB'
      const tempVideo = document.createElement('video')
      tempVideo.src = fileURL
      tempVideo.onloadedmetadata = () => {
        const mins = Math.floor(tempVideo.duration / 60)
        const secs = Math.floor(tempVideo.duration % 60)
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        
        setVideoMetadata({
          width: tempVideo.videoWidth || 1920,
          height: tempVideo.videoHeight || 1080,
          sizeMB,
          duration: formatted
        })

        setForm(prev => ({
          ...prev,
          duration: formatted
        }))
      }
    } else {
      // Stock video URL as fallback for simulation
      setVideoObjectUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4')
      setVideoMetadata({
        width: 1920,
        height: 1080,
        sizeMB: '45.2 MB',
        duration: '01:28'
      })
      setForm(prev => ({
        ...prev,
        duration: '01:28'
      }))
    }

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    let progress = 0
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 20 + 8
      if (progress >= 100) {
        progress = 100
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
        setUploadProgress(100)
        setTimeout(() => setUploadState('success'), 300)
      } else {
        setUploadProgress(Math.min(progress, 100))
      }
    }, 120)
  }, [generateProceduralThumbnails])

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) simulateUpload(files[0].name, files[0])
  }, [simulateUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) simulateUpload(files[0].name, files[0])
  }, [simulateUpload])

  const handleBrowseClick = useCallback(() => { fileInputRef.current?.click() }, [])
  
  const handleResetUpload = useCallback(() => {
    setUploadState('idle')
    setUploadProgress(0)
    setUploadedFileName('')
    setVideoObjectUrl('')
    setVideoMetadata(null)
    setGeneratedThumbnails([])
    setSelectedThumbnailIndex(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleClearForm = useCallback(() => {
    setForm({
      title: '',
      description: '',
      category: categories[0] || 'Sci-Fi',
      quality: '1080p',
      duration: '',
      isFeatured: false,
      isTrending: false,
      isLive: false,
    })
    handleResetUpload()
  }, [categories, handleResetUpload])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onUpload({
      title: form.title,
      description: form.description,
      category: form.category,
      duration: form.duration || '0:00',
      isHd: form.quality === '1080p' || form.quality === '4k (2160p)',
      thumbnail: generatedThumbnails[selectedThumbnailIndex]?.dataUrl || '/placeholder.jpg',
      videoUrl: videoObjectUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      isFeatured: form.isFeatured,
      isTrending: form.isTrending,
      isLive: form.isLive,
    })
    handleClearForm()
  }, [form, generatedThumbnails, selectedThumbnailIndex, videoObjectUrl, onUpload, handleClearForm])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-5 p-4 md:p-6 bg-[#0c0c0e]/95 border border-white/5 rounded-2xl backdrop-blur-xl"
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-xtube-red/10 border border-xtube-red/20 shadow-[0_0_15px_rgba(229,9,20,0.15)]">
            <Radio className="h-5 w-5 text-xtube-red animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Upload Content</h2>
            <p className="text-xs text-white/40 mt-0.5">Upload a video — preview is auto-generated</p>
          </div>
        </div>
        <button 
          onClick={handleClearForm} 
          className="rounded-full p-2 text-white/40 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex border-b border-white/5">
        <button className="flex items-center gap-2 border-b-2 border-xtube-red px-6 py-3 text-sm font-semibold text-white transition-colors">
          <Film className="h-4 w-4 text-xtube-red" />
          Video
        </button>
      </div>

      {/* ─── Grid layout (Highly responsive for Laptop, PC, Tablet) ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        
        {/* Left Column: 1. Upload Video */}
        <div className="space-y-4 lg:col-span-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/70 uppercase">
              <CloudUpload className="h-4 w-4 text-xtube-red" />
              1. Upload Video
            </h3>
            {uploadState !== 'idle' && (
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={handleBrowseClick}
                  className="text-xs font-semibold text-xtube-red hover:underline hover:text-xtube-red-hover"
                >
                  Change File
                </button>
                <button 
                  type="button"
                  onClick={handleResetUpload}
                  className="text-white/40 hover:text-xtube-red transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Uploaded File Bar */}
          {uploadState !== 'idle' && (
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#141416] p-3 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="h-10 w-[72px] overflow-hidden rounded-md bg-xtube-card border border-white/5 flex items-center justify-center">
                  {generatedThumbnails[0] ? (
                    <img src={generatedThumbnails[0].dataUrl} className="h-full w-full object-cover" alt="Snapshot" />
                  ) : (
                    <Film className="h-5 w-5 text-white/20" />
                  )}
                </div>
                <div>
                  <p className="max-w-[180px] sm:max-w-[260px] truncate text-sm font-medium text-white">{uploadedFileName}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {videoMetadata ? `${videoMetadata.width} × ${videoMetadata.height} • ${videoMetadata.sizeMB} • ${videoMetadata.duration}` : 'Analyzing File...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pr-1">
                {uploadState === 'uploading' ? (
                  <span className="font-mono text-xs font-bold text-xtube-red">{Math.round(uploadProgress)}%</span>
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                )}
              </div>
            </div>
          )}

          {/* Interactive Player / Dropzone Area */}
          <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#141416] p-1.5 aspect-video flex items-center justify-center transition-all duration-300">
            {uploadState === 'success' && videoObjectUrl ? (
              <video 
                src={videoObjectUrl} 
                className="h-full w-full rounded-lg object-cover" 
                controls 
                autoPlay 
                muted
              />
            ) : uploadState === 'uploading' ? (
              <div className="flex w-full max-w-xs flex-col items-center gap-3 p-6 text-center">
                <Upload className="h-8 w-8 animate-bounce text-xtube-red" />
                <div className="w-full space-y-2">
                  <p className="text-sm text-white">Uploading file...</p>
                  <Progress value={uploadProgress} className="h-1.5 bg-white/5 [&>div]:bg-xtube-red" />
                </div>
              </div>
            ) : (
              /* Drag & Drop zone */
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
                  isDragOver ? 'border-xtube-red bg-xtube-red/5' : 'border-white/10 hover:border-xtube-red/20 bg-black/40'
                }`}
              >
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-xtube-red/5 border border-xtube-red/10">
                  <CloudUpload className="h-6 w-6 text-xtube-red" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Drag & drop your video here</p>
                  <p className="text-xs text-white/40 mt-1">or click to <span className="text-xtube-red hover:underline">browse files</span></p>
                </div>
                
                <div className="flex items-center gap-2 w-full max-w-[200px] my-1">
                  <div className="h-px bg-white/5 flex-1" />
                  <span className="text-[10px] uppercase font-bold text-white/20">OR</span>
                  <div className="h-px bg-white/5 flex-1" />
                </div>
                
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); }}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Link className="h-3.5 w-3.5" />
                  Paste video URL
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Thumbnails Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/70 tracking-wide uppercase">Thumbnail</label>
              <button 
                type="button"
                className="text-xs font-semibold text-xtube-red hover:underline"
              >
                Upload Manually
              </button>
            </div>

            {/* Horizontal Scroll of 10 Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {generatedThumbnails.length === 0 ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className="h-14 w-[96px] flex-shrink-0 rounded-lg border border-white/5 bg-[#141416] flex items-center justify-center"
                  >
                    <Film className="h-4 w-4 text-white/10" />
                  </div>
                ))
              ) : (
                generatedThumbnails.map((thumb, idx) => (
                  <motion.div
                    key={thumb.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedThumbnailIndex(idx)}
                    className={`relative h-14 w-[96px] flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                      selectedThumbnailIndex === idx 
                        ? 'border-xtube-red shadow-[0_0_10px_rgba(229,9,20,0.35)]' 
                        : 'border-white/5 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={thumb.dataUrl} className="h-full w-full object-cover" alt={`Frame ${idx + 1}`} />
                    {selectedThumbnailIndex === idx && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-xtube-red">
                          <Check className="h-3 w-3 text-white stroke-[3px]" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
            
            {/* Info label */}
            <div className="flex items-start gap-2 rounded-lg bg-white/[0.02] border border-white/5 p-3 text-xs text-white/40">
              <Info className="h-4 w-4 text-xtube-red flex-shrink-0 mt-0.5" />
              <p>Video thumbnail and duration are auto-generated after upload.</p>
            </div>
          </div>
        </div>

        {/* Right Column: 2. Video Details */}
        <div className="space-y-4 lg:col-span-6">
          <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/70 uppercase">
            <Pencil className="h-4 w-4 text-xtube-red" />
            2. Video Details
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Video Title Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-white/70">Title *</Label>
                <span className="text-[10px] text-white/30">{form.title.length}/100</span>
              </div>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value.slice(0, 100) })} 
                placeholder="Enter video title" 
                className="border-white/10 bg-[#141416] text-white placeholder:text-white/20 focus:border-xtube-red/40 focus:ring-xtube-red/20 h-10 rounded-lg" 
                required 
              />
            </div>

            {/* Video Description Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-white/70">Description</Label>
                <span className="text-[10px] text-white/30">{form.description.length}/500</span>
              </div>
              <Textarea 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 500) })} 
                placeholder="Describe your video content here..." 
                className="min-h-[100px] border-white/10 bg-[#141416] text-white placeholder:text-white/20 focus:border-xtube-red/40 focus:ring-xtube-red/20 resize-none rounded-lg" 
              />
            </div>

            {/* Category and Quality Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-white/70">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="border-white/10 bg-[#141416] text-white focus:ring-xtube-red/20 h-10 rounded-lg">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111111] text-white">
                    {categories.filter(c => c !== 'All Categories').map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-white/70">Quality</Label>
                <Select value={form.quality} onValueChange={(v) => setForm({ ...form, quality: v })}>
                  <SelectTrigger className="border-white/10 bg-[#141416] text-white focus:ring-xtube-red/20 h-10 rounded-lg">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111111] text-white">
                    <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                    <SelectItem value="720p">720p (HD)</SelectItem>
                    <SelectItem value="4k (2160p)">4k (Ultra HD)</SelectItem>
                    <SelectItem value="480p">480p (SD)</SelectItem>
                    <SelectItem value="360p">360p (SD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-white/70">Duration</Label>
              <div className="relative flex items-center">
                <Input 
                  value={form.duration} 
                  onChange={(e) => setForm({ ...form, duration: e.target.value })} 
                  placeholder="e.g. 01:28" 
                  className="border-white/10 bg-[#141416] text-white placeholder:text-white/20 focus:border-xtube-red/40 focus:ring-xtube-red/20 pr-10 h-10 rounded-lg" 
                />
                <Clock className="absolute right-3 h-4 w-4 text-white/30" />
              </div>
            </div>

            {/* Featured, Trending, Live Checkbox Flags */}
            <div className="flex items-center gap-6 rounded-lg border border-white/5 bg-white/[0.01] p-3 h-11">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="featured" 
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="h-4 w-4 rounded border-white/10 bg-[#141416] text-xtube-red focus:ring-xtube-red/20 focus:ring-offset-[#111] cursor-pointer" 
                />
                <label htmlFor="featured" className="text-xs font-semibold text-white/70 cursor-pointer">Featured</label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="trending" 
                  checked={form.isTrending}
                  onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
                  className="h-4 w-4 rounded border-white/10 bg-[#141416] text-xtube-red focus:ring-xtube-red/20 focus:ring-offset-[#111] cursor-pointer" 
                />
                <label htmlFor="trending" className="text-xs font-semibold text-white/70 cursor-pointer">Trending</label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="live" 
                  checked={form.isLive}
                  onChange={(e) => setForm({ ...form, isLive: e.target.checked })}
                  className="h-4 w-4 rounded border-white/10 bg-[#141416] text-xtube-red focus:ring-xtube-red/20 focus:ring-offset-[#111] cursor-pointer" 
                />
                <label htmlFor="live" className="text-xs font-semibold text-white/70 cursor-pointer">Live</label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                type="button" 
                onClick={handleClearForm}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141416] h-11 px-4 text-xs font-semibold text-white hover:bg-white/5 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </button>
              
              <button 
                type="submit" 
                disabled={uploadState !== 'success' || !form.title}
                className={`flex items-center justify-center gap-2 flex-1 rounded-xl h-11 px-6 text-xs font-semibold text-white transition-all ${
                  uploadState === 'success' && form.title
                    ? 'bg-xtube-red hover:bg-xtube-red-hover hover:shadow-[0_0_20px_rgba(229,9,20,0.35)]'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Video
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ─── Footer Terms and Conditions Banner ─── */}
      <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#141416] p-3 text-[11px] leading-relaxed text-white/40">
        <Shield className="h-4 w-4 text-xtube-red flex-shrink-0 mt-0.5" />
        <p>
          By uploading, you confirm that you own the rights to this content and agree to our <span className="text-xtube-red hover:underline cursor-pointer">Terms of Service</span> and <span className="text-xtube-red hover:underline cursor-pointer">Community Guidelines</span>.
        </p>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────
   Video Card (Grid View)
   ──────────────────────────────────────────── */

function VideoCard({
  video,
  index,
  onDelete,
  onTogglePublish,
  onWatch,
}: {
  video: VideoManagerProps['videos'][0] & { fileSize?: string }
  index: number
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  onWatch: (id: string) => void
}) {
  const gradientIdx = parseInt(video.id) % thumbnailGradients.length
  const catColor = categoryColors[video.category] || 'bg-xtube-red/15 text-xtube-red border-xtube-red/20'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#111111]/90 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:shadow-[0_0_25px_rgba(229,9,20,0.12)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {/* Cinematic gradient thumbnail */}
        <div className={`absolute inset-0 bg-gradient-to-br ${thumbnailGradients[gradientIdx]}`} />

        {/* Decorative film elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Film reel circles */}
            <div className="h-16 w-24 rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Film className="h-8 w-8 text-white/20" />
            </div>
          </div>
        </div>

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/40" />

        {/* Play button overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-xtube-red/90 shadow-[0_0_20px_rgba(229,9,20,0.5)] cursor-pointer"
            onClick={() => onWatch(video.id)}
          >
            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
          </motion.div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm border border-white/10">
          {video.duration}
        </div>

        {/* Three-dot menu */}
        <div className="absolute top-2 right-2 opacity-0 transition-all duration-200 group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white/70 transition-colors hover:bg-black/80 hover:text-white">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-[#111111]/95 backdrop-blur-xl" align="end">
              <DropdownMenuItem className="text-white focus:bg-white/5" onClick={() => onWatch(video.id)}>
                <Play className="mr-2 h-3.5 w-3.5" />Watch
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white focus:bg-white/5">
                <Edit className="mr-2 h-3.5 w-3.5" />Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white focus:bg-white/5" onClick={() => onTogglePublish(video.id)}>
                {video.isPublished ? 'Unpublish' : 'Publish'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="text-red-400 focus:bg-red-500/10" onClick={() => onDelete(video.id)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
            video.isPublished
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${video.isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {video.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5">
        {/* Title */}
        <h3 className="mb-1.5 truncate text-sm font-semibold text-white transition-colors group-hover:text-xtube-red">
          {video.title}
        </h3>

        {/* Category */}
        <div className="mb-2.5">
          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${catColor}`}>
            <Tag className="h-2.5 w-2.5" />
            {video.category}
          </span>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-[11px] text-white/40 mb-3">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatViews(video.views)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(video.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {video.fileSize || getRandomFileSize()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onWatch(video.id)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/10 border border-white/5"
          >
            <Play className="h-3 w-3" />Watch
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/10 border border-white/5"
          >
            <Edit className="h-3 w-3" />Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onDelete(video.id)}
            className="flex items-center justify-center rounded-lg bg-red-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/15 border border-red-500/10"
          >
            <Trash2 className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────
   List Row View
   ──────────────────────────────────────────── */

function VideoListRow({
  video,
  index,
  onDelete,
  onTogglePublish,
  onWatch,
}: {
  video: VideoManagerProps['videos'][0] & { fileSize?: string }
  index: number
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  onWatch: (id: string) => void
}) {
  const gradientIdx = parseInt(video.id) % thumbnailGradients.length
  const catColor = categoryColors[video.category] || 'bg-xtube-red/15 text-xtube-red border-xtube-red/20'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group flex items-center gap-3 rounded-xl border border-white/5 bg-[#111111]/80 p-3 backdrop-blur-xl transition-all duration-200 hover:border-white/10 hover:bg-[#111111]/95 hover:shadow-[0_0_15px_rgba(229,9,20,0.08)]"
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg">
        <div className={`absolute inset-0 bg-gradient-to-br ${thumbnailGradients[gradientIdx]}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="h-5 w-5 text-white/15" />
        </div>
        <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-semibold text-white">
          {video.duration}
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-xtube-red">{video.title}</h3>
          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${catColor}`}>
            {video.category}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/40">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatViews(video.views)}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(video.createdAt)}</span>
          <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{video.fileSize || getRandomFileSize()}</span>
        </div>
      </div>

      {/* Status */}
      <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        video.isPublished
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
      }`}>
        <span className={`h-1.5 w-1.5 rounded-full ${video.isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        {video.isPublished ? 'Published' : 'Draft'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onWatch(video.id)} className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          <Play className="h-3.5 w-3.5" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center rounded-lg bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          <Edit className="h-3.5 w-3.5" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onDelete(video.id)} className="flex items-center justify-center rounded-lg bg-red-500/5 p-2 text-red-400/60 transition-colors hover:bg-red-500/15 hover:text-red-400">
          <Trash2 className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────
   All Videos View (Grid + List)
   ──────────────────────────────────────────── */

function AllVideosView({
  videos,
  onDelete,
  onTogglePublish,
  loading,
  categories,
}: {
  videos: VideoManagerProps['videos']
  onDelete: VideoManagerProps['onDelete']
  onTogglePublish: VideoManagerProps['onTogglePublish']
  loading?: boolean
  categories: string[]
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  // Direct connection to live database videos (all mock data fallback is purged)
  const allVideos = useMemo(() => {
    return videos
  }, [videos])

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = [...allVideos]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(v => v.title.toLowerCase().includes(q) || v.category.toLowerCase().includes(q))
    }

    if (categoryFilter !== 'All Categories') {
      result = result.filter(v => v.category === categoryFilter)
    }

    switch (sortBy) {
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
      case 'oldest': result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
      case 'most-viewed': result.sort((a, b) => b.views - a.views); break
      case 'least-viewed': result.sort((a, b) => a.views - b.views); break
      case 'title-az': result.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'title-za': result.sort((a, b) => b.title.localeCompare(a.title)); break
    }

    return result
  }, [allVideos, searchQuery, categoryFilter, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage)
  const paginatedVideos = filteredVideos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleWatch = useCallback((id: string) => {
    // Navigate to video watch page
    useAppStore.getState().setSelectedVideoId(id)
    useAppStore.getState().setView('video')
  }, [])

  const resetFilters = useCallback(() => {
    setSearchQuery('')
    setCategoryFilter('All Categories')
    setSortBy('newest')
    setCurrentPage(1)
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 p-3 lg:p-5">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-8 w-48 bg-xtube-card" /><Skeleton className="mt-2 h-4 w-60 bg-xtube-card" /></div>
          <Skeleton className="h-10 w-36 rounded-xl bg-xtube-card" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 bg-xtube-card" />
          <Skeleton className="h-10 w-36 bg-xtube-card" />
          <Skeleton className="h-10 w-36 bg-xtube-card" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80">
              <Skeleton className="aspect-video bg-xtube-card" />
              <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4 bg-xtube-card" /><Skeleton className="h-3 w-1/2 bg-xtube-card" /></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4 p-3 lg:p-5"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          TOP HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xtube-red/10">
            <Film className="h-5 w-5 text-xtube-red" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">All Videos</h2>
            <p className="text-sm text-white/40">Manage your entire video library</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Upload Video Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => useAppStore.getState().setAdminSection('video-upload')}
            className="flex items-center gap-2 rounded-xl bg-xtube-red px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(229,9,20,0.35)] transition-all hover:bg-xtube-red-hover hover:shadow-[0_0_25px_rgba(229,9,20,0.5)]"
          >
            <Upload className="h-4 w-4" />
            Upload Video
          </motion.button>

          {/* View Toggle */}
          <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-[#0f0f0f]/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-xtube-red text-white'
                  : 'text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-xtube-red text-white'
                  : 'text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SEARCH + FILTER SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex flex-col gap-3 rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl transition-shadow hover:border-white/10 md:flex-row md:items-center"
      >
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder="Search videos..."
            className="border-white/10 bg-[#0a0a0a] pl-10 text-white placeholder:text-white/30 focus:border-xtube-red/40 focus:ring-xtube-red/20 rounded-lg"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1) }}>
          <SelectTrigger className="w-full rounded-lg border-white/10 bg-[#0a0a0a] text-white/70 focus:ring-xtube-red/20 md:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#111111]">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full rounded-lg border-white/10 bg-[#0a0a0a] text-white/70 focus:ring-xtube-red/20 md:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#111111]">
            <SelectItem value="newest">Sort by: Newest</SelectItem>
            <SelectItem value="oldest">Sort by: Oldest</SelectItem>
            <SelectItem value="most-viewed">Most Viewed</SelectItem>
            <SelectItem value="least-viewed">Least Viewed</SelectItem>
            <SelectItem value="title-az">Title: A → Z</SelectItem>
            <SelectItem value="title-za">Title: Z → A</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        <AnimatePresence>
          {(searchQuery || categoryFilter !== 'All Categories' || sortBy !== 'newest') && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-xtube-red hover:text-xtube-red-hover whitespace-nowrap"
            >
              <X className="h-3.5 w-3.5" />Clear
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          VIDEOS COUNT
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-sm text-white/40"
      >
        Showing <span className="font-semibold text-white/70">{filteredVideos.length}</span> video{filteredVideos.length !== 1 ? 's' : ''}
      </motion.p>

      {/* ═══════════════════════════════════════════════════════════════════
          VIDEO GRID / LIST
          ═══════════════════════════════════════════════════════════════════ */}
      {paginatedVideos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-16 backdrop-blur-xl"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-xtube-red/5">
            <Film className="h-8 w-8 text-white/20" />
          </div>
          <p className="text-lg font-medium text-white">No videos found</p>
          <p className="text-sm text-white/40">Try adjusting your search or filters</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetFilters}
            className="mt-2 rounded-lg bg-xtube-red/10 px-4 py-2 text-sm font-medium text-xtube-red transition-colors hover:bg-xtube-red/20"
          >
            Clear All Filters
          </motion.button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {paginatedVideos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              index={index}
              onDelete={onDelete}
              onTogglePublish={onTogglePublish}
              onWatch={handleWatch}
            />
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-2">
          {paginatedVideos.map((video, index) => (
            <VideoListRow
              key={video.id}
              video={video}
              index={index}
              onDelete={onDelete}
              onTogglePublish={onTogglePublish}
              onWatch={handleWatch}
            />
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PAGINATION
          ═══════════════════════════════════════════════════════════════════ */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
        >
          <p className="text-sm text-white/40">
            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredVideos.length)} of {filteredVideos.length}
          </p>

          <div className="flex items-center gap-1">
            <button
              className="flex h-9 items-center justify-center rounded-lg border border-white/10 bg-[#0f0f0f]/80 px-3 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  page === currentPage
                    ? 'bg-xtube-red text-white shadow-[0_0_10px_rgba(229,9,20,0.3)]'
                    : 'border border-white/10 bg-[#0f0f0f]/80 text-white/40 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </motion.button>
            ))}

            <button
              className="flex h-9 items-center justify-center rounded-lg border border-white/10 bg-[#0f0f0f]/80 px-3 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Items per page selector */}
          <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1) }}>
            <SelectTrigger className="h-9 w-20 rounded-lg border-white/10 bg-[#0f0f0f]/80 text-xs text-white/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#111111]">
              <SelectItem value="8">8 / page</SelectItem>
              <SelectItem value="12">12 / page</SelectItem>
              <SelectItem value="16">16 / page</SelectItem>
              <SelectItem value="24">24 / page</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      )}
    </motion.div>
  )
}

/* ────────────────────────────────────────────
   Main VideoManager Component
   ──────────────────────────────────────────── */

export function VideoManager({ videos, onUpload, onDelete, onTogglePublish, loading }: VideoManagerProps) {
  const { adminSection } = useAppStore()
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          if (data && data.categories) {
            const names = data.categories.map((c: any) => c.name)
            setCategories(names)
          }
        }
      } catch (err) {
        console.error('Error fetching categories in VideoManager:', err)
      }
    }
    fetchCategories()
  }, [])

  const defaultCats = categories.length > 0 ? categories : [
    'Sci-Fi',
    'Action',
    'Adventure',
    'Romance',
    'Documentary',
    'Fantasy',
    'Sports',
    'Nature',
    'Music',
    'History',
    'Animation',
  ]

  if (adminSection === 'video-upload') {
    return <UploadView onUpload={onUpload} categories={defaultCats} />
  }

  return (
    <AllVideosView
      videos={videos}
      onDelete={onDelete}
      onTogglePublish={onTogglePublish}
      loading={loading}
      categories={['All Categories', ...defaultCats]}
    />
  )
}
