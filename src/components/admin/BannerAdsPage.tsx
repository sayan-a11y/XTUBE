'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useRealtimeAds, formatAdNumber, formatAdRevenue } from '@/hooks/useRealtimeAds'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  CloudUpload,
  Upload,
  Trash2,
  CheckCircle2,
  Film,
  Megaphone,
  Eye,
  TrendingUp,
  DollarSign,
  MousePointer,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  BarChart3,
  Pencil,
  ExternalLink,
  Radio,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'
type AdTab = 'image' | 'video'
type PreviewMode = 'desktop' | 'tablet' | 'mobile'

interface BannerAd {
  id: string
  name: string
  type: 'Image' | 'Video'
  size: string
  position: string
  impressions: string
  ctr: string
  revenue: string
  status: 'Active' | 'Paused' | 'Draft'
  gradient: string
  imageUrl: string
  mediaUrl: string | null
}

const STAT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#f97316']
const DONUT_COLORS = ['#3b82f6', '#10b981']

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

function MiniSparkline({ color, index }: { color: string; index: number }) {
  const paths = [
    'M0,20 L8,16 L16,18 L24,10 L32,12 L40,6 L48,8 L56,2',
    'M0,18 L8,14 L16,16 L24,8 L32,10 L40,4 L48,6 L56,0',
    'M0,22 L8,18 L16,20 L24,12 L32,14 L40,8 L48,10 L56,4',
    'M0,16 L8,12 L16,14 L24,6 L32,8 L40,2 L48,4 L56,0',
    'M0,20 L8,16 L16,18 L24,10 L32,12 L40,6 L48,8 L56,2',
  ]
  return (
    <svg viewBox="0 0 56 24" className="mt-2 h-6 w-full opacity-40">
      <path
        d={paths[index % paths.length]}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay,
  index,
}: {
  title: string
  value: string
  change: string
  icon: React.ElementType
  color: string
  delay: number
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 p-3 lg:p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:shadow-lg"
    >
      <div className="absolute left-0 top-0 h-[2px] w-full" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: color, filter: 'blur(40px)', opacity: 0.06 }} />

      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">{title}</p>
          <p className="text-xl font-bold text-white">{value}</p>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">{change}</span>
            <span className="text-[10px] text-white/25">from last 30 days</span>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      <MiniSparkline color={color} index={index} />
    </motion.div>
  )
}

