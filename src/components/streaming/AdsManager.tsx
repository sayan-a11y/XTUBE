'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Megaphone,
  Eye,
  MousePointer,
  DollarSign,
  Plus,
  Trash2,
  MoreVertical,
  TrendingUp,
  X,
  ImageIcon,
  Clock,
  SkipForward,
  BarChart3,
  ExternalLink,
  Volume2,
  Pause,
  Play,
  Maximize,
  Smartphone,
  Tablet,
  Monitor,
  Layout,
  CheckCircle2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { VideoAdsAnalytics } from '@/components/admin/VideoAdsAnalytics'

interface AdsManagerProps {
  ads: Array<{
    id: string
    type: string
    position: string
    title: string
    imageUrl: string
    linkUrl?: string
    impressions: number
    clicks: number
    revenue: number
    isActive: boolean
    createdAt: string
  }>
  onCreate: (data: Record<string, unknown>) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  loading?: boolean
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatCurrency(num: number): string {
  return '$' + num.toLocaleString()
}

function getCTR(clicks: number, impressions: number): string {
  if (impressions === 0) return '0%'
  return ((clicks / impressions) * 100).toFixed(2) + '%'
}

// Section display configuration
const sectionConfig: Record<string, { title: string; description: string }> = {
  'all-ads': { title: 'All Ads Dashboard', description: 'Manage all active ad campaigns across every type and position' },
  'banner-ads': { title: 'Banner Ads Manager', description: 'Display and schedule sleek banners across the platform' },
  'popup-ads': { title: 'Popup Ads Manager', description: 'Configure high-conversion overlay popup ad campaigns' },
  'hero-footer-ads': { title: 'Footer Ads Manager', description: 'High-performance video and image footer advertisement placements' },
  'hero-ads': { title: 'Hero Slider Ads', description: 'Top promo slider banners with video overlays' },
  'pre-roll-ads': { title: 'Pre-Roll Video Ads', description: 'Video commercials played before the content starts' },
  'mid-roll-ads': { title: 'Mid-Roll Video Ads', description: 'Video commercials inserted during content playback' },
  'post-roll-ads': { title: 'Post-Roll Video Ads', description: 'Video commercials played at the end of videos' },
  'overlay-ads': { title: 'Overlay Ads Manager', description: 'Semi-transparent bottom banners displaying on video players' },
}

// Custom chart tooltip
function AdChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/5 bg-[#0f0f0f]/95 px-3 py-2 shadow-lg backdrop-blur-xl">
      <p className="mb-1 text-xs text-xtube-text-secondary">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

// Stagger animation container variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export function AdsManager({ ads, onCreate, onDelete, onToggle, loading }: AdsManagerProps) {
  const adminSection = useAppStore((s) => s.adminSection)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null)

