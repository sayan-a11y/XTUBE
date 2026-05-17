'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Clock,
  SkipForward,
  BarChart3,
  Activity,
  Zap,
  Play,
  Monitor,
  Smartphone,
  Tv,
  ChevronDown,
  ArrowUpRight,
  Flame,
  Plus,
  Trash2,
  Pencil,
  Globe,
  Settings,
  Upload,
  Check,
  AlertCircle,
  FileVideo,
  FileImage,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Download,
  Info
} from 'lucide-react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface VideoAdsAnalyticsProps {
  ads: Array<{
    id: string
    type: string
    position: string
    title: string
    imageUrl: string
    impressions: number
    clicks: number
    revenue: number
    isActive: boolean
    createdAt: string
  }>
}

interface LocalAdItem {
  id: string
  title: string
  type: 'Video' | 'Image'
  position: 'Pre-roll' | 'Mid-roll' | 'Post-roll' | 'Overlay' | 'Banner'
  imageUrl: string
  impressions: number
  clicks: number
  revenue: number
  duration: string
  status: 'Active' | 'Paused'
  resolution: string
}

// ─── Constants & Sleek Dark Color Palettes ────────────────────────────────────

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#c084fc'] // Video, Image, Overlay, Banner HSL
const DEVICE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'] // Mobile, Desktop, Tablet HSL

// ─── Simulated Performance Over Time Data (Screenshot Dual Line Chart) ────────
const initialPerformanceData = [
  { date: 'May 10', impressions: 98000, clicks: 8200, revenue: 1200 },
  { date: 'May 15', impressions: 145000, clicks: 12500, revenue: 1850 },
  { date: 'May 20', impressions: 128000, clicks: 10800, revenue: 1540 },
  { date: 'May 25', impressions: 185000, clicks: 15200, revenue: 2200 },
  { date: 'May 30', impressions: 210000, clicks: 17800, revenue: 2500 },
  { date: 'Jun 04', impressions: 165000, clicks: 13900, revenue: 1980 },
  { date: 'Jun 10', impressions: 245000, clicks: 21500, revenue: 3100 },
]

// Pre-seeded high fidelity ads matching the exact screenshot items
const PRESEEDED_ADS: LocalAdItem[] = [
  {
    id: 'ad-nike',
    title: 'Nike 4K Video Ad',
    type: 'Video',
    position: 'Mid-roll',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300',
    impressions: 1120000,
    clicks: 82400,
    revenue: 4250.75,
    duration: '00:30',
    status: 'Active',
    resolution: '1920x1080 • 4K'
  },
  {
    id: 'ad-coke',
    title: 'Coca-Cola Banner',
    type: 'Image',
    position: 'Banner',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300',
    impressions: 680000,
    clicks: 34500,
    revenue: 2125.60,
    duration: '-',
    status: 'Active',
    resolution: '1200x628 • Image'
  },
  {
    id: 'ad-samsung',
    title: 'Samsung Galaxy Ad',
    type: 'Video',
    position: 'Pre-roll',
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=300',
    impressions: 480000,
    clicks: 22800,
    revenue: 3845.20,
    duration: '00:15',
    status: 'Active',
    resolution: '3840x2160 • 4K'
  },
  {
    id: 'ad-amazon',
    title: 'Amazon Big Sale',
    type: 'Image',
    position: 'Overlay',
    imageUrl: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=300',
    impressions: 120000,
    clicks: 6800,
    revenue: 1245.30,
    duration: '-',
    status: 'Paused',
    resolution: '1200x500 • Image'
  },
  {
    id: 'ad-car',
    title: 'Car Brand Video Ad',
    type: 'Video',
    position: 'Post-roll',
    imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=300',
    impressions: 50000,
    clicks: 2200,
    revenue: 954.80,
    duration: '00:20',
    status: 'Active',
    resolution: '1920x1080 • 4K'
  }
]

