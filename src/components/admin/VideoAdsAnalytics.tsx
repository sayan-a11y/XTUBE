'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Eye,
  MousePointer,
  TrendingUp,
  Play,
  Users,
  ChevronDown,
  RefreshCw,
  Clock,
  CheckCircle,
  Activity,
  BarChart3,
  Percent
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
  Cell,
  BarChart,
  Bar
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface LocalAdRow {
  id: string
  name: string
  impressions: string
  views: string
  clicks: string
  ctr: string
  revenue: string
  status: 'Active' | 'Paused'
}

// ─── Color Palettes Matching Screenshot ────────────────────────────────────────

const DONUT_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#8b5cf6'] // Red, Blue, Green, Orange, Purple

// ─── Performance Overview Data (Screenshot Exact) ─────────────────────────────
const performanceData = [
  { date: 'Jun 4', impressions: 340000, clicks: 58000, revenue: 1700 },
  { date: 'Jun 5', impressions: 420000, clicks: 92000, revenue: 3100 },
  { date: 'Jun 6', impressions: 350000, clicks: 98000, revenue: 3000 },
  { date: 'Jun 7', impressions: 370000, clicks: 94000, revenue: 3200 },
  { date: 'Jun 8', impressions: 350000, clicks: 102000, revenue: 3000 },
  { date: 'Jun 9', impressions: 360000, clicks: 96000, revenue: 3050 },
  { date: 'Jun 10', impressions: 320000, clicks: 98000, revenue: 2600 },
]

// ─── Top Performing Ads Donut Data (Screenshot Exact) ─────────────────────────
const donutData = [
  { name: 'Ad #2025-001', value: 805200, pct: '32.9%', raw: '805.2K', color: '#dc2626' },
  { name: 'Ad #2025-002', value: 652100, pct: '26.6%', raw: '652.1K', color: '#2563eb' },
  { name: 'Ad #2025-003', value: 512400, pct: '20.9%', raw: '512.4K', color: '#16a34a' },
  { name: 'Ad #2025-004', value: 285600, pct: '11.6%', raw: '285.6K', color: '#d97706' },
  { name: 'Others', value: 194700, pct: '8.0%', raw: '194.7K', color: '#8b5cf6' },
]

// ─── Ad Type Performance Vertical Bar Data (Screenshot Exact) ──────────────────
const barChartData = [
  { name: 'Pre-roll', value: 1120000, display: '1.12M', color: '#dc2626' },
  { name: 'Mid-roll', value: 785000, display: '785K', color: '#2563eb' },
  { name: 'Post-roll', value: 412000, display: '412K', color: '#16a34a' },
  { name: 'Overlay', value: 256000, display: '256K', color: '#d97706' },
  { name: 'Other', value: 134000, display: '134K', color: '#8b5cf6' },
]

// ─── Pre-seeded Table Rows (Screenshot Exact) ──────────────────────────────────
const INITIAL_TABLE_ROWS: LocalAdRow[] = [
  { id: '#2025-001', name: 'Ad Campaign 001', impressions: '805.2K', views: '402.6K', clicks: '15.2K', ctr: '1.89%', revenue: '$4,152.35', status: 'Active' },
  { id: '#2025-002', name: 'Ad Campaign 002', impressions: '652.1K', views: '321.4K', clicks: '12.1K', ctr: '1.86%', revenue: '$3,245.80', status: 'Active' },
  { id: '#2025-003', name: 'Ad Campaign 003', impressions: '512.4K', views: '256.8K', clicks: '9.3K', ctr: '1.81%', revenue: '$2,456.10', status: 'Active' },
  { id: '#2025-004', name: 'Ad Campaign 004', impressions: '285.6K', views: '142.3K', clicks: '4.8K', ctr: '1.68%', revenue: '$1,356.20', status: 'Active' },
  { id: '#2025-005', name: 'Ad Campaign 005', impressions: '194.7K', views: '98.6K', clicks: '3.1K', ctr: '1.59%', revenue: '$1,240.30', status: 'Active' },
]

