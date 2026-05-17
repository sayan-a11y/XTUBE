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
type AdTab = 'image' | 'html5'

interface PopupAd {
  id: string
  name: string
  type: 'Image' | 'HTML5'
  trigger: string
  displayOn: string
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

export function PopupAdsPage() {
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 MB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [adTab, setAdTab] = useState<AdTab>('image')

  // Popup settings state
  const [popupName, setPopupName] = useState('')
  const [popupLink, setPopupLink] = useState('')
  const [popupTrigger, setPopupTrigger] = useState('5')
  const [popupDisplayOn, setPopupDisplayOn] = useState('all')
  const [saving, setSaving] = useState(false)
  const [popupVisible, setPopupVisible] = useState(true)

  // Upload details
  const [fileDetails, setFileDetails] = useState<{
    name: string
    size: string
    resolution: string
    format: string
  } | null>(null)

  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [extractedThumbnails, setExtractedThumbnails] = useState<string[]>([])

  // Realtime Supabase Ads
  const { ads: allAds, stats, deleteAd, toggleAdStatus, fetchAds } = useRealtimeAds({ position: 'popup-center' })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const processSelectedFile = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file)
    setMediaUrl(objectUrl)

    const format = file.name.split('.').pop()?.toUpperCase() || ''
    setFileDetails({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      resolution: 'Responsive Popup Lightbox',
      format,
    })
    if (!popupName) setPopupName(file.name.replace(/\.[^/.]+$/, ""))

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
  }, [popupName])

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
    if (!popupName) {
      alert('Please enter a popup name')
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
          type: 'popup',
          position: 'popup-center',
          title: popupName,
          imageUrl: mediaUrl || activeThumbnail,
          linkUrl: popupLink || null,
          isActive: true,
          mediaUrl: mediaUrl || activeThumbnail,
          mediaFormat: fileDetails?.format?.toLowerCase() || 'png',
          adDuration: 0,
          quality: '1080p',
        }),
      })

      if (res.ok) {
        setPopupName('')
        setPopupLink('')
        handleResetUpload()
        alert('Popup ad saved successfully!')
        fetchAds()
      } else {
        const err = await res.json()
        alert(`Error: ${err.error || 'Failed to save popup'}`)
      }
    } catch (e) {
      console.error(e)
      alert('Failed to save popup ad')
    } finally {
      setSaving(false)
    }
  }

  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const adGradients = [
    'from-orange-900/60 via-red-800/40 to-amber-900/30',
    'from-blue-900/60 via-indigo-800/40 to-violet-900/30',
    'from-cyan-900/60 via-sky-800/40 to-blue-900/30',
    'from-emerald-900/60 via-teal-800/40 to-cyan-900/30',
    'from-rose-900/60 via-pink-800/40 to-red-900/30',
    'from-violet-900/60 via-purple-800/40 to-fuchsia-900/30',
  ]

  const mappedAds: PopupAd[] = useMemo(() => allAds.map((ad, i) => ({
    id: ad.id,
    name: ad.title,
    type: (ad.type === 'html5' ? 'HTML5' : 'Image') as PopupAd['type'],
    trigger: 'Time Delay (5s)',
    displayOn: 'All Site Pages',
    impressions: formatAdNumber(ad.impressions),
    ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0%',
    revenue: formatAdRevenue(ad.revenue),
    status: (ad.isActive ? 'Active' : 'Paused') as PopupAd['status'],
    gradient: adGradients[i % adGradients.length],
    imageUrl: ad.imageUrl,
    mediaUrl: ad.mediaUrl,
  })), [allAds])

  const donutData = useMemo(() => [
    { name: 'Image Popups', value: allAds.filter(a => a.type !== 'html5').reduce((s, a) => s + a.impressions, 0) || 2700 },
    { name: 'HTML5 Popups', value: allAds.filter(a => a.type === 'html5').reduce((s, a) => s + a.impressions, 0) || 350 },
  ], [allAds])

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
    HTML5: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
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
            <h1 className="text-xl font-bold text-white md:text-2xl">Popup Lightbox Ads</h1>
            <p className="mt-1 text-xs text-white/40">Deploy responsive popup overlays on site entry checkpoints</p>
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
          <StatCard title="Total Popups" value={String(stats.totalAds)} change="+10.2%" icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Campaigns" value={String(stats.activeAds)} change="+8.9%" icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value={formatAdNumber(stats.totalImpressions)} change="+16.4%" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="CTR" value={stats.avgCTR.toFixed(2) + '%'} change="+6.4%" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Revenue Track" value={formatAdRevenue(stats.totalRevenue)} change="+12.1%" icon={DollarSign} color={STAT_COLORS[4]} delay={0.2} index={4} />
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
              <h2 className="mb-4 text-base font-bold text-white">Create Popup Ad</h2>

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
                      layoutId="popup-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-xtube-red"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => { setAdTab('html5'); handleResetUpload() }}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'html5' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  HTML5 / Zip
                  {adTab === 'html5' && (
                    <motion.div
                      layoutId="popup-tab-indicator"
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
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) processSelectedFile(e.target.files[0]) }}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-xtube-red/10">
                      <CloudUpload className="h-6 w-6 text-xtube-red" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">Drag &amp; drop popup image here</p>
                      <p className="mt-1 text-xs text-white/40">
                        or <span className="text-xtube-red underline underline-offset-2">browse files</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25">Supported: JPG, PNG, WEBP, GIF</p>
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
                      <span className="text-xs font-medium text-white">Processing Creative file...</span>
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
                        <p className="truncate text-xs font-semibold text-white">{fileDetails?.name}</p>
                        <p className="text-[10px] text-white/30">{fileDetails?.size} &bull; {fileDetails?.resolution}</p>
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
                    <label className="text-[11px] font-medium text-white/50">Trigger Delay</label>
                    <Select value={popupTrigger} onValueChange={setPopupTrigger}>
                      <SelectTrigger className="h-8 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white">
                        <SelectValue placeholder="5 seconds" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="2" className="text-xs text-white">2 seconds</SelectItem>
                        <SelectItem value="5" className="text-xs text-white">5 seconds</SelectItem>
                        <SelectItem value="10" className="text-xs text-white">10 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-white/50">Display Scope</label>
                    <Select value={popupDisplayOn} onValueChange={setPopupDisplayOn}>
                      <SelectTrigger className="h-8 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white">
                        <SelectValue placeholder="All Pages" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111111]">
                        <SelectItem value="all" className="text-xs text-white">All Pages</SelectItem>
                        <SelectItem value="homepage" className="text-xs text-white">Homepage Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/50">Campaign Title *</label>
                  <input
                    type="text"
                    value={popupName}
                    onChange={(e) => setPopupName(e.target.value)}
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40"
                    placeholder="e.g. Premium Lightbox popup"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/50">Redirect Link *</label>
                  <input
                    type="text"
                    value={popupLink}
                    onChange={(e) => setPopupLink(e.target.value)}
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40"
                    placeholder="e.g. https://nike.com"
                  />
                </div>

                <motion.button
                  onClick={handleSaveAd}
                  disabled={saving || uploadStage === 'uploading'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-xtube-red px-5 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-all hover:bg-xtube-red-hover disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Deploy Popup'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 2: LIGHTBOX SIMULATOR */}
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
                    Interactive Lightbox Simulator
                  </h2>
                  <button
                    onClick={() => setPopupVisible(true)}
                    className="text-[9px] bg-xtube-red/20 text-xtube-red border border-xtube-red/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider hover:bg-xtube-red hover:text-white transition-all"
                  >
                    Fire Trigger
                  </button>
                </div>

                <div className="relative aspect-video overflow-hidden rounded-lg bg-[#08080c] border border-white/5 shadow-2xl flex items-center justify-center p-4">
                  {/* Mock Site Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 flex flex-col justify-between p-3 opacity-40">
                    <div className="h-4 w-1/4 bg-white/5 rounded" />
                    <div className="space-y-2">
                      <div className="h-3 w-1/2 bg-white/5 rounded" />
                      <div className="h-2 w-3/4 bg-white/5 rounded" />
                    </div>
                  </div>

                  {/* LIGHTBOX POPUP OVERLAY */}
                  <AnimatePresence>
                    {popupVisible && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="absolute inset-0 bg-black/75 z-20 flex items-center justify-center p-4"
                      >
                        <div className="relative bg-[#111111] border border-white/10 rounded-xl p-3.5 max-w-[240px] text-center shadow-2xl space-y-3">
                          <button
                            onClick={() => setPopupVisible(false)}
                            className="absolute top-1.5 right-1.5 text-white/40 hover:text-white transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>

                          <div className="aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/5">
                            <img
                              src={mediaUrl || extractedThumbnails[selectedThumbnail] || premiumPlaceholderImages[selectedThumbnail % 10]}
                              alt="creative"
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div>
                            <span className="text-[7px] bg-xtube-red text-white px-2 py-0.5 rounded font-bold uppercase tracking-widest">Sponsored</span>
                            <h3 className="text-xs font-bold text-white uppercase tracking-tight mt-1">{popupName || 'Campaign Offer'}</h3>
                          </div>

                          {popupLink && (
                            <a
                              href={popupLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-xtube-red px-3 py-1 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(229,9,20,0.3)] hover:bg-xtube-red-hover"
                            >
                              Claim Offer <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: 'Auto Trigger', value: `${popupTrigger} sec delay` },
                    { label: 'Display scope', value: popupDisplayOn.toUpperCase() },
                    { label: 'Close option', value: 'Close button enabled' },
                    { label: 'Link redirect', value: popupLink || '—' },
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
              <h2 className="mb-3 text-sm font-bold text-white">Impressions Split</h2>
              <div className="h-44">
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                      {donutData.map((_entry, idx) => (
                        <Cell key={idx} fill={DONUT_COLORS[idx]} />
                      ))}
                    </Pie>
                    <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-xs font-bold">3.0K</text>
                    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white/30 text-[7px] uppercase font-bold">Popups</text>
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
              <h2 className="text-base font-bold text-white">Active Popup Campaigns</h2>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
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
                    <th className="pb-2 text-left">Trigger</th>
                    <th className="pb-2 text-left">Display On</th>
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
                        <p className="text-[9px] text-white/25 uppercase font-mono">Type: {ad.type}</p>
                      </td>
                      <td className="py-2.5 text-xs text-white/45">{ad.trigger}</td>
                      <td className="py-2.5 text-xs text-white/40">{ad.displayOn}</td>
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
                          onClick={() => { if (confirm('Delete popup?')) deleteAd(ad.id) }}
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
