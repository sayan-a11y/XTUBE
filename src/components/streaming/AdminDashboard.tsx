'use client'

import { motion } from 'framer-motion'
import {
  Film,
  Eye,
  MousePointer,
  DollarSign,
  Megaphone,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardData {
  totalVideos: number
  totalViews: number
  totalClicks: number
  totalRevenue: number
  totalAds: number
  totalUsers: number
  viewsGraph: Array<{ date: string; views: number }>
  revenueGraph: Array<{ date: string; revenue: number }>
  deviceBreakdown: Record<string, number>
  categoryStats: Array<{ category: string; count: number; views: number }>
}

interface AdminDashboardProps {
  data: DashboardData | null
  loading?: boolean
}

const COLORS = ['#E50914', '#ff6b6b', '#ffa502', '#2ed573', '#70a1ff']

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function formatCurrency(num: number): string {
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Custom Dark Tooltip ─────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-4 py-3 shadow-xl">
      <p className="mb-1.5 text-xs text-[#9ca3af]">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-semibold text-white">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}:{' '}
          {entry.name.toLowerCase().includes('revenue')
            ? formatCurrency(entry.value)
            : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────
interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  change: number
  delay: number
}

function StatCard({ title, value, icon: Icon, change, delay }: StatCardProps) {
  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl transition-all duration-300 hover:border-xtube-red/20 hover:shadow-[0_0_20px_rgba(229,9,20,0.15)] md:p-6"
    >
      {/* Red accent top line */}
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-xtube-red to-transparent" />

      {/* Subtle corner glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-xtube-red/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[#9ca3af]">{title}</p>
          <p className="text-2xl font-bold text-white md:text-3xl">{value}</p>
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            )}
            <span
              className={`text-xs font-semibold ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {change}%
            </span>
            <span className="text-[10px] text-[#9ca3af]/70">vs last month</span>
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-xtube-red/10 md:h-12 md:w-12">
          <Icon className="h-5 w-5 text-xtube-red md:h-6 md:w-6" />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Chart Card Wrapper ──────────────────────────────────────────────
function ChartCard({
  title,
  delay,
  children,
}: {
  title: string
  delay: number
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl"
    >
      <div className="p-4 md:p-6">
        <h3 className="mb-4 text-base font-semibold text-white md:text-lg">{title}</h3>
        <div className="h-64 md:h-72">{children}</div>
      </div>
    </motion.div>
  )
}

// ─── Live Activity Data ──────────────────────────────────────────────
const fakeActivities = [
  { text: 'New video uploaded: Epic Mountain Adventure', time: '2 min ago' },
  { text: 'User signup from mobile device', time: '3 min ago' },
  { text: 'Ad impression: Banner Ad #1', time: '5 min ago' },
  { text: 'Video "Ocean Depths" reached 10K views', time: '8 min ago' },
  { text: 'New comment on: Sunset Timelapse', time: '10 min ago' },
  { text: 'Premium subscription activated', time: '12 min ago' },
  { text: 'Ad campaign "Summer Sale" completed', time: '15 min ago' },
  { text: 'User signup from desktop', time: '18 min ago' },
]

// ─── Loading Skeleton ────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl md:p-6"
          >
            <Skeleton className="mb-3 h-3 w-20 bg-white/5" />
            <Skeleton className="mb-2 h-8 w-24 bg-white/5" />
            <Skeleton className="h-3 w-16 bg-white/5" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl md:p-6"
          >
            <Skeleton className="mb-4 h-5 w-32 bg-white/5" />
            <Skeleton className="h-64 bg-white/5 md:h-72" />
          </div>
        ))}
      </div>

      {/* Activity skeleton */}
      <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl md:p-6">
        <Skeleton className="mb-4 h-5 w-28 bg-white/5" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────
export function AdminDashboard({ data, loading }: AdminDashboardProps) {
  if (loading || !data) {
    return <LoadingSkeleton />
  }

  const statCards: Array<Omit<StatCardProps, 'delay'>> = [
    { title: 'Total Videos', value: formatNumber(data.totalVideos), icon: Film, change: 12.5 },
    { title: 'Total Views', value: formatNumber(data.totalViews), icon: Eye, change: 8.3 },
    { title: 'Total Clicks', value: formatNumber(data.totalClicks), icon: MousePointer, change: 15.2 },
    { title: 'Revenue', value: formatCurrency(data.totalRevenue), icon: DollarSign, change: 22.1 },
    { title: 'Total Ads', value: formatNumber(data.totalAds), icon: Megaphone, change: -3.4 },
    { title: 'Users', value: formatNumber(data.totalUsers), icon: Users, change: 18.7 },
  ]

  // Device breakdown for pie chart
  const deviceData = Object.entries(data.deviceBreakdown).map(([name, value]) => ({
    name,
    value,
  }))

  // Category data for bar chart
  const categoryData = data.categoryStats.map((stat) => ({
    category: stat.category,
    Videos: stat.count,
    Views: Math.round(stat.views / 1000),
  }))

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Stat Cards Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-6">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} delay={i * 0.06} />
        ))}
      </div>

      {/* ── Charts Grid (2×2 desktop, 1 col mobile) ───────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {/* Views Over Time — AreaChart */}
        <ChartCard title="Views Over Time" delay={0.3}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.viewsGraph}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E50914" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(v: number) => formatNumber(v)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#E50914"
                strokeWidth={2.5}
                fill="url(#viewsGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#E50914', stroke: '#0f0f0f', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue Trend — AreaChart */}
        <ChartCard title="Revenue Trend" delay={0.35}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenueGraph}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E50914" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(v: number) => '$' + formatNumber(v)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#E50914"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#E50914', stroke: '#0f0f0f', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Traffic Sources — PieChart (donut) */}
        <ChartCard title="Traffic Sources" delay={0.4}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              >
                {deviceData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]
                  return (
                    <div className="rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-4 py-3 shadow-xl">
                      <p className="text-sm font-semibold text-white">
                        {d.name}: {formatNumber(d.value as number)}
                      </p>
                    </div>
                  )
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
                formatter={(value: string) => <span className="text-[#9ca3af]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Performance — BarChart */}
        <ChartCard title="Category Performance" delay={0.45}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value: string) => <span className="text-[#9ca3af]">{value}</span>}
              />
              <Bar dataKey="Videos" fill="#E50914" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Views" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Real-time Activity Section ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl"
      >
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-xtube-red" />
            <h3 className="text-base font-semibold text-white md:text-lg">Live Activity</h3>
            <span className="relative ml-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>

          {/* Activity List */}
          <div className="max-h-96 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
            {fakeActivities.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                {/* Green dot */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>

                {/* Activity text */}
                <p className="min-w-0 flex-1 truncate text-sm text-[#9ca3af] group-hover:text-white transition-colors">
                  {activity.text}
                </p>

                {/* Timestamp */}
                <span className="shrink-0 text-[10px] font-medium text-[#9ca3af]/60">
                  {activity.time}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
