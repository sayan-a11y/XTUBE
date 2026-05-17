'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudUpload,
  Upload,
  Trash2,
  Megaphone,
  Eye,
  TrendingUp,
  DollarSign,
  MousePointer,
  Clock,
  Image as ImageIcon,
  BarChart3,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
  Radio,
  Bell,
  Monitor,
  Plus,
  Film,
  LayoutGrid,
  Code2,
  Sparkles,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Layers,
  Filter,
  ExternalLink,
  Play,
  RectangleHorizontal,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

type AdType = 'Banner' | 'Popup' | 'Hero/Footer' | 'Pre-Roll' | 'Mid-Roll' | 'Post-Roll' | 'Overlay' | 'Image Banner'

interface AllAd {
  id: string
  name: string
  type: AdType
  placement: string
  sizeDuration: string
  impressions: string
  ctr: string
  revenue: string
  status: 'Active' | 'Paused'
  gradient: string
  date: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STAT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#f97316']

const AD_TYPE_COLORS: Record<AdType, string> = {
  'Banner': '#3b82f6',
  'Popup': '#ec4899',
  'Hero/Footer': '#8b5cf6',
  'Pre-Roll': '#f97316',
  'Mid-Roll': '#06b6d4',
  'Post-Roll': '#8b5cf6',
  'Overlay': '#eab308',
  'Image Banner': '#10b981',
}

const AD_TYPE_STYLES: Record<AdType, string> = {
  'Banner': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Popup': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Hero/Footer': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Pre-Roll': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Mid-Roll': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Post-Roll': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Overlay': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Image Banner': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const donutData = [
  { name: 'Banner Ads', value: 36, color: '#3b82f6' },
  { name: 'Popup Ads', value: 24, color: '#ec4899' },
  { name: 'Hero/Footer Ads', value: 16, color: '#8b5cf6' },
  { name: 'Pre-Roll Ads', value: 20, color: '#f97316' },
  { name: 'Mid-Roll Ads', value: 18, color: '#06b6d4' },
  { name: 'Post-Roll Ads', value: 12, color: '#a855f7' },
  { name: 'Overlay Ads', value: 8, color: '#eab308' },
  { name: 'Image Banner Ads', value: 4, color: '#10b981' },
]

const impressionsData = [
  { date: 'May 10', value: 420000 },
  { date: 'May 12', value: 580000 },
  { date: 'May 14', value: 720000 },
  { date: 'May 16', value: 650000 },
  { date: 'May 18', value: 890000 },
  { date: 'May 20', value: 760000 },
  { date: 'May 22', value: 920000 },
  { date: 'May 24', value: 840000 },
  { date: 'May 26', value: 980000 },
  { date: 'May 28', value: 750000 },
  { date: 'May 30', value: 860000 },
  { date: 'Jun 01', value: 910000 },
  { date: 'Jun 03', value: 780000 },
  { date: 'Jun 05', value: 950000 },
  { date: 'Jun 07', value: 820000 },
  { date: 'Jun 09', value: 890000 },
]

const revenueData = [
  { date: 'May 10', value: 1200 },
  { date: 'May 12', value: 1800 },
  { date: 'May 14', value: 2400 },
  { date: 'May 16', value: 2100 },
  { date: 'May 18', value: 3200 },
  { date: 'May 20', value: 2800 },
  { date: 'May 22', value: 3600 },
  { date: 'May 24', value: 2900 },
  { date: 'May 26', value: 4100 },
  { date: 'May 28', value: 3400 },
  { date: 'May 30', value: 3800 },
  { date: 'Jun 01', value: 3200 },
  { date: 'Jun 03', value: 4500 },
  { date: 'Jun 05', value: 3900 },
  { date: 'Jun 07', value: 4800 },
  { date: 'Jun 09', value: 4200 },
]

const mockAds: AllAd[] = [
  { id: '1', name: 'Summer Sale Banner', type: 'Banner', placement: 'Top Header', sizeDuration: '970×250', impressions: '1.42M', ctr: '4.24%', revenue: '$5,450.80', status: 'Active', gradient: 'from-blue-900/60 via-indigo-800/40 to-violet-900/30', date: 'May 15, 2025' },
  { id: '2', name: 'Hero Brand Ad', type: 'Hero/Footer', placement: 'Hero Section - Top', sizeDuration: '1920×600', impressions: '1.85M', ctr: '5.24%', revenue: '$6,120.00', status: 'Active', gradient: 'from-purple-900/60 via-violet-800/40 to-fuchsia-900/30', date: 'May 12, 2025' },
  { id: '3', name: 'XTUBE Popup', type: 'Popup', placement: 'Center Popup', sizeDuration: '600×400', impressions: '842.5K', ctr: '5.24%', revenue: '$3,450.80', status: 'Active', gradient: 'from-pink-900/60 via-rose-800/40 to-red-900/30', date: 'May 18, 2025' },
  { id: '4', name: 'Nike Pre-Roll', type: 'Pre-Roll', placement: 'Pre-Roll (Before Video)', sizeDuration: '00:05 sec', impressions: '558.4K', ctr: '6.45%', revenue: '$2,450.30', status: 'Active', gradient: 'from-orange-900/60 via-amber-800/40 to-yellow-900/30', date: 'May 20, 2025' },
  { id: '5', name: 'Samsung Mid-Roll', type: 'Mid-Roll', placement: 'Mid-Roll (During Video)', sizeDuration: '00:10 sec', impressions: '425.2K', ctr: '4.82%', revenue: '$1,845.60', status: 'Paused', gradient: 'from-cyan-900/60 via-sky-800/40 to-blue-900/30', date: 'May 22, 2025' },
  { id: '6', name: 'Coca-Cola Overlay', type: 'Overlay', placement: 'Bottom Overlay', sizeDuration: 'Persistent', impressions: '689.0K', ctr: '3.24%', revenue: '$2,104.50', status: 'Active', gradient: 'from-yellow-900/60 via-amber-800/40 to-orange-900/30', date: 'May 25, 2025' },
  { id: '7', name: 'Gaming Footer Banner', type: 'Hero/Footer', placement: 'Footer Bottom', sizeDuration: '728×90', impressions: '312.8K', ctr: '3.92%', revenue: '$1,245.40', status: 'Active', gradient: 'from-violet-900/60 via-purple-800/40 to-fuchsia-900/30', date: 'May 28, 2025' },
  { id: '8', name: 'Movie Promo Post-Roll', type: 'Post-Roll', placement: 'Post-Roll (After Video)', sizeDuration: '00:08 sec', impressions: '245.6K', ctr: '5.36%', revenue: '$924.00', status: 'Paused', gradient: 'from-fuchsia-900/60 via-pink-800/40 to-rose-900/30', date: 'Jun 01, 2025' },
  { id: '9', name: 'Fashion Week Banner', type: 'Image Banner', placement: 'Middle Content', sizeDuration: '300×250', impressions: '189.2K', ctr: '4.12%', revenue: '$780.00', status: 'Active', gradient: 'from-emerald-900/60 via-green-800/40 to-teal-900/30', date: 'Jun 03, 2025' },
  { id: '10', name: 'Premium Subscription Ad', type: 'Popup', placement: 'Exit Intent Popup', sizeDuration: '500×350', impressions: '456.8K', ctr: '4.87%', revenue: '$2,845.60', status: 'Active', gradient: 'from-rose-900/60 via-pink-800/40 to-red-900/30', date: 'Jun 05, 2025' },
]

// ─── Mini Sparkline SVG ──────────────────────────────────────────────────────

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
      <path d={paths[index % paths.length]} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ title, value, change, icon: Icon, color, delay, index }: {
  title: string; value: string; change: string; icon: React.ElementType; color: string; delay: number; index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80 p-3 lg:p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:shadow-lg"
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function AllAdsPage() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all')

  // ─── Filtered Ads ──────────────────────────────────────────────────────

  const filteredAds = useMemo(() => {
    return mockAds.filter((ad) => {
      if (statusFilter !== 'all' && ad.status.toLowerCase() !== statusFilter) return false
      if (activeTypeFilter !== 'all') {
        const typeMap: Record<string, string> = {
          'banner': 'Banner', 'popup': 'Popup', 'hero-footer': 'Hero/Footer',
          'pre-roll': 'Pre-Roll', 'mid-roll': 'Mid-Roll', 'post-roll': 'Post-Roll',
          'overlay': 'Overlay', 'image-banner': 'Image Banner',
        }
        if (ad.type !== typeMap[activeTypeFilter]) return false
      }
      if (searchQuery && !ad.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [statusFilter, activeTypeFilter, searchQuery])

  const statusStyles: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }

  const typeFilterButtons = [
    { key: 'all', label: 'All Ads' },
    { key: 'banner', label: 'Banner Ads' },
    { key: 'popup', label: 'Popup Ads' },
    { key: 'hero-footer', label: 'Hero/Footer' },
    { key: 'pre-roll', label: 'Pre-Roll' },
    { key: 'mid-roll', label: 'Mid-Roll' },
    { key: 'post-roll', label: 'Post-Roll' },
    { key: 'overlay', label: 'Overlay' },
    { key: 'image-banner', label: 'Image Banner' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto no-scrollbar"
    >
      <div className="min-h-full p-3 lg:p-5 xl:p-6 space-y-4">
        {/* ═══════════════════════════════════════════════════════════════════
            TOP HEADER
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff0000]/10">
              <Megaphone className="h-5 w-5 text-[#ff0000]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">All Ads</h1>
              <p className="mt-0.5 text-sm text-white/40">Manage all ads across your platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-3 py-2 text-xs font-medium text-white/60 backdrop-blur-xl transition-colors hover:border-white/20 hover:text-white">
              <Clock className="h-3.5 w-3.5" />
              May 10 – Jun 10, 2025
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-3 py-2 text-xs font-medium text-white/60 backdrop-blur-xl transition-colors hover:border-white/20 hover:text-white">
              <Upload className="h-3.5 w-3.5" />
              Export Report
            </button>
            <button className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/60 px-2.5 py-2 text-white/60 backdrop-blur-xl transition-colors hover:border-white/20 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff0000] text-[8px] font-bold text-white">12</span>
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff0000] to-red-700 shadow-[0_0_12px_rgba(255,0,0,0.3)]">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(255,0,0,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff0000] to-[#cc0000] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-all hover:from-[#ff1111] hover:to-[#dd0000]"
            >
              <Plus className="h-4 w-4" />
              Create New Ad
            </motion.button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TOP ANALYTICS CARDS (5 cards)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Ads" value="156" change="+18.5%" icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Ads" value="124" change="+14.2%" icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value="8.42M" change="+26.7%" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="CTR" value="4.59%" change="+9.4%" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Revenue" value="$24,425.80" change="+22.6%" icon={DollarSign} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CHARTS ROW: Donut + Impressions + Revenue
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_1fr] xl:grid-cols-[340px_1fr_1fr]">
          {/* Ads Distribution Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80 backdrop-blur-xl"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Ads Distribution</h2>
                <span className="text-[10px] text-white/30">156 Total Ads</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-lg font-bold">156</text>
                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-white/30 text-[8px]">Total Ads</text>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]
                        const total = donutData.reduce((s, e) => s + e.value, 0)
                        const pct = ((d.value as number) / total * 100).toFixed(0)
                        return (
                          <div className="rounded-lg border border-white/10 bg-[#111]/95 px-3 py-2 shadow-xl backdrop-blur-xl">
                            <p className="text-xs font-semibold text-white">{d.name}</p>
                            <p className="text-[10px] text-white/40">{d.value} ads ({pct}%)</p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="mt-3 space-y-1">
                {donutData.map((item) => {
                  const total = donutData.reduce((s, e) => s + e.value, 0)
                  const pct = ((item.value / total) * 100).toFixed(0)
                  return (
                    <div key={item.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-white/50 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">{item.value}</span>
                        <span className="font-medium text-white/60">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Impressions Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80 backdrop-blur-xl"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Impressions Overview</h2>
                <Select value="30d" onValueChange={() => {}}>
                  <SelectTrigger className="h-6 w-24 rounded border-white/10 bg-[#0a0a0a] text-[10px] text-white/50 [&_svg]:text-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
                    <SelectItem value="7d" className="text-[10px] text-white focus:bg-white/5">Last 7 Days</SelectItem>
                    <SelectItem value="30d" className="text-[10px] text-white focus:bg-white/5">Last 30 Days</SelectItem>
                    <SelectItem value="90d" className="text-[10px] text-white focus:bg-white/5">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={impressionsData} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="rounded-lg border border-white/10 bg-[#111]/95 px-3 py-2 shadow-xl backdrop-blur-xl">
                            <p className="text-[10px] text-white/40">{payload[0].payload.date}</p>
                            <p className="text-xs font-semibold text-white">{(payload[0].value as number).toLocaleString()} impressions</p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Revenue Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80 backdrop-blur-xl"
          >
            <div className="p-3 lg:p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Revenue Overview</h2>
                <Select value="30d" onValueChange={() => {}}>
                  <SelectTrigger className="h-6 w-24 rounded border-white/10 bg-[#0a0a0a] text-[10px] text-white/50 [&_svg]:text-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
                    <SelectItem value="7d" className="text-[10px] text-white focus:bg-white/5">Last 7 Days</SelectItem>
                    <SelectItem value="30d" className="text-[10px] text-white focus:bg-white/5">Last 30 Days</SelectItem>
                    <SelectItem value="90d" className="text-[10px] text-white focus:bg-white/5">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="99%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="rounded-lg border border-white/10 bg-[#111]/95 px-3 py-2 shadow-xl backdrop-blur-xl">
                            <p className="text-[10px] text-white/40">{payload[0].payload.date}</p>
                            <p className="text-xs font-semibold text-white">${(payload[0].value as number).toLocaleString()}</p>
                          </div>
                        )
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            AD TYPE QUICK FILTERS
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.3 }}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          {typeFilterButtons.map((btn) => (
            <motion.button
              key={btn.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveTypeFilter(btn.key); setCurrentPage(1) }}
              className={`relative flex-shrink-0 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 ${
                activeTypeFilter === btn.key
                  ? 'bg-[#ff0000] text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]'
                  : 'border border-white/10 bg-[#0B0B0F]/60 text-white/50 hover:border-white/20 hover:text-white/70'
              }`}
            >
              {btn.label}
              {activeTypeFilter === btn.key && (
                <motion.div
                  layoutId="ad-type-filter-glow"
                  className="absolute inset-0 rounded-xl bg-[#ff0000]/20 blur-md"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            ALL ADS TABLE
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0B0F]/80 backdrop-blur-xl"
        >
          <div className="p-3 lg:p-4">
            {/* Table header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-white">All Ads List</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="h-8 w-28 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/60 [&_svg]:text-white/30">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
                    <SelectItem value="all" className="text-xs text-white focus:bg-white/5">All Types</SelectItem>
                    <SelectItem value="banner" className="text-xs text-white focus:bg-white/5">Banner</SelectItem>
                    <SelectItem value="popup" className="text-xs text-white focus:bg-white/5">Popup</SelectItem>
                    <SelectItem value="hero-footer" className="text-xs text-white focus:bg-white/5">Hero/Footer</SelectItem>
                    <SelectItem value="pre-roll" className="text-xs text-white focus:bg-white/5">Pre-Roll</SelectItem>
                    <SelectItem value="mid-roll" className="text-xs text-white focus:bg-white/5">Mid-Roll</SelectItem>
                    <SelectItem value="post-roll" className="text-xs text-white focus:bg-white/5">Post-Roll</SelectItem>
                    <SelectItem value="overlay" className="text-xs text-white focus:bg-white/5">Overlay</SelectItem>
                    <SelectItem value="image-banner" className="text-xs text-white focus:bg-white/5">Image Banner</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                  <SelectTrigger className="h-8 w-28 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/60 [&_svg]:text-white/30">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
                    <SelectItem value="all" className="text-xs text-white focus:bg-white/5">All Status</SelectItem>
                    <SelectItem value="active" className="text-xs text-white focus:bg-white/5">Active</SelectItem>
                    <SelectItem value="paused" className="text-xs text-white focus:bg-white/5">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                    placeholder="Search ads..."
                    className="h-8 w-40 rounded-lg border border-white/10 bg-[#0a0a0a] pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#ff0000]/40"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Preview', 'Ad Name', 'Type', 'Placement', 'Size / Duration', 'Impressions', 'CTR', 'Revenue', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white/25">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAds.map((ad, i) => (
                    <motion.tr
                      key={ad.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.04, duration: 0.3 }}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Preview */}
                      <td className="py-2 pr-3">
                        <div className="relative h-9 w-16 overflow-hidden rounded-lg">
                          <div className={`absolute inset-0 bg-gradient-to-br ${ad.gradient}`} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {ad.type === 'Banner' || ad.type === 'Image Banner' ? <ImageIcon className="h-3 w-3 text-white/20" /> :
                             ad.type === 'Pre-Roll' || ad.type === 'Mid-Roll' || ad.type === 'Post-Roll' ? <Play className="h-3 w-3 text-white/20" /> :
                             ad.type === 'Overlay' ? <Layers className="h-3 w-3 text-white/20" /> :
                             ad.type === 'Popup' ? <LayoutGrid className="h-3 w-3 text-white/20" /> :
                             <Megaphone className="h-3 w-3 text-white/20" />}
                          </div>
                        </div>
                      </td>
                      {/* Ad Name */}
                      <td className="py-2 pr-3">
                        <p className="text-xs font-medium text-white">{ad.name}</p>
                        <p className="text-[10px] text-white/25">{ad.date}</p>
                      </td>
                      {/* Type */}
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${AD_TYPE_STYLES[ad.type]}`}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: AD_TYPE_COLORS[ad.type] }} />
                          {ad.type}
                        </span>
                      </td>
                      {/* Placement */}
                      <td className="py-2 pr-3">
                        <span className="text-xs text-white/50">{ad.placement}</span>
                      </td>
                      {/* Size / Duration */}
                      <td className="py-2 pr-3">
                        <span className="text-xs text-white/50">{ad.sizeDuration}</span>
                      </td>
                      {/* Impressions */}
                      <td className="py-2 pr-3">
                        <span className="text-xs font-medium text-white/70">{ad.impressions}</span>
                      </td>
                      {/* CTR */}
                      <td className="py-2 pr-3">
                        <span className="text-xs font-medium text-white/70">{ad.ctr}</span>
                      </td>
                      {/* Revenue */}
                      <td className="py-2 pr-3">
                        <span className="text-xs font-semibold text-emerald-400">{ad.revenue}</span>
                      </td>
                      {/* Status */}
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusStyles[ad.status]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${ad.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {ad.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-2">
                        <div className="flex items-center gap-0.5">
                          <button className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white" title="Analytics">
                            <BarChart3 className="h-3.5 w-3.5" />
                          </button>
                          <button className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">Rows per page:</span>
                <Select value="10" onValueChange={() => {}}>
                  <SelectTrigger className="h-6 w-16 rounded border-white/10 bg-[#0a0a0a] text-[10px] text-white/50 [&_svg]:text-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111]">
                    <SelectItem value="10" className="text-[10px] text-white focus:bg-white/5">10</SelectItem>
                    <SelectItem value="25" className="text-[10px] text-white focus:bg-white/5">25</SelectItem>
                    <SelectItem value="50" className="text-[10px] text-white focus:bg-white/5">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-white/30">1–10 of 156</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#ff0000] text-white'
                        : 'border border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <span className="text-[10px] text-white/30">...16</span>
                <button
                  onClick={() => setCurrentPage(Math.min(16, currentPage + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
