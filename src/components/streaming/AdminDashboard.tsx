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
} from 'lucide-react'
import {
  LineChart,
  Line,
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-xl border border-xtube-border bg-xtube-card p-4 transition-colors hover:border-xtube-red/30 md:p-6"
    >
      {/* Red accent top line */}
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-xtube-red to-transparent" />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-xtube-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-white md:text-3xl">{value}</p>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            )}
            <span
              className={`text-xs font-medium ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {change}%
            </span>
            <span className="text-xs text-xtube-text-secondary">vs last month</span>
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-xtube-red/10 md:h-12 md:w-12">
          <Icon className="h-5 w-5 text-xtube-red md:h-6 md:w-6" />
        </div>
      </div>
    </motion.div>
  )
}

// Custom tooltip component for charts
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-xtube-border bg-xtube-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-xtube-text-secondary">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-medium text-white" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-xtube-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl bg-xtube-card" />
        ))}
      </div>
    </div>
  )
}

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

  // Prepare device breakdown data for pie chart
  const deviceData = Object.entries(data.deviceBreakdown).map(([name, value]) => ({
    name,
    value,
  }))

  // Prepare category data for bar chart
  const categoryData = data.categoryStats.map((stat) => ({
    category: stat.category,
    Videos: stat.count,
    Views: Math.round(stat.views / 1000),
  }))

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} delay={i * 0.05} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Views Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-xtube-border bg-xtube-card p-4 md:p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">Views Over Time</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.viewsGraph}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#E50914"
                  strokeWidth={2.5}
                  dot={{ fill: '#E50914', r: 4 }}
                  activeDot={{ r: 6, fill: '#ff1f2f' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Revenue Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-xtube-border bg-xtube-card p-4 md:p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">Revenue Trend</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueGraph}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => '$' + formatNumber(v)} />
                <Tooltip content={<ChartTooltip />} />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E50914" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#E50914"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* User Growth Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-xtube-border bg-xtube-card p-4 md:p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">Category Stats</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Bar dataKey="Videos" fill="#E50914" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Views" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Device Breakdown Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-xl border border-xtube-border bg-xtube-card p-4 md:p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">Ad Analytics - Device Breakdown</h3>
          <div className="h-64 md:h-72">
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