export function BannerAdsPage() {
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 GB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [adTab, setAdTab] = useState<AdTab>('image')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  // Form Config
  const [bannerName, setBannerName] = useState('')
  const [bannerLink, setBannerLink] = useState('')
  const [bannerSize, setBannerSize] = useState('970x250')
  const [bannerPosition, setBannerPosition] = useState('top-header')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  // Upload details
  const [fileDetails, setFileDetails] = useState<{
    name: string
    size: string
    resolution: string
    format: string
    duration: number
  } | null>(null)

  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [extractedThumbnails, setExtractedThumbnails] = useState<string[]>([])
  const [isExtractingThumbnails, setIsExtractingThumbnails] = useState(false)

  // Realtime Supabase Ads
  const { ads: allAds, stats, deleteAd, toggleAdStatus, fetchAds } = useRealtimeAds({ position: 'top-header' })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Canvas frame extraction logic
  const extractCanvasThumbnails = useCallback((file: File, duration: number) => {
    setIsExtractingThumbnails(true)
    const tempVideo = document.createElement('video')
    tempVideo.src = URL.createObjectURL(file)
    tempVideo.preload = 'metadata'
    tempVideo.muted = true
    tempVideo.playsInline = true

    tempVideo.onloadedmetadata = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 320
      canvas.height = 180

      const frames: string[] = []
      let captured = 0

      const captureFrame = (time: number) => {
        tempVideo.currentTime = time
        tempVideo.onseeked = () => {
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height)
            frames.push(canvas.toDataURL('image/jpeg', 0.8))
          }
          captured++
          if (captured < 10) {
            captureFrame((duration / 10) * captured)
          } else {
            setExtractedThumbnails(frames)
            setIsExtractingThumbnails(false)
            setUploadStage('success')
          }
        }
      }
      captureFrame(0.5) // start at 0.5s to avoid black frames
    }

    tempVideo.onerror = () => {
      setExtractedThumbnails(premiumPlaceholderImages)
      setIsExtractingThumbnails(false)
      setUploadStage('success')
    }
  }, [])

  const processSelectedFile = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file)
    setMediaUrl(objectUrl)

    const isVideo = file.type.startsWith('video/')
    const format = file.name.split('.').pop()?.toUpperCase() || ''

    if (isVideo) {
      const tempVid = document.createElement('video')
      tempVid.src = objectUrl
      tempVid.preload = 'metadata'
      tempVid.onloadedmetadata = () => {
        const roundedDuration = Math.round(tempVid.duration || 5)
        const resolution = `${tempVid.videoWidth}×${tempVid.videoHeight}`
        setFileDetails({
          name: file.name,
          size: `${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`,
          resolution,
          format,
          duration: roundedDuration,
        })
        if (!bannerName) setBannerName(file.name.replace(/\.[^/.]+$/, ""))

        // Start simulated upload chunk stream
        setUploadStage('uploading')
        setUploadProgress(0)
        let progress = 0
        const totalSize = parseFloat((file.size / (1024 * 1024 * 1024)).toFixed(2))

        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = setInterval(() => {
          const increment = Math.random() * 8 + 4
          progress = Math.min(progress + increment, 100)
          setUploadProgress(progress)
          setUploadedSize(`${((progress / 100) * totalSize).toFixed(2)} GB`)
          setUploadSpeed(`${(Math.random() * 15 + 25).toFixed(1)} MB/s`)
          const timeRemaining = ((100 - progress) / increment) * 0.15
          setUploadRemaining(timeRemaining > 60 ? `${Math.ceil(timeRemaining / 60)} mins` : `${Math.ceil(timeRemaining)} secs`)

          if (progress >= 100) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
            setUploadStage('processing')
            extractCanvasThumbnails(file, tempVid.duration)
          }
        }, 120)
      }
    } else {
      // Image file
      setFileDetails({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        resolution: bannerSize,
        format,
        duration: 0,
      })
      if (!bannerName) setBannerName(file.name.replace(/\.[^/.]+$/, ""))

      setUploadStage('uploading')
      setUploadProgress(0)
      let progress = 0
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = setInterval(() => {
        progress = Math.min(progress + 15, 100)
        setUploadProgress(progress)
        setUploadedSize(`${progress}%`)
        setUploadSpeed('45.2 MB/s')
        setUploadRemaining('1 sec')

        if (progress >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
          setUploadStage('success')
          setExtractedThumbnails(premiumPlaceholderImages)
        }
      }, 80)
    }
  }, [bannerName, bannerSize, extractCanvasThumbnails])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) processSelectedFile(files[0])
  }, [processSelectedFile])

  const handleResetUpload = useCallback(() => {
    setUploadStage('idle')
    setUploadProgress(0)
    setSelectedThumbnail(0)
    setFileDetails(null)
    setMediaUrl(null)
    setExtractedThumbnails([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSaveAd = async () => {
    if (!bannerName) {
      alert('Please enter a banner name')
      return
    }
    setSaving(true)
    try {
      const activeThumbnail = extractedThumbnails[selectedThumbnail] || premiumPlaceholderImages[0]
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: adTab === 'video' ? 'video' : 'banner',
          position: bannerPosition,
          title: bannerName,
          imageUrl: activeThumbnail,
          linkUrl: bannerLink || null,
          isActive: true,
          mediaUrl: mediaUrl || activeThumbnail,
          mediaFormat: fileDetails?.format?.toLowerCase() || (adTab === 'video' ? 'mp4' : 'png'),
          adDuration: fileDetails?.duration || 0,
          quality: '1080p',
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        }),
      })

      if (res.ok) {
        setBannerName('')
        setBannerLink('')
        setStartDate('')
        setEndDate('')
        handleResetUpload()
        alert('Banner ad saved successfully!')
        fetchAds()
      } else {
        const err = await res.json()
        alert(`Error: ${err.error || 'Failed to save banner'}`)
      }
    } catch (e) {
      console.error(e)
      alert('Failed to save banner ad')
    } finally {
      setSaving(false)
    }
  }

  // Table & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const adGradients = [
    'from-orange-900/60 via-red-800/40 to-amber-900/30',
    'from-blue-900/60 via-indigo-800/40 to-violet-900/30',
    'from-cyan-900/60 via-sky-800/40 to-blue-900/30',
    'from-emerald-900/60 via-teal-800/40 to-cyan-900/30',
    'from-rose-900/60 via-pink-800/40 to-red-900/30',
    'from-violet-900/60 via-purple-800/40 to-fuchsia-900/30',
  ]

  const mappedAds: BannerAd[] = useMemo(() => allAds.map((ad, i) => ({
    id: ad.id,
    name: ad.title,
    type: (ad.type === 'video' || ad.mediaFormat === 'mp4' ? 'Video' : 'Image') as BannerAd['type'],
    size: '970×250',
    position: ad.position === 'top-header' ? 'Header Banner' : ad.position === 'footer' ? 'Footer Banner' : 'Grid Banner',
    impressions: formatAdNumber(ad.impressions),
    ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0%',
    revenue: formatAdRevenue(ad.revenue),
    status: (ad.isActive ? 'Active' : 'Paused') as BannerAd['status'],
    gradient: adGradients[i % adGradients.length],
    imageUrl: ad.imageUrl,
    mediaUrl: ad.mediaUrl,
  })), [allAds])

  const donutData = useMemo(() => {
    const imgVal = allAds.filter(a => a.type !== 'video' && a.mediaFormat !== 'mp4').reduce((s, a) => s + (a.impressions || 0), 0)
    const vidVal = allAds.filter(a => a.type === 'video' || a.mediaFormat === 'mp4').reduce((s, a) => s + (a.impressions || 0), 0)
    if (imgVal === 0 && vidVal === 0) {
      return [{ name: 'No Active Banners', value: 1 }]
    }
    return [
      { name: 'Image Banners', value: imgVal },
      { name: 'Video Banners', value: vidVal }
    ]
  }, [allAds])

  const totalBannerImpressions = useMemo(() => {
    const sum = allAds.reduce((s, a) => s + (a.impressions || 0), 0)
    if (sum >= 1000000) return `${(sum / 1000000).toFixed(1)}M`
    if (sum >= 1000) return `${(sum / 1000).toFixed(1)}K`
    return String(sum)
  }, [allAds])

  const filteredAds = mappedAds.filter((ad) => {
    if (statusFilter !== 'all' && ad.status.toLowerCase() !== statusFilter) return false
    if (searchQuery && !ad.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const statusStyles: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Draft: 'bg-white/5 text-white/40 border-white/10',
  }

  const typeStyles: Record<string, string> = {
    Image: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Video: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto no-scrollbar"
    >
      <div className="min-h-full p-3 lg:p-5 space-y-4">
        {/* TOP HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">Banner Ads</h1>
            <p className="mt-1 text-xs text-white/40">Deploy responsive placement banners across grid positions</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111]/60 px-3 py-2 text-xs font-medium text-white/60 backdrop-blur-xl transition-colors hover:border-white/20 hover:text-white">
              <Clock className="h-3.5 w-3.5" />
              May 10 – Jun 10, 2026
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111]/60 px-3 py-2 text-xs font-medium text-white/60 backdrop-blur-xl transition-colors hover:border-white/20 hover:text-white">
              <Upload className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* TOP ANALYTICS CARDS */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Banners" value={String(stats.totalAds)} change="+8.1%" icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Campaigns" value={String(stats.activeAds)} change="+9.4%" icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value={formatAdNumber(stats.totalImpressions)} change="+14.2%" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="CTR" value={stats.avgCTR.toFixed(2) + '%'} change="+5.9%" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Revenue Track" value={formatAdRevenue(stats.totalRevenue)} change="+10.8%" icon={DollarSign} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* THREE COLUMN MAIN LAYOUT */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_300px] 2xl:grid-cols-[1fr_1fr_340px]">
          
          {/* COLUMN 1: FORM & UPLOAD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 backdrop-blur-xl"
          >
            <div className="p-3 lg:p-4">
              <h2 className="mb-4 text-base font-bold text-white">Create Banner Ad</h2>

              <div className="mb-4 flex items-center gap-0 border-b border-white/5">
                <button
                  onClick={() => { setAdTab('image'); handleResetUpload() }}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'image' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image Creative
                  {adTab === 'image' && (
                    <motion.div
                      layoutId="banner-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-xtube-red"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => { setAdTab('video'); handleResetUpload() }}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'video' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  Video Creative
                  {adTab === 'video' && (
                    <motion.div
                      layoutId="banner-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-xtube-red"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {/* Upload Drop Zone */}
              <AnimatePresence mode="wait">
                {uploadStage === 'idle' ? (
                  <motion.div
                    key="upload-idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200 ${
                      isDragOver
                        ? 'border-xtube-red bg-xtube-red/5 shadow-[0_0_20px_rgba(229,9,20,0.15)]'
                        : 'border-white/10 bg-[#0a0a0a]/60 hover:border-white/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={adTab === 'video' ? 'video/mp4,video/mov,video/webm' : 'image/*'}
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) processSelectedFile(e.target.files[0]) }}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-xtube-red/10">
                      <CloudUpload className="h-6 w-6 text-xtube-red" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white font-semibold">
                        Drag &amp; drop {adTab === 'video' ? 'video banner' : 'creative image'} here
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        or <span className="text-xtube-red underline underline-offset-2">browse files</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25">
                      {adTab === 'video' ? 'Max file size: 5GB | Supported: MP4, WebM, MOV' : 'Supported: JPG, PNG, WEBP, GIF'}
                    </p>
                  </motion.div>
                ) : uploadStage === 'uploading' || uploadStage === 'processing' ? (
                  <motion.div
                    key="upload-progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-white/5 bg-[#0a0a0a]/60 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">
                        {uploadStage === 'processing' ? 'Generating Thumbnails...' : 'Uploading Chunk Stream...'}
                      </span>
                      <span className="text-xs font-bold text-xtube-red">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-xtube-red to-red-500"
                      />
                    </div>
                    {uploadStage === 'uploading' ? (
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div>
                          <p className="text-[9px] text-white/25">Uploaded</p>
                          <p className="font-semibold text-white truncate">{uploadedSize} / {fileDetails?.size}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/25">Speed</p>
                          <p className="font-semibold text-white">{uploadSpeed}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/25">Time Left</p>
                          <p className="font-semibold text-white">{uploadRemaining}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                        <span>Realtime Video Thumbnail Generator Rendering 10 Frames...</span>
                      </div>
                    )}
                    <button onClick={handleResetUpload} className="text-xs text-xtube-red hover:underline">Cancel</button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload-success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">{fileDetails?.name}</p>
                        <p className="text-[10px] text-white/30">{fileDetails?.size} &bull; {fileDetails?.resolution} &bull; {fileDetails?.format}</p>
                      </div>
                      <button onClick={handleResetUpload} className="text-xs text-xtube-red hover:underline">Change</button>
                    </div>

                    {/* SELECT PRESETS / CAPTURED FRAMES */}
                    <div>
                      <p className="text-[11px] font-medium text-white/60 mb-1.5">
                        {adTab === 'video' ? 'Select Active Thumbnail (10 Generated Frame Captures)' : 'Preset Styles'}
                      </p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {extractedThumbnails.slice(0, 10).map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedThumbnail(i)}
                            className={`relative aspect-video overflow-hidden rounded border-2 transition-all ${
                              selectedThumbnail === i
                                ? 'border-xtube-red shadow-[0_0_8px_rgba(229,9,20,0.4)] scale-95'
                                : 'border-transparent hover:border-white/20 hover:scale-105'
                            }`}
                          >
                            <img src={url} alt="preset" className="h-full w-full object-cover" />
                            {selectedThumbnail === i && (
                              <div className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-xtube-red">
                                <CheckCircle2 className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CONFIGS */}
              <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-white/50">Banner Size</label>
                    <Select value={bannerSize} onValueChange={setBannerSize}>
                      <SelectTrigger className="h-8 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white">
                        <SelectValue placeholder="970x250" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="970x250" className="text-xs text-white">970×250 Billboard</SelectItem>
                        <SelectItem value="728x90" className="text-xs text-white">728×90 Leaderboard</SelectItem>
                        <SelectItem value="300x250" className="text-xs text-white">300×250 Rectangle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-white/50">Ad Placement Slot</label>
                    <Select value={bannerPosition} onValueChange={setBannerPosition}>
                      <SelectTrigger className="h-8 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white">
                        <SelectValue placeholder="top-header" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="top-header" className="text-xs text-white">Top Header</SelectItem>
                        <SelectItem value="footer" className="text-xs text-white">Footer Banner</SelectItem>
                        <SelectItem value="hero" className="text-xs text-white">Hero Ad Placement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/50">Campaign Title *</label>
                  <input
                    type="text"
                    value={bannerName}
                    onChange={(e) => setBannerName(e.target.value)}
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40"
                    placeholder="e.g. Nike Grid Banner"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/50">Redirect Link *</label>
                  <input
                    type="text"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40"
                    placeholder="e.g. https://nike.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-white/50">Start Date (Open Time)</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40 [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-white/50">End Date (Close Time)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <motion.button
                  onClick={handleSaveAd}
                  disabled={saving || uploadStage === 'uploading' || uploadStage === 'processing'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-xtube-red px-5 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-all hover:bg-xtube-red-hover disabled:opacity-50"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CloudUpload className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Deploy Banner Campaign'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 2: DEVICE SIMULATOR PREVIEW */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 backdrop-blur-xl">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Radio className="h-4 w-4 text-xtube-red animate-pulse" />
                    Device Viewport Simulator
                  </h2>
                  <div className="flex gap-1">
                    {[
                      { id: 'desktop', icon: Monitor },
                      { id: 'tablet', icon: Tablet },
                      { id: 'mobile', icon: Smartphone },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setPreviewMode(mode.id as PreviewMode)}
                        className={`h-7 w-7 rounded flex items-center justify-center border transition-all ${
                          previewMode === mode.id
                            ? 'border-xtube-red bg-xtube-red/10 text-white'
                            : 'border-white/5 bg-[#0a0a0a] text-white/40 hover:border-white/20'
                        }`}
                      >
                        <mode.icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative aspect-video overflow-hidden rounded-lg bg-[#08080c] border border-white/5 shadow-2xl flex flex-col justify-between">
                  
                  {/* Mock Site Header */}
                  <div className="w-full h-8 bg-black/40 border-b border-white/5 flex items-center px-3 justify-between">
                    <span className="text-[8px] font-bold text-white uppercase">Xtube Portal</span>
                    <span className="text-[7px] text-white/40">Mock Viewport</span>
                  </div>

                  {/* Grid / Placement representation */}
                  <div className="w-full flex-grow p-3 space-y-2 flex flex-col justify-center">
                    
                    {/* Simulated Ad Unit Render */}
                    <div className="w-full aspect-[21/9] rounded overflow-hidden relative border border-white/10 bg-black flex items-center justify-center">
                      {adTab === 'video' && mediaUrl ? (
                        <video
                          src={mediaUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={extractedThumbnails[selectedThumbnail] || mediaUrl || premiumPlaceholderImages[selectedThumbnail % 10]}
                          alt="mock creative preview"
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute top-1 left-1.5 rounded bg-black/75 px-1 py-0.5 text-[5px] uppercase font-bold text-xtube-red tracking-widest">
                        Ad Placement
                      </div>
                    </div>

                  </div>

                  {/* Mock Site Footer */}
                  <div className="w-full h-6 border-t border-white/5 bg-black/20 flex items-center justify-center">
                    <span className="text-[6px] text-white/20 uppercase tracking-widest">&copy; 2026 Xtube Live</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: 'Creative Slot', value: bannerPosition.toUpperCase() },
                    { label: 'Target Dimension', value: `${bannerSize} px` },
                    { label: 'Type Class', value: adTab.toUpperCase() },
                    { label: 'Destination', value: bannerLink || '—' },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between rounded-lg bg-[#0a0a0a]/50 px-3 py-1.5 border border-white/5">
                      <span className="text-[9px] text-white/35 font-medium uppercase tracking-wider">{detail.label}</span>
                      <span className="text-[10px] font-bold text-white/80 truncate ml-2">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 3: PERFORMANCE GRAPH / PIE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 p-4 backdrop-blur-xl">
              <h2 className="mb-3 text-sm font-bold text-white">Placement Share</h2>
              <div className="h-44">
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                      {donutData.map((_entry, idx) => (
                        <Cell key={idx} fill={DONUT_COLORS[idx]} />
                      ))}
                    </Pie>
                    <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-xs font-bold">{totalBannerImpressions}</text>
                    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white/30 text-[7px] uppercase font-bold">Impressions</text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>

        {/* FULL WIDTH TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 backdrop-blur-xl"
        >
          <div className="p-3 lg:p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-white">Active Banner Placements</h2>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v) }}>
                  <SelectTrigger className="h-8 w-28 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/60 [&_svg]:text-white/30">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111111]">
                    <SelectItem value="all" className="text-xs text-white focus:bg-white/5">All Status</SelectItem>
                    <SelectItem value="active" className="text-xs text-white focus:bg-white/5">Active</SelectItem>
                    <SelectItem value="paused" className="text-xs text-white focus:bg-white/5">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                    <th className="pb-2 text-left">Creative Preview</th>
                    <th className="pb-2 text-left">Ad Name</th>
                    <th className="pb-2 text-left">Type</th>
                    <th className="pb-2 text-left">Placement</th>
                    <th className="pb-2 text-left">Size</th>
                    <th className="pb-2 text-left">Impressions</th>
                    <th className="pb-2 text-left">CTR</th>
                    <th className="pb-2 text-left">Revenue</th>
                    <th className="pb-2 text-left">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAds.map((ad, i) => (
                    <motion.tr key={ad.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5">
                        <div className="h-9 w-16 overflow-hidden rounded bg-black/60 border border-white/5">
                          <img src={ad.imageUrl} alt={ad.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = premiumPlaceholderImages[i % 10] }} />
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="text-xs font-semibold text-white group-hover:text-xtube-red transition-colors">{ad.name}</span>
                      </td>
                      <td className="py-2.5 text-xs text-white/45">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${typeStyles[ad.type] || 'bg-white/5'}`}>
                          {ad.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-white/40">{ad.position}</td>
                      <td className="py-2.5 text-xs text-white/40">{ad.size}</td>
                      <td className="py-2.5 text-xs text-white/70">{ad.impressions}</td>
                      <td className="py-2.5 text-xs font-bold text-xtube-red">{ad.ctr}</td>
                      <td className="py-2.5 text-xs font-semibold text-emerald-400">{ad.revenue}</td>
                      <td className="py-2.5">
                        <button
                          onClick={() => toggleAdStatus(ad.id, ad.status !== 'Active')}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold transition-all hover:scale-105 active:scale-95 ${statusStyles[ad.status]}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${ad.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {ad.status}
                        </button>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => deleteAd(ad.id)}
                          className="rounded p-1 text-white/30 hover:bg-xtube-red/10 hover:text-xtube-red opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