  // Interactive video ad states
  const [skipTimer, setSkipTimer] = useState(5)
  const [adIsPlaying, setAdIsPlaying] = useState(true)
  const [adWasSkipped, setAdWasSkipped] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'banner',
    position: 'hero',
    imageUrl: '',
    linkUrl: '',
    startDate: '',
    endDate: '',
    frequency: '1',
  })

  // Pre-fill creation form fields dynamically based on the current tab
  useEffect(() => {
    if (createOpen) {
      let type = 'banner'
      let position = 'hero'

      switch (adminSection) {
        case 'banner-ads':
          type = 'banner'
          position = 'footer'
          break
        case 'popup-ads':
          type = 'popup'
          position = 'entry'
          break
        case 'hero-footer-ads':
          type = 'banner'
          position = 'footer'
          break
        case 'hero-ads':
          type = 'banner'
          position = 'hero'
          break
        case 'pre-roll-ads':
          type = 'video'
          position = 'pre-roll'
          break
        case 'mid-roll-ads':
          type = 'video'
          position = 'mid-roll'
          break
        case 'post-roll-ads':
          type = 'video'
          position = 'post-roll'
          break
        case 'overlay-ads':
          type = 'overlay'
          position = 'pre-roll'
          break
      }

      setCreateForm({
        title: '',
        type,
        position,
        imageUrl: '',
        linkUrl: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        frequency: '1',
      })
    }
  }, [createOpen, adminSection])

  // Filter ads based on adminSection from store
  const sectionFilteredAds = useMemo(() => {
    switch (adminSection) {
      case 'banner-ads':
        return ads.filter((ad) => ad.type === 'banner')
      case 'popup-ads':
        return ads.filter((ad) => ad.type === 'popup')
      case 'hero-footer-ads':
        return ads.filter((ad) => ad.position === 'footer')
      case 'hero-ads':
        return ads.filter((ad) => ad.position === 'hero')
      case 'pre-roll-ads':
        return ads.filter((ad) => ad.position === 'pre-roll')
      case 'mid-roll-ads':
        return ads.filter((ad) => ad.position === 'mid-roll')
      case 'post-roll-ads':
        return ads.filter((ad) => ad.position === 'post-roll')
      case 'overlay-ads':
        return ads.filter((ad) => ad.type === 'overlay' || ad.position === 'overlay')
      case 'all-ads':
      default:
        return ads
    }
  }, [ads, adminSection])

  // Apply search query & custom drop-down filters
  const filteredAds = useMemo(() => {
    let result = [...sectionFilteredAds]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((ad) => ad.title.toLowerCase().includes(q))
    }

    if (typeFilter !== 'all') {
      result = result.filter((ad) => ad.type === typeFilter)
    }

    if (positionFilter !== 'all') {
      result = result.filter((ad) => ad.position === positionFilter)
    }

    return result
  }, [sectionFilteredAds, searchQuery, typeFilter, positionFilter])

  // Automatically select the first visible ad when the list updates
  const selectedAd = useMemo(() => {
    if (selectedAdId) {
      const found = filteredAds.find((a) => a.id === selectedAdId)
      if (found) return found
    }
    return filteredAds[0] || null
  }, [filteredAds, selectedAdId])

  // Live preview ad state: displays live form entries if form is open, else the selected database ad
  const previewAd = useMemo(() => {
    if (createOpen && (createForm.title || createForm.imageUrl)) {
      return {
        id: 'new-form-preview',
        title: createForm.title || 'Unsaved Ad Campaign',
        type: createForm.type,
        position: createForm.position,
        imageUrl: createForm.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60',
        linkUrl: createForm.linkUrl || '#',
        impressions: 0,
        clicks: 0,
        revenue: 0,
        isActive: true,
        createdAt: 'Just now',
      }
    }
    return selectedAd
  }, [createOpen, createForm, selectedAd])

  // Video skip countdown timer loop
  useEffect(() => {
    if (previewAd?.type === 'video' || ['pre-roll', 'mid-roll', 'post-roll'].includes(previewAd?.position || '')) {
      setSkipTimer(5)
      setAdWasSkipped(false)
      setAdIsPlaying(true)
    }
  }, [previewAd])

  useEffect(() => {
    if (!adIsPlaying || adWasSkipped) return
    const isVideo = previewAd?.type === 'video' || ['pre-roll', 'mid-roll', 'post-roll'].includes(previewAd?.position || '')
    if (!isVideo) return

    const interval = setInterval(() => {
      setSkipTimer((t) => {
        if (t <= 1) {
          clearInterval(interval)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [previewAd, adIsPlaying, adWasSkipped])

  // Overview stats based on the currently filtered active ads set
  const totalImpressions = filteredAds.reduce((sum, ad) => sum + ad.impressions, 0)
  const totalClicks = filteredAds.reduce((sum, ad) => sum + ad.clicks, 0)
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'
  const totalRevenue = filteredAds.reduce((sum, ad) => sum + ad.revenue, 0)

  // Chart data configuration
  const chartData = filteredAds.slice(0, 8).map((ad) => ({
    name: ad.title.length > 12 ? ad.title.substring(0, 12) + '...' : ad.title,
    Impressions: ad.impressions,
    Clicks: ad.clicks,
  }))

  const avgCTR = filteredAds.length > 0
    ? (filteredAds.reduce((sum, ad) => sum + (ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0), 0) / filteredAds.length).toFixed(2)
    : '0'

  const isVideoSection = ['pre-roll-ads', 'mid-roll-ads', 'post-roll-ads'].includes(adminSection)
  const totalWatchTime = isVideoSection
    ? formatNumber(filteredAds.reduce((sum, ad) => sum + ad.impressions * 15, 0))
    : formatNumber(filteredAds.reduce((sum, ad) => sum + ad.impressions * 3, 0))

  const skipRate = isVideoSection
    ? (Math.min(85, Math.max(20, 100 - parseFloat(avgCTR) * 10))).toFixed(1) + '%'
    : '--'

  const revenuePerImpression = totalImpressions > 0
    ? '$' + (totalRevenue / totalImpressions).toFixed(4)
    : '$0.0000'

  const sectionInfo = sectionConfig[adminSection] || sectionConfig['all-ads']

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({
      ...createForm,
      isActive: true,
      impressions: 0,
      clicks: 0,
      revenue: 0,
    })
    setCreateOpen(false)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setPositionFilter('all')
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-xtube-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <Skeleton className="h-[400px] rounded-xl bg-xtube-card" />
          <Skeleton className="h-[400px] rounded-xl bg-xtube-card" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-3 lg:p-5">
      {/* ─── Top Page Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">{sectionInfo.title}</h2>
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[10px] uppercase font-bold text-emerald-400">SSE Realtime Active</span>
          </div>
          <p className="text-xs text-xtube-text-secondary">{sectionInfo.description}</p>
          <p className="mt-0.5 text-xs text-xtube-text-secondary">
            Displaying <span className="font-semibold text-xtube-red">{filteredAds.length}</span> connected campaigns
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-xtube-red hover:bg-xtube-red-hover font-semibold transition-all hover:shadow-[0_0_15px_rgba(229,9,20,0.4)]">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Ad Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-white/5 bg-[#0a0a0c]/98 backdrop-blur-xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-xtube-red" />
                Schedule New Ad Campaign
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-white text-xs font-semibold">Ad Campaign Title</Label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Summer Promo 2026"
                  className="border-white/10 bg-black/60 text-white placeholder:text-white/30 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-white text-xs font-semibold">Format / Type</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(v) => setCreateForm({ ...createForm, type: v })}
                  >
                    <SelectTrigger className="w-full border-white/10 bg-black/60 text-white text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f0f11]">
                      <SelectItem value="banner" className="text-xs focus:bg-white/5">Banner Ad</SelectItem>
                      <SelectItem value="popup" className="text-xs focus:bg-white/5">Popup Overlay</SelectItem>
                      <SelectItem value="overlay" className="text-xs focus:bg-white/5">Video Overlay Banner</SelectItem>
                      <SelectItem value="video" className="text-xs focus:bg-white/5">Commercial Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white text-xs font-semibold">Platform Position</Label>
                  <Select
                    value={createForm.position}
                    onValueChange={(v) => setCreateForm({ ...createForm, position: v })}
                  >
                    <SelectTrigger className="w-full border-white/10 bg-black/60 text-white text-xs">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f0f11]">
                      <SelectItem value="hero" className="text-xs focus:bg-white/5">Hero Slider</SelectItem>
                      <SelectItem value="sidebar" className="text-xs focus:bg-white/5">Sidebar Widget</SelectItem>
                      <SelectItem value="footer" className="text-xs focus:bg-white/5">Footer Banner</SelectItem>
                      <SelectItem value="entry" className="text-xs focus:bg-white/5">Entry Intent</SelectItem>
                      <SelectItem value="exit" className="text-xs focus:bg-white/5">Exit Intent</SelectItem>
                      <SelectItem value="pre-roll" className="text-xs focus:bg-white/5">Pre-Roll (Commercial)</SelectItem>
                      <SelectItem value="mid-roll" className="text-xs focus:bg-white/5">Mid-Roll (Commercial)</SelectItem>
                      <SelectItem value="post-roll" className="text-xs focus:bg-white/5">Post-Roll (Commercial)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white text-xs font-semibold">Creative Image / Thumbnail URL</Label>
                <Input
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/creative.jpg"
                  className="border-white/10 bg-black/60 text-white placeholder:text-white/30 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white text-xs font-semibold">Destination / Redirect Link URL</Label>
                <Input
                  value={createForm.linkUrl}
                  onChange={(e) => setCreateForm({ ...createForm, linkUrl: e.target.value })}
                  placeholder="https://brand.com/landing"
                  className="border-white/10 bg-black/60 text-white placeholder:text-white/30 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-white text-xs font-semibold">Start Campaign Date</Label>
                  <Input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="border-white/10 bg-black/60 text-white text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white text-xs font-semibold">Frequency (cap/session)</Label>
                  <Input
                    type="number"
                    value={createForm.frequency}
                    onChange={(e) => setCreateForm({ ...createForm, frequency: e.target.value })}
                    placeholder="1"
                    min="1"
                    className="border-white/10 bg-black/60 text-white text-xs"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-xtube-red hover:bg-xtube-red-hover font-semibold mt-3">
                Deploy Campaign
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* ─── Realtime Analytics Counter Cards ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          { label: 'Total Impressions', val: formatNumber(totalImpressions), color: '#3b82f6', icon: Eye },
          { label: 'Total Clickthroughs', val: formatNumber(totalClicks), color: '#ec4899', icon: MousePointer },
          { label: 'Average CTR', val: overallCTR + '%', color: '#10b981', icon: TrendingUp },
          { label: 'Accumulated Revenue', val: formatCurrency(totalRevenue), color: '#f97316', icon: DollarSign }
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0f]/80 p-3 lg:p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:shadow-lg"
          >
            <div className="absolute left-0 top-0 h-[2px] w-full" style={{ background: `linear-gradient(to right, ${stat.color}, transparent)` }} />
            <div className="flex items-center justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">{stat.label}</p>
                <p className="text-lg font-bold text-white">{stat.val}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${stat.color}15` }}>
                <stat.icon className="h-4.5 w-4.5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Double Column Main Layout ─── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_390px] 2xl:grid-cols-[1fr_430px]">
        
        {/* LEFT COLUMN: Charts, Filters, and Table */}
        <div className="space-y-4 min-w-0">
          
          {/* Performance chart */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl border border-white/5 bg-[#0B0B0F]/80 p-4 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-xtube-red" />
                Performance Metrics (Chart representation)
              </h3>
            </div>
            {chartData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                    <Tooltip content={<AdChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Impressions" fill="#E50914" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Clicks" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center gap-2">
                <BarChart3 className="h-8 w-8 text-white/20" />
                <p className="text-xs text-white/45">No performance data compiled yet</p>
              </div>
            )}
          </motion.div>

          {/* Quick Filters */}
          <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-[#0B0B0F]/80 p-3 backdrop-blur-xl md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ads by title..."
                className="border-white/5 bg-black/40 pl-8 text-xs text-white placeholder:text-white/30 h-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full border-white/5 bg-black/40 text-xs text-white/60 h-8 md:w-32">
                <SelectValue placeholder="All Formats" />
              </SelectTrigger>
              <SelectContent className="border-white/5 bg-[#0f0f11]">
                <SelectItem value="all" className="text-xs focus:bg-white/5">All Formats</SelectItem>
                <SelectItem value="banner" className="text-xs focus:bg-white/5">Banner</SelectItem>
                <SelectItem value="popup" className="text-xs focus:bg-white/5">Popup</SelectItem>
                <SelectItem value="overlay" className="text-xs focus:bg-white/5">Overlay</SelectItem>
                <SelectItem value="video" className="text-xs focus:bg-white/5">Video</SelectItem>
              </SelectContent>
            </Select>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full border-white/5 bg-black/40 text-xs text-white/60 h-8 md:w-32">
                <SelectValue placeholder="All Slots" />
              </SelectTrigger>
              <SelectContent className="border-white/5 bg-[#0f0f11]">
                <SelectItem value="all" className="text-xs focus:bg-white/5">All Slots</SelectItem>
                <SelectItem value="hero" className="text-xs focus:bg-white/5">Hero Slider</SelectItem>
                <SelectItem value="footer" className="text-xs focus:bg-white/5">Footer</SelectItem>
                <SelectItem value="pre-roll" className="text-xs focus:bg-white/5">Pre-Roll</SelectItem>
                <SelectItem value="mid-roll" className="text-xs focus:bg-white/5">Mid-Roll</SelectItem>
                <SelectItem value="post-roll" className="text-xs focus:bg-white/5">Post-Roll</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || typeFilter !== 'all' || positionFilter !== 'all') && (
              <Button onClick={resetFilters} variant="ghost" size="sm" className="h-8 text-xs text-xtube-red hover:text-white">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Video Ads Analytics segment */}
          {['pre-roll-ads', 'mid-roll-ads', 'post-roll-ads', 'overlay-ads'].includes(adminSection) && (
            <VideoAdsAnalytics ads={ads} />
          )}

          {/* Database Campaigns Table */}
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80 backdrop-blur-xl">
            <div className="max-h-[480px] overflow-y-auto no-scrollbar">
              <Table>
                <TableHeader className="bg-black/20 sticky top-0 z-10">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-white/40 text-[10px] uppercase font-semibold h-9">Creative</TableHead>
                    <TableHead className="text-white/40 text-[10px] uppercase font-semibold h-9">Campaign</TableHead>
                    <TableHead className="text-white/40 text-[10px] uppercase font-semibold h-9">Format</TableHead>
                    <TableHead className="text-white/40 text-[10px] uppercase font-semibold h-9">Impressions</TableHead>
                    <TableHead className="text-white/40 text-[10px] uppercase font-semibold h-9">Clicks</TableHead>
                    <TableHead className="text-white/40 text-[10px] uppercase font-semibold h-9">CTR</TableHead>
                    <TableHead className="text-white/40 text-[10px] uppercase font-semibold h-9">Revenue</TableHead>
                    <TableHead className="text-white/40 text-[10px] uppercase font-semibold h-9">Status</TableHead>
                    <TableHead className="text-white/40 text-[10px] uppercase font-semibold h-9 text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredAds.length === 0 ? (
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableCell colSpan={9} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Megaphone className="h-8 w-8 text-white/20" />
                            <p className="text-sm font-semibold text-white">No ad campaigns found</p>
                            <p className="text-xs text-xtube-text-secondary">Create a campaign or adjust search criteria to begin.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAds.map((ad, idx) => {
                        const isSelected = selectedAd?.id === ad.id
                        return (
                          <motion.tr
                            key={ad.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => setSelectedAdId(ad.id)}
                            className={`border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                              isSelected ? 'bg-white/[0.03] border-l-2 border-l-xtube-red' : ''
                            }`}
                          >
                            <TableCell className="py-2.5">
                              <div className="relative h-8 w-12 overflow-hidden rounded bg-black/60 border border-white/5">
                                <img
                                  src={ad.imageUrl}
                                  alt={ad.title}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=40'
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5">
                              <p className="text-xs font-semibold text-white max-w-[120px] truncate">{ad.title}</p>
                              <p className="text-[9px] text-white/30">ID: {ad.id.slice(0, 8)}</p>
                            </TableCell>
                            <TableCell className="py-2.5 capitalize text-xs text-white/70">
                              <Badge variant="outline" className="border-xtube-red/20 bg-xtube-red/5 text-[10px] text-xtube-red h-5 font-normal px-2">
                                {ad.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5 text-xs text-white/60">{formatNumber(ad.impressions)}</TableCell>
                            <TableCell className="py-2.5 text-xs text-white/60">{formatNumber(ad.clicks)}</TableCell>
                            <TableCell className="py-2.5 text-xs font-bold text-xtube-red">{getCTR(ad.clicks, ad.impressions)}</TableCell>
                            <TableCell className="py-2.5 text-xs text-emerald-400 font-semibold">{formatCurrency(ad.revenue)}</TableCell>
                            <TableCell className="py-2.5">
                              <Badge
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onToggle(ad.id)
                                }}
                                className={`cursor-pointer transition-colors text-[9px] font-semibold h-5 px-1.5 ${
                                  ad.isActive
                                    ? 'border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/25'
                                    : 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/25'
                                }`}
                              >
                                {ad.isActive ? 'Active' : 'Paused'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5 text-right pr-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="border-white/5 bg-[#0f0f11] backdrop-blur-xl" align="end">
                                  <DropdownMenuItem
                                    className="text-xs text-white focus:bg-white/5 cursor-pointer"
                                    onClick={() => onToggle(ad.id)}
                                  >
                                    {ad.isActive ? 'Pause Campaign' : 'Resume Campaign'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-xs text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                                    onClick={() => onDelete(ad.id)}
                                  >
                                    Delete Campaign
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        )
                      })
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Luxurious Sticky Ad Preview Card */}
        <div className="xl:sticky xl:top-6 space-y-4 h-fit">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80 p-4 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Layout className="h-4 w-4 text-xtube-red" />
                  Live Campaign Preview
                </h3>
                <p className="text-[10px] text-xtube-text-secondary mt-0.5">Real-time design mockup visualizer</p>
              </div>

              {/* Device switcher */}
              <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5 border border-white/5">
                {[
                  { mode: 'desktop', icon: Monitor },
                  { mode: 'tablet', icon: Tablet },
                  { mode: 'mobile', icon: Smartphone }
                ].map((device) => (
                  <button
                    key={device.mode}
                    onClick={() => setPreviewDevice(device.mode as any)}
                    className={`p-1 rounded transition-colors ${
                      previewDevice === device.mode
                        ? 'bg-xtube-red text-white'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <device.icon className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Workspace Wrapper */}
            <div
              className="relative mx-auto overflow-hidden rounded-lg bg-black border border-white/5 transition-all duration-300"
              style={{
                width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '85%' : '65%',
                aspectRatio: '16/10'
              }}
            >
              {/* Dynamic rendering depending on type and position */}
              {previewAd ? (
                (() => {
                  const isVideo = previewAd.type === 'video' || ['pre-roll', 'mid-roll', 'post-roll'].includes(previewAd.position)
                  const isPopup = previewAd.type === 'popup' || ['entry', 'exit'].includes(previewAd.position)
                  const isOverlay = previewAd.type === 'overlay'

                  // A. COMMERCIAL VIDEO AD PREVIEW (Pre/Mid/Post-Roll)
                  if (isVideo) {
                    return (
                      <div className="relative w-full h-full bg-[#08080c] flex flex-col justify-between overflow-hidden">
                        {/* Nike style ad mockup background */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src={previewAd.imageUrl}
                            alt="Video ad scene"
                            className="w-full h-full object-cover opacity-75"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        </div>

                        {/* Top ad tag info */}
                        <div className="relative z-10 flex items-center justify-between p-2.5">
                          <Badge className="bg-black/60 text-[9px] border border-white/10 font-bold tracking-wider text-xtube-red gap-1 px-2 h-5">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-xtube-red" />
                            ADVERTISEMENT PREVIEW
                          </Badge>
                          <a
                            href={previewAd.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded bg-black/60 border border-white/10 px-2 py-0.5 text-[8px] text-white/70 hover:text-white"
                          >
                            Learn More <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>

                        {/* Interactive overlay card */}
                        <div className="relative z-10 p-2.5 flex items-end justify-between">
                          <div className="text-left space-y-0.5 max-w-[50%]">
                            <p className="text-[10px] font-bold text-white drop-shadow">{previewAd.title}</p>
                            <p className="text-[8px] text-white/60 drop-shadow truncate">{previewAd.linkUrl}</p>
                          </div>

                          {/* Skip ad interactive indicator */}
                          <AnimatePresence mode="wait">
                            {adWasSkipped ? (
                              <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-emerald-500/90 text-white font-bold text-[9px] rounded px-3 py-1 flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Ad Skipped Successfully
                              </motion.div>
                            ) : skipTimer > 0 ? (
                              <div className="bg-black/80 backdrop-blur border border-white/10 text-white/80 font-medium text-[8px] rounded px-2.5 py-1">
                                Skip in {skipTimer}s
                              </div>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setAdWasSkipped(true)}
                                className="bg-xtube-red hover:bg-xtube-red-hover text-white font-bold text-[9px] rounded px-3 py-1 shadow-lg"
                              >
                                Skip Ad <SkipForward className="inline-block ml-1 h-2.5 w-2.5" />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Video Controls Bar */}
                        <div className="relative z-10 bg-black/60 border-t border-white/5 px-2 py-1 flex items-center justify-between text-white/50 text-[9px]">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setAdIsPlaying(!adIsPlaying)}>
                              {adIsPlaying ? <Pause className="h-3 w-3 text-white" /> : <Play className="h-3 w-3 text-white" />}
                            </button>
                            <Volume2 className="h-3 w-3" />
                            <span>0:0{5 - skipTimer} / 0:05</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[7px] text-xtube-red bg-xtube-red/10 border border-xtube-red/20 px-1 rounded">PRE-ROLL</span>
                            <Maximize className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // B. FULL SCREEN MODAL POPUP PREVIEW
                  if (isPopup) {
                    return (
                      <div className="relative w-full h-full bg-[#050508] p-2 flex flex-col overflow-hidden">
                        {/* Wireframe header */}
                        <div className="h-3 w-full bg-white/5 rounded mb-2 flex items-center px-1.5 justify-between">
                          <span className="h-1 w-8 bg-white/10 rounded-full" />
                          <div className="flex gap-1">
                            <span className="h-1 w-1 bg-white/20 rounded-full" />
                            <span className="h-1 w-1 bg-white/20 rounded-full" />
                          </div>
                        </div>

                        {/* Simulated Page Grid */}
                        <div className="flex-1 grid grid-cols-3 gap-1.5 opacity-15">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-video bg-white/5 rounded border border-white/5" />
                          ))}
                        </div>

                        {/* Centered Glowing Popup Modal */}
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#0f0f13] border border-white/10 rounded-xl p-3 w-full max-w-[200px] text-center space-y-2.5 shadow-2xl relative"
                          >
                            {/* Close cross indicator */}
                            <div className="absolute top-1.5 right-1.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-white/5 border border-white/10 cursor-pointer">
                              <X className="h-2 w-2 text-white/50" />
                            </div>

                            {/* Ad creative image */}
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-white/5">
                              <img
                                src={previewAd.imageUrl}
                                alt="Popup creative"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60'
                                }}
                              />
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-[10px] font-bold text-white leading-tight">{previewAd.title}</h4>
                              <p className="text-[7px] text-white/40">Exclusive Limited Promo Offer</p>
                            </div>

                            <a
                              href={previewAd.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block w-full bg-xtube-red hover:bg-xtube-red-hover text-[8px] font-semibold text-white py-1 rounded shadow"
                            >
                              GET DEAL NOW
                            </a>
                          </motion.div>
                        </div>
                      </div>
                    )
                  }

                  // C. VIDEO OVERLAY BANNER AD PREVIEW
                  if (isOverlay) {
                    return (
                      <div className="relative w-full h-full bg-[#08080c] flex flex-col justify-between overflow-hidden">
                        {/* Mock video player background */}
                        <div className="absolute inset-0 z-0 opacity-40">
                          <img
                            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=60"
                            alt="Video play background"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Top ad tag info */}
                        <div className="relative z-10 flex items-center justify-between p-2">
                          <Badge className="bg-black/60 text-[7px] border border-white/10 font-bold px-1.5 h-4">
                            MOCK VIDEO PLAYBACK
                          </Badge>
                          <span className="text-[8px] text-white/50">Playing movie scene...</span>
                        </div>

                        {/* Semi-transparent Bottom Overlay Banner */}
                        <div className="relative z-10 p-2 flex justify-center">
                          <motion.div
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-black/90 backdrop-blur-md border border-white/10 rounded-lg p-1.5 w-[90%] flex items-center justify-between gap-2 shadow-2xl"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <img
                                src={previewAd.imageUrl}
                                alt="Overlay thumb"
                                className="h-6 w-9 object-cover rounded border border-white/5"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=40'
                                }}
                              />
                              <div className="text-left min-w-0 leading-tight">
                                <p className="text-[9px] font-bold text-white truncate leading-none">{previewAd.title}</p>
                                <span className="text-[7px] text-xtube-red uppercase font-semibold">SPONSORED LINK</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={previewAd.linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-xtube-red hover:bg-xtube-red-hover text-[7px] font-bold text-white px-2 py-0.5 rounded"
                              >
                                VISIT
                              </a>
                              <div className="h-4 w-4 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer">
                                <X className="h-2 w-2 text-white/40" />
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    )
                  }

                  // D. STANDARD SPONSORED BANNER PREVIEW (Header, Footer, Sidebar, Hero)
                  return (
                    <div className="relative w-full h-full bg-[#060609] p-2 flex flex-col justify-between overflow-hidden text-left">
                      {/* Mini Xtube App Container mockup */}
                      <div className="space-y-1.5">
                        
                        {/* Mini app header logo */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-1">
                          <div className="flex items-center gap-1">
                            <span className="h-2.5 w-2.5 rounded bg-xtube-red flex items-center justify-center text-[7px] font-black text-white">x</span>
                            <span className="text-[8px] font-black text-white leading-none">XTUBE</span>
                          </div>
                          <span className="text-[7px] text-white/20">OTT HOME WIREFRAME</span>
                        </div>

                        {/* Dynamic Banner Positions */}
                        {previewAd.position === 'hero' && (
                          <div className="relative h-14 w-full bg-white/5 rounded-lg border border-white/5 overflow-hidden flex flex-col justify-end p-1.5">
                            <img
                              src={previewAd.imageUrl}
                              alt="Hero creative"
                              className="absolute inset-0 w-full h-full object-cover opacity-60"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60'
                              }}
                            />
                            <div className="relative z-10 leading-tight">
                              <span className="text-[6px] bg-xtube-red text-white font-bold px-1 rounded">HERO AD</span>
                              <h4 className="text-[9px] font-bold text-white leading-none mt-0.5">{previewAd.title}</h4>
                            </div>
                          </div>
                        )}

                        {/* Top Header position banner */}
                        {previewAd.position !== 'hero' && previewAd.position !== 'footer' && (
                          <div className="h-6 w-full bg-gradient-to-r from-xtube-red/20 to-transparent border border-xtube-red/20 rounded flex items-center justify-between px-2 py-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <img
                                src={previewAd.imageUrl}
                                alt="Mini Banner creative"
                                className="h-4 w-7 object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=40'
                                }}
                              />
                              <span className="text-[8px] font-bold text-white truncate">{previewAd.title}</span>
                            </div>
                            <span className="text-[6px] font-semibold text-xtube-red bg-xtube-red/15 px-1 border border-xtube-red/20 rounded shrink-0">SPONSORED SLOT</span>
                          </div>
                        )}

                        {/* Content Placeholder Blocks */}
                        <div className="grid grid-cols-4 gap-1.5 opacity-25">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-video bg-white/5 rounded border border-white/5 flex flex-col justify-end p-0.5">
                              <span className="h-1 w-6 bg-white/20 rounded-full" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Footer position banner */}
                      {previewAd.position === 'footer' && (
                        <div className="h-6 w-full bg-gradient-to-r from-blue-900/40 to-transparent border border-blue-500/20 rounded flex items-center justify-between px-2 py-1 mt-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img
                              src={previewAd.imageUrl}
                              alt="Mini Banner creative"
                              className="h-4 w-7 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=40'
                              }}
                            />
                            <span className="text-[8px] font-bold text-white truncate">{previewAd.title}</span>
                          </div>
                          <span className="text-[6px] font-semibold text-blue-400 bg-blue-500/15 px-1 border border-blue-500/20 rounded shrink-0">FOOTER BANNER</span>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
                  <Megaphone className="h-8 w-8 text-white/25 animate-pulse" />
                  <p className="text-xs text-white/50">No Ad selected for preview</p>
                  <p className="text-[9px] text-white/30">Create a new campaign or hover over a table row to visualize.</p>
                </div>
              )}
            </div>

            {/* Selected Ad creative details metadata block */}
            <div className="mt-4 pt-3 border-t border-white/5 text-left space-y-2">
              <span className="text-[10px] uppercase font-bold text-white/35">Campaign Details</span>
              {previewAd ? (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-black/30 border border-white/5 rounded px-2.5 py-1">
                    <p className="text-white/25 text-[8px]">Type/Format</p>
                    <p className="text-white font-medium capitalize mt-0.5">{previewAd.type}</p>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded px-2.5 py-1">
                    <p className="text-white/25 text-[8px]">Slot Position</p>
                    <p className="text-white font-medium capitalize mt-0.5">{previewAd.position}</p>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded px-2.5 py-1 col-span-2">
                    <p className="text-white/25 text-[8px]">Creative Destination URL</p>
                    <a
                      href={previewAd.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xtube-red font-medium truncate block mt-0.5 hover:underline"
                    >
                      {previewAd.linkUrl || 'Direct redirect enabled'}
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-white/20">Ready to visualize ad creative properties.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