export function VideoAdsAnalytics({ ads }: VideoAdsAnalyticsProps) {
  const [tableRows, setTableRows] = useState<LocalAdRow[]>(INITIAL_TABLE_ROWS)
  const [dateRange, setDateRange] = useState('Jun 4, 2025 - Jun 10, 2025')
  const [refreshing, setRefreshing] = useState(false)

  // Real-time Supabase sync integration
  const syncAdsData = useCallback(() => {
    if (!ads || ads.length === 0) return

    // Transform dynamic database properties and merge into the performance table
    const transformed: LocalAdRow[] = ads.map((ad, idx) => {
      const adId = `#2025-0${String(idx + 6).padStart(2, '0')}`
      const formattedImp = ad.impressions >= 1000000 
        ? `${(ad.impressions / 1000000).toFixed(1)}M`
        : ad.impressions >= 1000 
          ? `${(ad.impressions / 1000).toFixed(1)}K`
          : String(ad.impressions)

      const formattedViews = ad.impressions > 0 
        ? `${Math.round(ad.impressions * 0.5 >= 1000 ? ad.impressions * 0.5 / 1000 : ad.impressions * 0.5)}K`
        : '0K'

      const formattedClicks = ad.clicks >= 1000 
        ? `${(ad.clicks / 1000).toFixed(1)}K` 
        : String(ad.clicks)

      const calculatedCtr = ad.impressions > 0 
        ? `${((ad.clicks / ad.impressions) * 100).toFixed(2)}%`
        : '0.00%'

      const formattedRevenue = `$${ad.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

      return {
        id: adId,
        name: ad.title || `Ad Campaign ${String(idx + 6).padStart(3, '0')}`,
        impressions: formattedImp,
        views: formattedViews,
        clicks: formattedClicks,
        ctr: calculatedCtr,
        revenue: formattedRevenue,
        status: ad.isActive ? 'Active' : 'Paused'
      }
    })

    // Prepend new live entries, avoiding duplicates
    setTableRows((prev) => {
      const base = [...INITIAL_TABLE_ROWS]
      transformed.forEach(tAd => {
        if (!base.some(b => b.name === tAd.name)) {
          base.unshift(tAd)
        }
      })
      return base.slice(0, 8) // Limit to display rows neatly
    })
  }, [ads])

  useEffect(() => {
    syncAdsData()
  }, [syncAdsData])

  // Real-time server stream synchronization hooks
  useRealtimeSync(useCallback((type) => {
    if (type.startsWith('ad:') || type.includes('ad:')) {
      syncAdsData()
    }
  }, [syncAdsData]))

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      syncAdsData()
    }, 600)
  }

  return (
    <div className="space-y-4 p-4 text-white bg-[#0a0b0d] min-h-screen">
      
      {/* ─── HEADER BAR (Screenshot Exact) ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">Video Ads Analytics</h1>
            <div className="flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 border border-red-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p className="text-xs text-white/40 mt-0.5">Real-time overview of all your video ads performance</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range picker selector */}
          <div className="flex h-8.5 items-center gap-2 rounded-lg border border-white/5 bg-[#12141a] px-3 text-xs text-white/80 hover:border-white/10 cursor-pointer transition">
            <span>{dateRange}</span>
            <ChevronDown className="h-3.5 w-3.5 text-white/30" />
          </div>

          {/* Refresh Action Trigger */}
          <button 
            onClick={handleRefresh}
            className="flex h-8.5 items-center gap-1.5 rounded-lg border border-white/5 bg-[#12141a] px-3 text-xs font-semibold text-white/90 hover:bg-white/[0.04] transition active:scale-95"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-white/40 ${refreshing ? 'animate-spin text-red-500' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* ─── 6 TOP KPI METRIC CARDS ROW (Screenshot Exact) ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        
        {/* Card 1: Total Impressions */}
        <div className="rounded-xl border border-white/5 bg-[#12131a] p-3.5 transition hover:border-violet-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <Play className="h-4 w-4 fill-violet-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-white/40 font-medium">Total Impressions</p>
            <p className="text-lg font-bold text-white mt-0.5">2.45M</p>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <span className="font-semibold text-emerald-400">↑ 18.6%</span>
            <span className="text-white/20">vs last 7 days</span>
          </div>
        </div>

        {/* Card 2: Total Clicks */}
        <div className="rounded-xl border border-white/5 bg-[#12131a] p-3.5 transition hover:border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <MousePointer className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-white/40 font-medium">Total Clicks</p>
            <p className="text-lg font-bold text-white mt-0.5">45.32K</p>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <span className="font-semibold text-emerald-400">↑ 14.3%</span>
            <span className="text-white/20">vs last 7 days</span>
          </div>
        </div>

        {/* Card 3: Total Views */}
        <div className="rounded-xl border border-white/5 bg-[#12131a] p-3.5 transition hover:border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-white/40 font-medium">Total Views</p>
            <p className="text-lg font-bold text-white mt-0.5">1.23M</p>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <span className="font-semibold text-emerald-400">↑ 21.7%</span>
            <span className="text-white/20">vs last 7 days</span>
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="rounded-xl border border-white/5 bg-[#12131a] p-3.5 transition hover:border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-white/40 font-medium">Total Revenue</p>
            <p className="text-lg font-bold text-white mt-0.5">$12,450.75</p>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <span className="font-semibold text-emerald-400">↑ 23.8%</span>
            <span className="text-white/20">vs last 7 days</span>
          </div>
        </div>

        {/* Card 5: CTR */}
        <div className="rounded-xl border border-white/5 bg-[#12131a] p-3.5 transition hover:border-rose-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-white/40 font-medium">CTR</p>
            <p className="text-lg font-bold text-white mt-0.5">1.85%</p>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <span className="font-semibold text-emerald-400">↑ 9.4%</span>
            <span className="text-white/20">vs last 7 days</span>
          </div>
        </div>

        {/* Card 6: Unique Users */}
        <div className="rounded-xl border border-white/5 bg-[#12131a] p-3.5 transition hover:border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-white/40 font-medium">Unique Users</p>
            <p className="text-lg font-bold text-white mt-0.5">785.32K</p>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px]">
            <span className="font-semibold text-emerald-400">↑ 16.2%</span>
            <span className="text-white/20">vs last 7 days</span>
          </div>
        </div>
      </div>

      {/* ─── PERFORMANCE OVERVIEW & TOP PERFORMING DONUT ROW (Screenshot Exact) ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        
        {/* Performance Overview Line Chart Panel (8/12 cols) */}
        <div className="rounded-xl border border-white/5 bg-[#12131a] p-4 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Performance Overview</h3>
            
            {/* Custom Chart Legends */}
            <div className="flex items-center gap-4 text-[10px] text-white/70">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#dc2626]" /> Impressions</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#2563eb]" /> Clicks</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#16a34a]" /> Revenue ($)</span>
            </div>
          </div>

          {/* Line chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cliGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d202a" vertical={false} />
                <XAxis dataKey="date" stroke="#4e5466" fontSize={10} tickLine={false} axisLine={false} />
                {/* Left Y Axis for impressions/clicks */}
                <YAxis yAxisId="left" stroke="#4e5466" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
                {/* Right Y Axis for revenue */}
                <YAxis yAxisId="right" orientation="right" stroke="#4e5466" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}K` : v}`} />
                
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border border-white/5 bg-[#12141a] p-3 text-xs shadow-xl">
                        <p className="font-semibold text-white/50 mb-1.5">{payload[0].payload.date}</p>
                        <p className="text-red-500 font-medium">Impressions: {payload[0].value?.toLocaleString()}</p>
                        <p className="text-blue-500 font-medium">Clicks: {payload[1].value?.toLocaleString()}</p>
                        <p className="text-green-500 font-medium">Revenue: ${payload[2].value}</p>
                      </div>
                    )
                  }}
                />

                <Area yAxisId="left" type="monotone" dataKey="impressions" stroke="#dc2626" strokeWidth={2} fill="url(#impGrad)" dot={{ r: 3, fill: '#dc2626' }} />
                <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#2563eb" strokeWidth={2} fill="url(#cliGrad)" dot={{ r: 3, fill: '#2563eb' }} />
                <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 3, fill: '#16a34a' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Ads Donut Panel (4/12 cols) */}
        <div className="rounded-xl border border-white/5 bg-[#12131a] p-4 lg:col-span-4">
          <h3 className="mb-4 text-sm font-semibold text-white">Top Performing Ads</h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:flex-col lg:items-center">
            {/* Donut graphic */}
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Centered label inside donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white leading-none">2.45M</span>
                <span className="text-[9px] text-white/40 mt-1 font-medium">Impressions</span>
              </div>
            </div>

            {/* List legends on the right side */}
            <div className="flex-1 w-full space-y-2 text-xs">
              {donutData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between border-b border-white/[0.02] pb-1.5">
                  <span className="flex items-center gap-2 text-white/70">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-semibold text-white">
                    {item.raw} <span className="text-white/30 text-[10px]">({item.pct})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── AD PERFORMANCE TABLE & AD TYPE VERTICAL BAR ROW (Screenshot Exact) ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        
        {/* Ad Performance Table (8/12 cols) */}
        <div className="rounded-xl border border-white/5 bg-[#12131a] p-4 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Ad Performance Table</h3>
            <button className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1 text-[10px] font-bold text-white/80 hover:bg-white/[0.04]">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                  <th className="pb-3.5">Ad ID</th>
                  <th className="pb-3.5">Ad Name</th>
                  <th className="pb-3.5">Impressions</th>
                  <th className="pb-3.5">Views</th>
                  <th className="pb-3.5">Clicks</th>
                  <th className="pb-3.5">CTR</th>
                  <th className="pb-3.5">Revenue</th>
                  <th className="pb-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {tableRows.map((row) => (
                  <tr key={row.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 font-medium text-white/40">{row.id}</td>
                    <td className="py-3 font-semibold text-white/90 group-hover:text-red-500 transition">{row.name}</td>
                    <td className="py-3 text-white/60">{row.impressions}</td>
                    <td className="py-3 text-white/50">{row.views}</td>
                    <td className="py-3 text-white/60">{row.clicks}</td>
                    <td className="py-3 font-medium text-white/80">{row.ctr}</td>
                    <td className="py-3 font-bold text-emerald-400">{row.revenue}</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/10">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ad Type Performance Vertical Bar Chart Panel (4/12 cols) */}
        <div className="rounded-xl border border-white/5 bg-[#12131a] p-4 lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Ad Type Performance</h3>
            
            <Select defaultValue="impressions">
              <SelectTrigger className="h-7 w-[100px] border-white/5 bg-[#181a24] text-[10px] text-white/70">
                <SelectValue placeholder="Display" />
              </SelectTrigger>
              <SelectContent className="border-white/5 bg-[#181a24]">
                <SelectItem value="impressions">Impressions</SelectItem>
                <SelectItem value="clicks">Clicks</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Premium Vertical Bar Chart Container */}
          <div className="relative h-64 w-full flex items-end justify-between px-3 border-b border-white/5 pb-2">
            
            {/* Horizontal Grid Value Axes */}
            <div className="absolute inset-x-0 top-0 bottom-2 flex flex-col justify-between pointer-events-none text-[9px] text-white/20">
              <div className="w-full border-t border-white/5 pt-0.5 flex justify-between"><span>1.2M</span></div>
              <div className="w-full border-t border-white/5 pt-0.5 flex justify-between"><span>900K</span></div>
              <div className="w-full border-t border-white/5 pt-0.5 flex justify-between"><span>600K</span></div>
              <div className="w-full border-t border-white/5 pt-0.5 flex justify-between"><span>300K</span></div>
              <div className="w-full pt-0.5 flex justify-between"><span>0</span></div>
            </div>

            {/* Render Vertical Colored Bars */}
            {barChartData.map((bar) => {
              // Calculate accurate relative height rates
              const heightPct = `${(bar.value / 1200000) * 100}%`

              return (
                <div key={bar.name} className="relative z-10 flex flex-col items-center w-10 group cursor-pointer">
                  {/* Floating display value directly on top of the bar */}
                  <span className="text-[10px] font-bold text-white mb-1.5 opacity-80 group-hover:scale-105 transition-transform">
                    {bar.display}
                  </span>

                  {/* Rounded-top colorized solid bar */}
                  <div 
                    className="w-7 rounded-t-md transition-all duration-500 hover:brightness-110 shadow-lg"
                    style={{ 
                      height: `calc(${heightPct} - 25px)`, 
                      backgroundColor: bar.color,
                      boxShadow: `0 4px 12px ${bar.color}22`
                    }}
                  />

                  {/* Bar Name under the axis */}
                  <span className="text-[9px] font-medium text-white/40 mt-2 truncate max-w-full text-center">
                    {bar.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── 5 BOTTOM COMPACT STATS ROW (Screenshot Exact) ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        
        {/* Card 1: Avg. View Duration */}
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#12131a] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/20 text-amber-500">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">Avg. View Duration</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-bold text-white">00:28</span>
              <span className="text-[9px] font-bold text-emerald-400">↑ 12.6%</span>
            </div>
          </div>
        </div>

        {/* Card 2: View Completion Rate */}
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#12131a] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-500/20 text-violet-400">
            <CheckCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">View Completion Rate</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-bold text-white">62.35%</span>
              <span className="text-[9px] font-bold text-emerald-400">↑ 8.7%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Click Through Rate */}
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#12131a] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/20 text-blue-400">
            <Percent className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">Click Through Rate</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-bold text-white">1.85%</span>
              <span className="text-[9px] font-bold text-emerald-400">↑ 9.4%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Revenue per 1K Impressions */}
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#12131a] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/20 text-amber-500">
            <DollarSign className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">Revenue per 1K Imp</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-bold text-white">$5.08</span>
              <span className="text-[9px] font-bold text-emerald-400">↑ 7.3%</span>
            </div>
          </div>
        </div>

        {/* Card 5: Engagement Rate */}
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#12131a] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/20 text-blue-400">
            <Activity className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">Engagement Rate</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-bold text-white">3.42%</span>
              <span className="text-[9px] font-bold text-emerald-400">↑ 11.2%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
