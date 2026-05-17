'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
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
type PreviewMode = 'desktop' | 'tablet' | 'mobile'

interface HeroAd {
  id: string
  title: string
  description: string | null
  category: string | null
  mediaUrl: string
  thumbnailUrl: string | null
  adType: string
  mediaFormat: string
  isActive: boolean
  displayOrder: number
  impressions: number
  clicks: number
  ctr: number
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

const STAT_COLORS = ['#ff1e1e', '#8b5cf6', '#10b981', '#ec4899', '#f97316']
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

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toString()
}

export function HeroAdsPage() {
  const [heroAds, setHeroAds] = useState<HeroAd[]>([])
  const [loading, setLoading] = useState(true)

  // Upload state
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 MB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)

  // Form state
  const [adTitle, setAdTitle] = useState('')
  const [adDescription, setAdDescription] = useState('')
  const [adCategory, setAdCategory] = useState('')
  const [adType, setAdType] = useState('image')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [statusActive, setStatusActive] = useState(true)
  const [saving, setSaving] = useState(false)

  // Preview state
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [editingAd, setEditingAd] = useState<HeroAd | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [extractedThumbnails, setExtractedThumbnails] = useState<string[]>([])
  const [fileDetails, setFileDetails] = useState<{
    name: string
    size: string
    resolution: string
    format: string
  } | null>(null)

  const fetchHeroAds = useCallback(async () => {
    try {
      const res = await fetch('/api/hero-ads')
      if (res.ok) {
        const data = await res.json()
        setHeroAds(data.heroAds || [])
      }
    } catch (err) {
      console.error('Error fetching hero ads:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHeroAds()
  }, [fetchHeroAds])

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return

    const channel = supabase
      .channel('admin-hero-ads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'HeroAd' },
        () => {
          fetchHeroAds()
        }
      )
      .subscribe()

    return () => {
      supabase?.removeChannel(channel)
    }
  }, [fetchHeroAds])

  const processSelectedFile = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file)
    setMediaUrl(objectUrl)

    const format = file.name.split('.').pop()?.toUpperCase() || ''
    setFileDetails({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      resolution: '1920×1080',
      format,
    })
    if (!adTitle) setAdTitle(file.name.replace(/\.[^/.]+$/, ""))

    setUploadStage('uploading')
    setUploadProgress(0)
    let progress = 0

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    progressIntervalRef.current = setInterval(() => {
      progress = Math.min(progress + 15, 100)
      setUploadProgress(progress)
      setUploadedSize(`${((progress / 100) * parseFloat((file.size / (1024 * 1024)).toFixed(2))).toFixed(2)} MB`)
      setUploadSpeed('45.2 MB/s')
      setUploadRemaining('1 sec')

      if (progress >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
        setUploadStage('success')
        setExtractedThumbnails(premiumPlaceholderImages)
      }
    }, 80)
  }, [adTitle])

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

  const handleSave = useCallback(async () => {
    if (!adTitle.trim()) return
    setSaving(true)
    try {
      const activeThumbnail = extractedThumbnails[selectedThumbnail] || premiumPlaceholderImages[0]
      const payload = {
        id: editingAd?.id,
        title: adTitle,
        description: adDescription || null,
        category: adCategory || null,
        mediaUrl: mediaUrl || activeThumbnail,
        thumbnailUrl: activeThumbnail,
        adType,
        mediaFormat: fileDetails?.format?.toLowerCase() || 'jpg',
        isActive: statusActive,
        displayOrder,
        startDate: startDate || null,
        endDate: endDate || null,
      }

      const res = await fetch('/api/hero-ads', {
        method: editingAd ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        resetForm()
        handleResetUpload()
        await fetchHeroAds()
        alert('Hero ad saved successfully!')
      }
    } catch (err) {
      console.error('Error saving hero ad:', err)
    } finally {
      setSaving(false)
    }
  }, [adTitle, adDescription, adCategory, adType, statusActive, displayOrder, startDate, endDate, editingAd, fetchHeroAds, handleResetUpload, mediaUrl, extractedThumbnails, selectedThumbnail, fileDetails])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero ad?')) return
    try {
      const res = await fetch('/api/hero-ads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        await fetchHeroAds()
      }
    } catch (err) {
      console.error('Error deleting hero ad:', err)
    }
  }, [fetchHeroAds])

  const handleEdit = useCallback((ad: HeroAd) => {
    setEditingAd(ad)
    setAdTitle(ad.title)
    setAdDescription(ad.description || '')
    setAdCategory(ad.category || '')
    setAdType(ad.adType)
    setStartDate(ad.startDate ? ad.startDate.split('T')[0] : '')
    setEndDate(ad.endDate ? ad.endDate.split('T')[0] : '')
    setDisplayOrder(ad.displayOrder)
    setStatusActive(ad.isActive)
    setMediaUrl(ad.mediaUrl)
    setExtractedThumbnails(premiumPlaceholderImages)
    setUploadStage('success')
  }, [])

  const resetForm = useCallback(() => {
    setAdTitle('')
    setAdDescription('')
    setAdCategory('')
    setAdType('image')
    setStartDate('')
    setEndDate('')
    setDisplayOrder(0)
    setStatusActive(true)
    setEditingAd(null)
    setUploadStage('idle')
    setUploadProgress(0)
    setSelectedThumbnail(0)
    setFileDetails(null)
    setMediaUrl(null)
    setExtractedThumbnails([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // KPI Computations
  const totalAds = heroAds.length
  const activeAds = heroAds.filter((ad) => ad.isActive).length
  const totalImpressions = heroAds.reduce((sum, ad) => sum + ad.impressions, 0)
  const avgCtr = totalAds > 0 ? heroAds.reduce((sum, ad) => sum + ad.ctr, 0) / totalAds : 0
  const totalClicks = heroAds.reduce((sum, ad) => sum + ad.clicks, 0)

  const donutData = useMemo(() => {
    const imgVal = heroAds.filter((ad) => ad.adType === 'image').reduce((s, a) => s + (a.clicks || 0), 0)
    const vidVal = heroAds.filter((ad) => ad.adType === 'video').reduce((s, a) => s + (a.clicks || 0), 0)
    if (imgVal === 0 && vidVal === 0) {
      return [{ name: 'No Hero Ads', value: 1 }]
    }
    return [
      { name: 'Image Ads', value: imgVal },
      { name: 'Video Ads', value: vidVal }
    ]
  }, [heroAds])

  const totalHeroClicks = useMemo(() => {
    const sum = heroAds.reduce((s, a) => s + (a.clicks || 0), 0)
    if (sum >= 1000000) return `${(sum / 1000000).toFixed(1)}M`
    if (sum >= 1000) return `${(sum / 1000).toFixed(1)}K`
    return String(sum)
  }, [heroAds])

  const filteredAds = heroAds.filter((ad) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !ad.isActive) return false
      if (statusFilter === 'paused' && ad.isActive) return false
    }
    if (searchQuery && !ad.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const statusStyles: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
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
            <h1 className="text-xl font-bold text-white md:text-2xl">Hero Cinematic Ads</h1>
            <p className="mt-1 text-xs text-white/40">Deploy high-impact cinematic banners across landing headers</p>
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
          <StatCard title="Total Hero Ads" value={String(totalAds)} change="+11.4%" icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Campaigns" value={String(activeAds)} change="+8.2%" icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value={formatNumber(totalImpressions)} change="+15.3%" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="Average CTR" value={avgCtr.toFixed(2) + '%'} change="+6.7%" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Total Clicks" value={formatNumber(totalClicks)} change="+12.4%" icon={TrendingUp} color={STAT_COLORS[4]} delay={0.2} index={4} />
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
              <h2 className="mb-4 text-base font-bold text-white">Create Hero Cinematic Ad</h2>

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
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) processSelectedFile(e.target.files[0]) }}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-xtube-red/10">
                      <CloudUpload className="h-6 w-6 text-xtube-red" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">Drag &amp; drop cinematic banner here</p>
                      <p className="mt-1 text-xs text-white/40">
                        or <span className="text-xtube-red underline underline-offset-2">browse files</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25">Supported: MP4, JPG, PNG, WEBP</p>
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
                      <span className="text-xs font-medium text-white">Processing Cinematic Creative...</span>
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
                        <p className="truncate text-xs font-semibold text-white">{fileDetails?.name || 'cinematic_hero_ad.jpg'}</p>
                        <p className="text-[10px] text-white/30">{fileDetails?.size || '4.5 MB'} &bull; {fileDetails?.resolution || '1920x1080'}</p>
                      </div>
                      <button onClick={handleResetUpload} className="text-xs text-xtube-red hover:underline">Change</button>
                    </div>

                    {/* SELECT PRESETS */}
                    <div>
                      <p className="text-[11px] font-medium text-white/60 mb-1.5">Preset Styles</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {extractedThumbnails.slice(0, 5).map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedThumbnail(i)}
                            className={`relative aspect-video overflow-hidden rounded border-2 transition-all ${
                              selectedThumbnail === i ? 'border-xtube-red scale-95' : 'border-transparent hover:border-white/20'
                            }`}
                          >
                            <img src={url} alt="preset" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* INPUT FIELDS */}
              <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-white/50">Category Type</label>
                    <input
                      type="text"
                      value={adCategory}
                      onChange={(e) => setAdCategory(e.target.value)}
                      placeholder="e.g. promo"
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-white/50">Creative Type</label>
                    <Select value={adType} onValueChange={setAdType}>
                      <SelectTrigger className="h-8 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white">
                        <SelectValue placeholder="Image" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="image" className="text-xs text-white">Image</SelectItem>
                        <SelectItem value="video" className="text-xs text-white">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/50">Campaign Title *</label>
                  <input
                    type="text"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40"
                    placeholder="e.g. Cinematic Promo Series"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/50">Description</label>
                  <textarea
                    value={adDescription}
                    onChange={(e) => setAdDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40 resize-none"
                    placeholder="e.g. Stream the premier collection exclusively."
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
                  onClick={handleSave}
                  disabled={saving || uploadStage === 'uploading'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-xtube-red px-5 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-all hover:bg-xtube-red-hover disabled:opacity-50"
                >
                  {saving ? 'Saving campaign...' : 'Deploy Cinematic Hero'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 2: CINEMATIC CAROUSEL PREVIEW */}
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
                    Cinematic Landing Carousel Preview
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

                <div className="relative aspect-video overflow-hidden rounded-lg bg-[#08080c] border border-white/5 shadow-2xl flex flex-col justify-end p-4">
                  {/* Cinematic Wide Image Background */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={mediaUrl || extractedThumbnails[selectedThumbnail] || premiumPlaceholderImages[selectedThumbnail % 10]}
                      alt="cinematic background"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
                  </div>

                  {/* Cinematic Promotional Details */}
                  <div className="relative z-10 text-left max-w-xs space-y-2">
                    <span className="text-[7px] bg-xtube-red text-white px-2 py-0.5 rounded font-extrabold uppercase tracking-widest">
                      {adCategory || 'Featured Release'}
                    </span>
                    <h3 className="text-sm lg:text-base font-extrabold text-white leading-tight uppercase">
                      {adTitle || 'Cinematic Release'}
                    </h3>
                    <p className="text-[9px] text-white/70 leading-relaxed truncate">
                      {adDescription || 'Unlock premium high-octane collections.'}
                    </p>
                    <button className="flex items-center gap-1.5 rounded bg-white px-3 py-1 text-[8px] font-extrabold text-black hover:bg-white/80 transition-colors">
                      <Play className="h-2 w-2 fill-black" /> Play Now
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: 'Creative Format', value: adType.toUpperCase() },
                    { label: 'Category scope', value: adCategory || '—' },
                    { label: 'Display Order', value: displayOrder.toString() },
                    { label: 'Dimensions', value: '1920×1080 px' },
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
              <h2 className="mb-3 text-sm font-bold text-white">Cinematic Split</h2>
              <div className="h-44">
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                      {donutData.map((_entry, idx) => (
                        <Cell key={idx} fill={DONUT_COLORS[idx]} />
                      ))}
                    </Pie>
                    <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-xs font-bold">{totalHeroClicks}</text>
                    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white/30 text-[7px] uppercase font-bold">Clicks</text>
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
              <h2 className="text-base font-bold text-white">Active Cinematic Campaigns</h2>
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
                    <th className="pb-2 text-left">Category</th>
                    <th className="pb-2 text-left">Order</th>
                    <th className="pb-2 text-left">Impressions</th>
                    <th className="pb-2 text-left">CTR</th>
                    <th className="pb-2 text-left">Clicks</th>
                    <th className="pb-2 text-left">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAds.map((ad, i) => (
                    <motion.tr key={ad.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5">
                        <div className="h-9 w-16 overflow-hidden rounded bg-black/60 border border-white/5">
                          <img src={ad.thumbnailUrl || ad.mediaUrl} alt={ad.title} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = premiumPlaceholderImages[i % 10] }} />
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="text-xs font-semibold text-white group-hover:text-xtube-red transition-colors">{ad.title}</span>
                        <p className="text-[9px] text-white/25 uppercase font-mono">Format: {ad.adType}</p>
                      </td>
                      <td className="py-2.5 text-xs text-white/45">{ad.category}</td>
                      <td className="py-2.5 text-xs text-white/40">{ad.displayOrder}</td>
                      <td className="py-2.5 text-xs text-white/70">{ad.impressions}</td>
                      <td className="py-2.5 text-xs font-bold text-xtube-red">{ad.ctr}%</td>
                      <td className="py-2.5 text-xs font-semibold text-emerald-400">{ad.clicks}</td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold transition-all ${statusStyles[ad.isActive ? 'Active' : 'Paused']}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${ad.isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {ad.isActive ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(ad)}
                          className="rounded p-1 text-white/30 hover:bg-white/5 hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="rounded p-1 text-white/30 hover:bg-xtube-red/10 hover:text-xtube-red"
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