export function VideoAdsAnalytics({ ads }: VideoAdsAnalyticsProps) {
  // Local active ads state combining Supabase props with premium mocks
  const [localAds, setLocalAds] = useState<LocalAdItem[]>([])
  const [filterType, setFilterType] = useState<'All' | 'Video' | 'Image'>('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState('Last 30 Days')
  
  // Custom date picker simulations
  const [dateRange, setDateRange] = useState('May 10, 2025 - Jun 10, 2025')
  
  // Tab states for new ad creation
  const [uploadTab, setUploadTab] = useState<'video' | 'image'>('video')
  const [uploadQuality, setUploadQuality] = useState('Auto')
  const [timelineVideo, setTimelineVideo] = useState('video-ai-future')

  // Real-time upload progress simulator values
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(49)
  const [uploadSpeed, setUploadSpeed] = useState(2.5) // MB/s
  const [uploadRemaining, setUploadRemaining] = useState('2 mins left')
  const [uploadBytes, setUploadBytes] = useState('2.45 GB / 5.00 GB')

  // Settings State Toggles
  const [settingsAutoAds, setSettingsAutoAds] = useState(true)
  const [settingsSkipAfter, setSettingsSkipAfter] = useState('5s')
  const [settingsMaxPerVideo, setSettingsMaxPerVideo] = useState('unlimited')
  const [settingsGap, setSettingsGap] = useState('10m')
  const [settingsQuality, setSettingsQuality] = useState('4k-auto')
  const [settingsPlayback, setSettingsPlayback] = useState('smart')

  // Load and normalize incoming Supabase ads combined with the high fidelity assets
  const syncAdsData = useCallback(() => {
    const normalizedProps: LocalAdItem[] = ads.map((item) => {
      const typeStr = item.type.toLowerCase().includes('image') || item.type.toLowerCase().includes('banner') ? 'Image' : 'Video'
      let posStr: 'Pre-roll' | 'Mid-roll' | 'Post-roll' | 'Overlay' | 'Banner' = 'Mid-roll'
      if (item.position.toLowerCase().includes('pre')) posStr = 'Pre-roll'
      else if (item.position.toLowerCase().includes('post')) posStr = 'Post-roll'
      else if (item.position.toLowerCase().includes('overlay')) posStr = 'Overlay'
      else if (item.position.toLowerCase().includes('banner') || item.type.toLowerCase().includes('banner')) posStr = 'Banner'
      
      return {
        id: item.id,
        title: item.title,
        type: typeStr as 'Video' | 'Image',
        position: posStr,
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300',
        impressions: item.impressions || 15400,
        clicks: item.clicks || 480,
        revenue: item.revenue || 245.50,
        duration: typeStr === 'Video' ? '00:30' : '-',
        status: item.isActive ? 'Active' : 'Paused',
        resolution: typeStr === 'Video' ? '1920x1080 • 4K' : '1200x628 • Image'
      }
    })

    // Filter duplicates so we have unique list merging database and mock elements
    const combined = [...PRESEEDED_ADS]
    normalizedProps.forEach(propAd => {
      const existsIdx = combined.findIndex(c => c.id === propAd.id || c.title.toLowerCase() === propAd.title.toLowerCase())
      if (existsIdx >= 0) {
        combined[existsIdx] = { ...combined[existsIdx], ...propAd }
      } else {
        combined.unshift(propAd)
      }
    })

    setLocalAds(combined)
  }, [ads])

  useEffect(() => {
    syncAdsData()
  }, [syncAdsData])

  // Hook real-time events to instantly refresh tables and analytics
  useRealtimeSync(useCallback((type) => {
    if (type.startsWith('ad:') || type.includes('ad:')) {
      // Re-trigger visual analytics refreshes
      syncAdsData()
    }
  }, [syncAdsData]))

  // Real-time upload stream simulation loop
  useEffect(() => {
    let intervalId: any = null
    if (uploading) {
      intervalId = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            setUploading(false)
            // Add new ad to local list automatically representing completed upload
            const newAd: LocalAdItem = {
              id: `ad-${Date.now()}`,
              title: uploadTab === 'video' ? 'Ad_Video_4K_UHD.mp4' : 'Image_Creative_Banner.png',
              type: uploadTab === 'video' ? 'Video' : 'Image',
              position: uploadTab === 'video' ? 'Mid-roll' : 'Banner',
              imageUrl: uploadTab === 'video' 
                ? 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=300'
                : 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300',
              impressions: 1250,
              clicks: 45,
              revenue: 12.80,
              duration: uploadTab === 'video' ? '00:15' : '-',
              status: 'Active',
              resolution: uploadTab === 'video' ? '3840x2160 • 4K' : '1200x628 • Image'
            }
            setLocalAds(prevAds => [newAd, ...prevAds])
            return 100
          }
          const step = Math.random() * 4 + 1
          const nextVal = Math.min(prev + step, 100)
          
          // Calculate remaining speed/GB sizes
          const currentGB = ((nextVal / 100) * 5.0).toFixed(2)
          setUploadBytes(`${currentGB} GB / 5.00 GB`)
          const randomSpeed = (Math.random() * 0.8 + 2.1).toFixed(1)
          setUploadSpeed(parseFloat(randomSpeed))
          
          const remainingSecs = Math.round(((100 - nextVal) * 2.4))
          if (remainingSecs > 60) {
            setUploadRemaining(`${Math.floor(remainingSecs / 60)}m ${remainingSecs % 60}s left`)
          } else {
            setUploadRemaining(`${remainingSecs}s left`)
          }

          return nextVal
        })
      }, 900)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [uploading, uploadTab])

  const startSimulatedUpload = () => {
    setUploadProgress(0)
    setUploadBytes('0.00 GB / 5.00 GB')
    setUploading(true)
  }

  // ─── Computed Metrics ──────────────────────────────────────────────────────

  // Overall metric additions
  const computedMetrics = useMemo(() => {
    const total = localAds.length
    const impressions = localAds.reduce((sum, item) => sum + item.impressions, 0)
    const clicks = localAds.reduce((sum, item) => sum + item.clicks, 0)
    const revenue = localAds.reduce((sum, item) => sum + item.revenue, 0)
    const ctr = impressions > 0 ? ((clicks / impressions) * 100) : 0
    const cpm = impressions > 0 ? ((revenue / impressions) * 1000) : 0

    return {
      total,
      impressions,
      clicks,
      revenue,
      ctr,
      cpm
    }
  }, [localAds])

  // Distributions logic
  const distributions = useMemo(() => {
    let videoCount = 0
    let imageCount = 0
    let overlayCount = 0
    let bannerCount = 0

    localAds.forEach(item => {
      if (item.type === 'Video') videoCount++
      else imageCount++

      if (item.position === 'Overlay') overlayCount++
      else if (item.position === 'Banner') bannerCount++
    })

    const total = localAds.length || 1

    return {
      video: { count: videoCount, pct: ((videoCount / total) * 100).toFixed(1) },
      image: { count: imageCount, pct: ((imageCount / total) * 100).toFixed(1) },
      overlay: { count: overlayCount, pct: ((overlayCount / total) * 100).toFixed(1) },
      banner: { count: bannerCount, pct: ((bannerCount / total) * 100).toFixed(1) }
    }
  }, [localAds])

  // Recharts structured donut representation
  const donutData = useMemo(() => [
    { name: 'Video Ads', value: distributions.video.count },
    { name: 'Image Ads', value: distributions.image.count },
    { name: 'Overlay Ads', value: distributions.overlay.count },
    { name: 'Banner Ads', value: distributions.banner.count },
  ], [distributions])

  // Filter ads for the timeline and All Ads List
  const filteredAds = useMemo(() => {
    return localAds.filter(item => {
      const matchesTab = filterType === 'All' || item.type === filterType
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter
      const matchesQuery = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.position.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesTab && matchesStatus && matchesQuery
    })
  }, [localAds, filterType, statusFilter, searchQuery])

  // Delete Ad handler
  const handleDeleteAd = async (id: string) => {
    try {
      // Optimistic delete local state
      setLocalAds(prev => prev.filter(ad => ad.id !== id))
      // Also request DB removal
      await fetch(`/api/ads?id=${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Error deleting ad creative:', err)
    }
  }

  // Toggle Ad status handler
  const handleToggleStatus = async (id: string, current: 'Active' | 'Paused') => {
    const nextStatus = current === 'Active' ? 'Paused' : 'Active'
    setLocalAds(prev => prev.map(ad => ad.id === id ? { ...ad, status: nextStatus } : ad))
    
    try {
      await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: nextStatus === 'Active' })
      })
    } catch (err) {
      console.warn('DB update sync skipped or offline:', err)
    }
  }

  return (
    <div className="space-y-5 p-3 text-white lg:p-5">
      {/* ─── HEADER BAR (Matches Screenshot) ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">Video Ads Analytics</h1>
          <p className="text-xs text-white/50 md:text-sm">Manage, analyze and optimize your video & image ads performance</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range picker dropdown */}
          <div className="flex h-9 items-center gap-2 rounded-lg border border-white/5 bg-[#121212] px-3 text-xs text-white/70 hover:border-white/10">
            <Calendar className="h-3.5 w-3.5 text-white/40" />
            <span>{dateRange}</span>
            <ChevronDown className="h-3.5 w-3.5 text-white/30" />
          </div>

          {/* Export Report Button */}
          <button className="flex h-9 items-center gap-2 rounded-lg border border-white/5 bg-[#121212] px-3 text-xs font-semibold text-white/90 hover:bg-white/[0.04]">
            <Download className="h-3.5 w-3.5 text-white/40" />
            <span>Export Report</span>
          </button>

          {/* Create New Ad Trigger */}
          <button 
            onClick={startSimulatedUpload}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-xtube-red px-3 text-xs font-semibold text-white transition-all hover:bg-xtube-red-hover"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Ad</span>
          </button>
        </div>
      </motion.div>

      {/* ─── KEY METRICS ROW (6 Gorgeous Cards matching screenshot) ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Card 1: Total Ads */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3.5 backdrop-blur-xl transition-all hover:border-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Total Ads</p>
              <p className="mt-1 text-lg font-bold text-white md:text-xl">{computedMetrics.total}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="font-semibold text-emerald-400">12.5%</span>
            <span className="text-white/30">from last 30 days</span>
          </div>
        </motion.div>

        {/* Card 2: Impressions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3.5 backdrop-blur-xl transition-all hover:border-purple-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Impressions</p>
              <p className="mt-1 text-lg font-bold text-white md:text-xl">
                {(computedMetrics.impressions / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="font-semibold text-emerald-400">18.7%</span>
            <span className="text-white/30">from last 30 days</span>
          </div>
        </motion.div>

        {/* Card 3: Clicks */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3.5 backdrop-blur-xl transition-all hover:border-green-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Clicks</p>
              <p className="mt-1 text-lg font-bold text-white md:text-xl">
                {(computedMetrics.clicks / 1000).toFixed(1)}K
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
              <MousePointer className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="font-semibold text-emerald-400">9.3%</span>
            <span className="text-white/30">from last 30 days</span>
          </div>
        </motion.div>

        {/* Card 4: Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3.5 backdrop-blur-xl transition-all hover:border-amber-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Revenue</p>
              <p className="mt-1 text-lg font-bold text-emerald-400 md:text-xl">
                ${computedMetrics.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="font-semibold text-emerald-400">16.4%</span>
            <span className="text-white/30">from last 30 days</span>
          </div>
        </motion.div>

        {/* Card 5: Avg. CTR */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3.5 backdrop-blur-xl transition-all hover:border-pink-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Avg. CTR</p>
              <p className="mt-1 text-lg font-bold text-white md:text-xl">{computedMetrics.ctr.toFixed(2)}%</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="font-semibold text-emerald-400">4.6%</span>
            <span className="text-white/30">from last 30 days</span>
          </div>
        </motion.div>

        {/* Card 6: Avg. CPM */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-3.5 backdrop-blur-xl transition-all hover:border-cyan-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Avg. CPM</p>
              <p className="mt-1 text-lg font-bold text-white md:text-xl">${computedMetrics.cpm.toFixed(2)}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="font-semibold text-emerald-400">8.2%</span>
            <span className="text-white/30">from last 30 days</span>
          </div>
        </motion.div>
      </div>

      {/* ─── GRAPH & DONUT ROW (3 Columns matching screenshot) ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Performance Over Time Widescreen Dual Chart (7/12 cols) */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl lg:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white md:text-base">Performance Over Time</h3>
              <Info className="h-3.5 w-3.5 text-white/20" />
            </div>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-7 w-[120px] border-white/5 bg-[#141414] text-[11px] text-white/70">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="border-white/5 bg-[#141414]">
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Last 14 Days">Last 14 Days</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dual lines chart */}
          <div className="h-56 w-full sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={initialPerformanceData}>
                <defs>
                  <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
                <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border border-white/5 bg-[#111] p-3 text-xs shadow-xl">
                        <p className="font-semibold text-white/50 mb-1.5">{payload[0].payload.date}</p>
                        <p className="text-blue-400 font-medium">Impressions: {payload[0].value?.toLocaleString()}</p>
                        <p className="text-green-400 font-medium">Clicks: {payload[1].value?.toLocaleString()}</p>
                        <p className="text-amber-400 font-medium">Revenue: ${payload[2].value}</p>
                      </div>
                    )
                  }}
                />
                <Area yAxisId="left" type="monotone" dataKey="impressions" stroke="#2563eb" strokeWidth={2} fill="url(#impressionsGrad)" name="Impressions" dot={{ r: 3 }} />
                <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#16a34a" strokeWidth={2} fill="url(#clicksGrad)" name="Clicks" dot={{ r: 3 }} />
                <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2.5} fill="none" name="Revenue" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2.5 flex items-center justify-center gap-6 text-[10px] text-white/55">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Impressions</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /> Clicks</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Revenue</span>
          </div>
        </div>

        {/* Ad Format Distribution Card (3/12 cols) */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl lg:col-span-3">
          <h3 className="mb-3 text-sm font-semibold text-white">Ad Format Distribution</h3>
          
          <div className="relative flex h-44 items-center justify-center sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Ring Text */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white">{computedMetrics.total}</span>
              <span className="text-[10px] text-white/40">Total Ads</span>
            </div>
          </div>

          {/* Distribution legend lists with counts and percentages */}
          <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4 lg:grid-cols-1">
            <div className="flex items-center justify-between border-b border-white/[0.03] pb-1.5">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#2563eb]" /> Video Ads</span>
              <span className="font-semibold">{distributions.video.count} <span className="text-white/40">({distributions.video.pct}%)</span></span>
            </div>
            <div className="flex items-center justify-between border-b border-white/[0.03] pb-1.5">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#16a34a]" /> Image Ads</span>
              <span className="font-semibold">{distributions.image.count} <span className="text-white/40">({distributions.image.pct}%)</span></span>
            </div>
            <div className="flex items-center justify-between border-b border-white/[0.03] pb-1.5">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#d97706]" /> Overlay Ads</span>
              <span className="font-semibold">{distributions.overlay.count} <span className="text-white/40">({distributions.overlay.pct}%)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#c084fc]" /> Banner Ads</span>
              <span className="font-semibold">{distributions.banner.count} <span className="text-white/40">({distributions.banner.pct}%)</span></span>
            </div>
          </div>
        </div>

        {/* Ad Type Distribution Card (3/12 cols) */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl lg:col-span-3">
          <h3 className="mb-4 text-sm font-semibold text-white">Ad Type Distribution</h3>
          
          <div className="space-y-3.5">
            {/* Pre-roll Ads */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/50">Pre-roll Ads</span>
                <span className="font-medium text-white">32 <span className="text-white/40">(25%)</span></span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-blue-500" style={{ width: '25%' }} />
              </div>
            </div>

            {/* Mid-roll Ads */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/50">Mid-roll Ads</span>
                <span className="font-medium text-white">68 <span className="text-white/40">(53%)</span></span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-green-500" style={{ width: '53%' }} />
              </div>
            </div>

            {/* Post-roll Ads */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/50">Post-roll Ads</span>
                <span className="font-medium text-white">12 <span className="text-white/40">(9%)</span></span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-amber-500" style={{ width: '9%' }} />
              </div>
            </div>

            {/* Overlay Ads */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/50">Overlay Ads</span>
                <span className="font-medium text-white">8 <span className="text-white/40">(6%)</span></span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-pink-500" style={{ width: '6%' }} />
              </div>
            </div>

            {/* Image Banner Ads */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/50">Image Banner Ads</span>
                <span className="font-medium text-white">8 <span className="text-white/40">(6%)</span></span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-purple-500" style={{ width: '6%' }} />
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/5 pt-3">
            <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-white/30 font-mono">
              <span>0</span>
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── UPLOAD, LIST, & TIMELINE ROW (3 Column Block matching screenshot) ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        
        {/* Column Block 1: Upload New Ad (3/12 cols) */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl lg:col-span-3">
          <h3 className="mb-3 text-sm font-semibold text-white">Upload New Ad</h3>

          {/* Video / Image tab pills */}
          <div className="mb-4 flex rounded-lg bg-white/5 p-0.5">
            <button
              onClick={() => setUploadTab('video')}
              className={`flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all ${uploadTab === 'video' ? 'bg-[#1a1a1a] text-white shadow' : 'text-white/50 hover:text-white'}`}
            >
              Video Ad
            </button>
            <button
              onClick={() => setUploadTab('image')}
              className={`flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all ${uploadTab === 'image' ? 'bg-[#1a1a1a] text-white shadow' : 'text-white/50 hover:text-white'}`}
            >
              Image Ad
            </button>
          </div>

          {/* Interactive Drag & Drop File Container */}
          <div 
            onClick={startSimulatedUpload}
            className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-4 text-center transition hover:border-xtube-red/40 hover:bg-white/[0.02]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 mb-2">
              <Upload className="h-4.5 w-4.5 text-white/60" />
            </div>
            <p className="text-xs text-white/80">Drag & drop video file here</p>
            <p className="text-[10px] text-white/40 mt-0.5">or</p>
            <button className="mt-2 rounded-md bg-xtube-red px-3 py-1 text-[10px] font-semibold hover:bg-xtube-red-hover">
              Choose File
            </button>
          </div>
          <p className="mt-1.5 text-[9px] text-white/30 text-center">Max file size: 5GB | Supported: MP4, WebM, MOV, HLS</p>

          {/* Real-time upload progress simulator */}
          <div className="mt-4 rounded-xl border border-white/5 bg-[#121212] p-3.5">
            <div className="flex items-start justify-between mb-1.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white/90">
                  {uploadTab === 'video' ? 'Ad_Video_4K_UHD.mp4' : 'Image_Creative_Banner.png'}
                </p>
                <p className="text-[10px] text-white/40">{uploadBytes}</p>
              </div>
              <span className="text-xs font-bold text-xtube-red">{Math.round(uploadProgress)}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div 
                className="h-full rounded-full bg-xtube-red transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[10px]">
              <span className="text-white/40">{uploadSpeed} MB/s - {uploadRemaining}</span>
              <button 
                onClick={() => setUploading(!uploading)}
                className="text-xtube-red font-semibold hover:underline"
              >
                {uploading ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>

          {/* Upload Quality Settings Options */}
          <div className="mt-4 space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40 block">Upload Quality</label>
            <div className="grid grid-cols-4 gap-1">
              {['Auto', '1080p', '2K', '4K'].map((q) => (
                <button
                  key={q}
                  onClick={() => setUploadQuality(q)}
                  className={`rounded-md border py-1.5 text-center text-[10px] font-semibold transition ${uploadQuality === q ? 'border-xtube-red bg-xtube-red/5 text-xtube-red' : 'border-white/5 bg-[#141414] text-white/60 hover:text-white'}`}
                >
                  {q === 'Auto' ? 'Auto ⬤' : q}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-white/30 mt-1">Auto quality will deliver best experience across all devices.</p>
          </div>
        </div>

        {/* Column Block 2: All Ads List Table (5/12 cols) */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl lg:col-span-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-white">All Ads List</h3>
            
            {/* Filter pills & search */}
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-lg bg-white/5 p-0.5">
                <button 
                  onClick={() => setFilterType('All')}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${filterType === 'All' ? 'bg-[#1a1a1a] text-white' : 'text-white/50 hover:text-white'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterType('Video')}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${filterType === 'Video' ? 'bg-[#1a1a1a] text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Video Ads
                </button>
                <button 
                  onClick={() => setFilterType('Image')}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${filterType === 'Image' ? 'bg-[#1a1a1a] text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Image Ads
                </button>
              </div>

              {/* Status Select Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 w-[95px] border-white/5 bg-[#141414] text-[10px] text-white/70">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-white/5 bg-[#141414]">
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Field */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search ads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-lg border border-white/5 bg-[#121212] px-3 text-xs text-white placeholder:text-white/30 focus:border-xtube-red/40 focus:outline-none"
            />
          </div>

          {/* Ads List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  <th className="pb-2">Ad Preview</th>
                  <th className="pb-2">Ad Name</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Placement</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="group hover:bg-white/[0.01]">
                    <td className="py-2.5">
                      <div className="h-9 w-16 overflow-hidden rounded-md border border-white/5 bg-[#161616]">
                        <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                    </td>
                    <td className="py-2.5 max-w-[110px] truncate">
                      <p className="font-semibold text-white/90 group-hover:text-xtube-red transition">{ad.title}</p>
                      <p className="text-[9px] text-white/40">{ad.resolution}</p>
                    </td>
                    <td className="py-2.5">
                      <Badge className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${ad.type === 'Video' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                        {ad.type}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-white/60">{ad.position}</td>
                    <td className="py-2.5 text-white/50">{ad.duration}</td>
                    <td className="py-2.5 text-center">
                      <button 
                        onClick={() => handleToggleStatus(ad.id, ad.status)}
                        className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${ad.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}
                      >
                        {ad.status}
                      </button>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1 text-white/40 hover:text-white transition" title="Preview ad redirect link">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1 text-white/40 hover:text-white transition" title="Edit ad settings">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1 text-white/40 hover:text-red-400 transition" 
                          title="Delete ad creative"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Custom pagination index list */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/55">
            <button className="flex h-6 w-6 items-center justify-center rounded border border-white/5 bg-[#141414] hover:text-white">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-6 w-6 items-center justify-center rounded bg-xtube-red font-bold text-white">1</span>
            <span className="flex h-6 w-6 items-center justify-center rounded border border-white/5 bg-[#141414] hover:text-white">2</span>
            <span className="flex h-6 w-6 items-center justify-center rounded border border-white/5 bg-[#141414] hover:text-white">3</span>
            <span className="px-1">...</span>
            <span className="flex h-6 w-6 items-center justify-center rounded border border-white/5 bg-[#141414] hover:text-white">10</span>
            <button className="flex h-6 w-6 items-center justify-center rounded border border-white/5 bg-[#141414] hover:text-white">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Column Block 3: Ads Timeline Schedules (4/12 cols) */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Ads Timeline (Unlimited Ads)</h3>
            <button 
              onClick={startSimulatedUpload}
              className="flex h-6 items-center gap-1 rounded bg-xtube-red px-2 text-[10px] font-semibold text-white hover:bg-xtube-red-hover"
            >
              <Plus className="h-3 w-3" />
              <span>Add Ad</span>
            </button>
          </div>

          {/* Target Video Selector */}
          <div className="mb-4 space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-wider block">Target Video</label>
            <Select value={timelineVideo} onValueChange={setTimelineVideo}>
              <SelectTrigger className="h-8 w-full border-white/5 bg-[#141414] text-xs text-white">
                <SelectValue placeholder="Choose Video Track" />
              </SelectTrigger>
              <SelectContent className="border-white/5 bg-[#141414]">
                <SelectItem value="video-ai-future">Video: The Future of AI Technology (02:00:00)</SelectItem>
                <SelectItem value="video-metaverse">Video: Metaverse Horizons (01:15:30)</SelectItem>
                <SelectItem value="video-space">Video: Deep Space Voids (00:45:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* HORIZONTAL TIMELINE BAR */}
          <div className="relative mb-6 rounded-lg bg-white/[0.02] p-3 border border-white/5">
            <div className="mb-2 flex items-center justify-between text-[9px] text-white/40">
              <span>00:00</span>
              <span>00:30:00</span>
              <span>01:00:00</span>
              <span>01:30:00</span>
              <span>02:00:00</span>
            </div>

            {/* Main horizontal line axis */}
            <div className="relative h-2 w-full rounded-full bg-white/10">
              {/* Highlight active play segments */}
              <div className="absolute left-[10%] right-[30%] h-full bg-xtube-red/20 rounded-full" />
              
              {/* Ad position markers aligned horizontally */}
              <div className="absolute top-1/2 left-[8%] -translate-y-1/2 cursor-pointer" title="Pre-roll: Nike 4K (00:10:00)">
                <div className="h-3 w-3 rounded-full bg-blue-500 border border-black shadow" />
              </div>
              <div className="absolute top-1/2 left-[25%] -translate-y-1/2 cursor-pointer" title="Mid-roll: Coca-Cola (00:25:30)">
                <div className="h-3 w-3 rounded-full bg-green-400 border border-black shadow" />
              </div>
              <div className="absolute top-1/2 left-[45%] -translate-y-1/2 cursor-pointer" title="Mid-roll: Samsung Galaxy (00:45:00)">
                <div className="h-3 w-3 rounded-full bg-blue-500 border border-black shadow" />
              </div>
              <div className="absolute top-1/2 left-[70%] -translate-y-1/2 cursor-pointer" title="Overlay: Amazon Big Sale (01:10:20)">
                <div className="h-3 w-3 rounded-full bg-amber-400 border border-black shadow" />
              </div>
              <div className="absolute top-1/2 left-[90%] -translate-y-1/2 cursor-pointer" title="Post-roll: Car Brand (01:40:00)">
                <div className="h-3 w-3 rounded-full bg-blue-500 border border-black shadow" />
              </div>
            </div>

            {/* Markers Legend Indicators */}
            <div className="mt-3 flex justify-center gap-4 text-[9px]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Video Ad</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-400" /> Image Ad</span>
            </div>
          </div>

          {/* Interactive schedules list matching timeline markers */}
          <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1">
            {/* Item 1 */}
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.01] border border-white/5 p-2 text-xs">
              <span className="text-[10px] font-mono text-white/50">00:10:00</span>
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=100" alt="Nike" className="h-7 w-12 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-white/90">Nike 4K Video Ad</p>
                <p className="text-[9px] text-blue-400 font-semibold">Video • 00:30</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1 text-white/40 hover:text-white"><Pencil className="h-3 w-3" /></button>
                <button className="p-1 text-white/40 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.01] border border-white/5 p-2 text-xs">
              <span className="text-[10px] font-mono text-white/50">00:25:30</span>
              <img src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=100" alt="Coke" className="h-7 w-12 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-white/90">Coca-Cola Banner</p>
                <p className="text-[9px] text-green-400 font-semibold">Image</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1 text-white/40 hover:text-white"><Pencil className="h-3 w-3" /></button>
                <button className="p-1 text-white/40 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.01] border border-white/5 p-2 text-xs">
              <span className="text-[10px] font-mono text-white/50">00:45:00</span>
              <img src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=100" alt="Samsung" className="h-7 w-12 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-white/90">Samsung Galaxy Ad</p>
                <p className="text-[9px] text-blue-400 font-semibold">Video • 00:15</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1 text-white/40 hover:text-white"><Pencil className="h-3 w-3" /></button>
                <button className="p-1 text-white/40 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM BLOCK ROW (4 Columns matching screenshot) ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Top Performing Ads */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl">
          <h3 className="mb-3 text-sm font-semibold text-white">Top Performing Ads</h3>
          
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.01] border border-white/5 p-2.5">
              <span className="text-xs font-bold text-xtube-red">1</span>
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=80" className="h-7 w-12 rounded object-cover" alt="Nike" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-white/90">Nike 4K Video Ad</p>
                <p className="text-[10px] text-emerald-400 font-bold">$4,250.75</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.01] border border-white/5 p-2.5">
              <span className="text-xs font-bold text-amber-500">2</span>
              <img src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=80" className="h-7 w-12 rounded object-cover" alt="Samsung" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-white/90">Samsung Galaxy Ad</p>
                <p className="text-[10px] text-emerald-400 font-bold">$3,845.20</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.01] border border-white/5 p-2.5">
              <span className="text-xs font-bold text-white/40">3</span>
              <img src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=80" className="h-7 w-12 rounded object-cover" alt="Coke" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-white/90">Coca-Cola Banner</p>
                <p className="text-[10px] text-emerald-400 font-bold">$2,125.60</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Device Performance Donut */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl">
          <h3 className="mb-3 text-sm font-semibold text-white">Device Performance</h3>
          
          <div className="flex items-center gap-2">
            <div className="relative h-28 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Mobile', value: 52.5 },
                      { name: 'Desktop', value: 28.7 },
                      { name: 'Tablet', value: 18.8 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed legend rates */}
            <div className="flex-1 space-y-2 text-[10px]">
              <div className="flex items-center justify-between border-b border-white/[0.03] pb-1">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> Mobile</span>
                <span className="font-semibold text-white/90">52.5% <span className="text-white/40">(1.28M)</span></span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.03] pb-1">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#10b981]" /> Desktop</span>
                <span className="font-semibold text-white/90">28.7% <span className="text-white/40">(701K)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Tablet</span>
                <span className="font-semibold text-white/90">18.8% <span className="text-white/40">(461K)</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Top Countries List */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl">
          <h3 className="mb-3 text-sm font-semibold text-white">Top Countries</h3>
          
          <div className="space-y-2 text-xs">
            {/* USA */}
            <div>
              <div className="mb-0.5 flex justify-between text-[11px]">
                <span className="flex items-center gap-1.5">🇺🇸 <span className="text-white/80">United States</span></span>
                <span className="font-semibold">45.6%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5">
                <div className="h-full rounded-full bg-blue-500" style={{ width: '45.6%' }} />
              </div>
            </div>

            {/* India */}
            <div>
              <div className="mb-0.5 flex justify-between text-[11px]">
                <span className="flex items-center gap-1.5">🇮🇳 <span className="text-white/80">India</span></span>
                <span className="font-semibold">24.3%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5">
                <div className="h-full rounded-full bg-green-500" style={{ width: '24.3%' }} />
              </div>
            </div>

            {/* United Kingdom */}
            <div>
              <div className="mb-0.5 flex justify-between text-[11px]">
                <span className="flex items-center gap-1.5">🇬🇧 <span className="text-white/80">United Kingdom</span></span>
                <span className="font-semibold">10.2%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5">
                <div className="h-full rounded-full bg-amber-500" style={{ width: '10.2%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Interactive Ads Settings Panel */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl">
          <h3 className="mb-3 text-sm font-semibold text-white">Ads Settings</h3>

          <div className="space-y-2.5 text-xs text-white/85">
            {/* Auto Ads Switch */}
            <div className="flex items-center justify-between">
              <span className="text-white/60">Auto Ads</span>
              <button 
                onClick={() => setSettingsAutoAds(!settingsAutoAds)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${settingsAutoAds ? 'bg-xtube-red' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settingsAutoAds ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Skip Ads Select Dropdown */}
            <div className="flex items-center justify-between">
              <span className="text-white/60">Skip Ads After</span>
              <Select value={settingsSkipAfter} onValueChange={setSettingsSkipAfter}>
                <SelectTrigger className="h-7 w-[100px] border-white/5 bg-[#141414] text-[11px] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/5 bg-[#141414]">
                  <SelectItem value="5s">5 Seconds</SelectItem>
                  <SelectItem value="10s">10 Seconds</SelectItem>
                  <SelectItem value="15s">15 Seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Ads Per Video */}
            <div className="flex items-center justify-between">
              <span className="text-white/60">Max Ads Per Video</span>
              <Select value={settingsMaxPerVideo} onValueChange={setSettingsMaxPerVideo}>
                <SelectTrigger className="h-7 w-[100px] border-white/5 bg-[#141414] text-[11px] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/5 bg-[#141414]">
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                  <SelectItem value="1">1 Ad</SelectItem>
                  <SelectItem value="2">2 Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Minimum Gap Between Ads */}
            <div className="flex items-center justify-between">
              <span className="text-white/60">Minimum Gap</span>
              <Select value={settingsGap} onValueChange={setSettingsGap}>
                <SelectTrigger className="h-7 w-[100px] border-white/5 bg-[#141414] text-[11px] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/5 bg-[#141414]">
                  <SelectItem value="10m">10 Minutes</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="20m">20 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
