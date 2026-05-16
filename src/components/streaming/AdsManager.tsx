'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

interface AdsManagerProps {
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

// Custom chart tooltip
function AdChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-xtube-border bg-xtube-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-xtube-text-secondary">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

export function AdsManager({ ads, onCreate, onDelete, onToggle, loading }: AdsManagerProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: '',
    type: '',
    position: '',
    imageUrl: '',
    linkUrl: '',
    startDate: '',
    endDate: '',
    frequency: '',
  })

  // Filter ads
  const filteredAds = useMemo(() => {
    let result = [...ads]

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
  }, [ads, searchQuery, typeFilter, positionFilter])

  // Overview stats
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0)
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0)
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'
  const totalRevenue = ads.reduce((sum, ad) => sum + ad.revenue, 0)

  // Chart data - ad performance
  const chartData = ads.map((ad) => ({
    name: ad.title.length > 15 ? ad.title.substring(0, 15) + '...' : ad.title,
    Impressions: ad.impressions,
    Clicks: ad.clicks,
    Revenue: ad.revenue,
  }))

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(createForm)
    setCreateForm({
      title: '',
      type: '',
      position: '',
      imageUrl: '',
      linkUrl: '',
      startDate: '',
      endDate: '',
      frequency: '',
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-xtube-card" />
          ))}
        </div>
        <Skeleton className="h-64 w-full bg-xtube-card" />
        <Skeleton className="h-96 w-full bg-xtube-card" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Ads Management</h2>
          <p className="text-sm text-xtube-text-secondary">{ads.length} ads total</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-xtube-red hover:bg-xtube-red-hover">
              <Plus className="mr-2 h-4 w-4" />
              Create Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-xtube-border bg-xtube-card sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Ad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Title</Label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Ad title"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Type</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(v) => setCreateForm({ ...createForm, type: v })}
                  >
                    <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="border-xtube-border bg-xtube-card">
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="popup">Popup</SelectItem>
                      <SelectItem value="overlay">Overlay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Position</Label>
                  <Select
                    value={createForm.position}
                    onValueChange={(v) => setCreateForm({ ...createForm, position: v })}
                  >
                    <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent className="border-xtube-border bg-xtube-card">
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                      <SelectItem value="entry">Entry</SelectItem>
                      <SelectItem value="exit">Exit</SelectItem>
                      <SelectItem value="timed">Timed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Image URL</Label>
                <Input
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/ad-image.jpg"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Link URL</Label>
                <Input
                  value={createForm.linkUrl}
                  onChange={(e) => setCreateForm({ ...createForm, linkUrl: e.target.value })}
                  placeholder="https://example.com/landing"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Start Date</Label>
                  <Input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="border-xtube-border bg-xtube-bg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">End Date</Label>
                  <Input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="border-xtube-border bg-xtube-bg text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Frequency (per session)</Label>
                <Input
                  type="number"
                  value={createForm.frequency}
                  onChange={(e) => setCreateForm({ ...createForm, frequency: e.target.value })}
                  placeholder="1"
                  min="1"
                  max="10"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                />
              </div>
              <Button type="submit" className="w-full bg-xtube-red hover:bg-xtube-red-hover">
                Create Ad
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="rounded-xl border border-xtube-border bg-xtube-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-xtube-red/10">
              <Eye className="h-5 w-5 text-xtube-red" />
            </div>
            <div>
              <p className="text-xs text-xtube-text-secondary">Impressions</p>
              <p className="text-xl font-bold text-white">{formatNumber(totalImpressions)}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-xtube-border bg-xtube-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-xtube-red/10">
              <MousePointer className="h-5 w-5 text-xtube-red" />
            </div>
            <div>
              <p className="text-xs text-xtube-text-secondary">Clicks</p>
              <p className="text-xl font-bold text-white">{formatNumber(totalClicks)}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-xtube-border bg-xtube-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-xtube-red/10">
              <TrendingUp className="h-5 w-5 text-xtube-red" />
            </div>
            <div>
              <p className="text-xs text-xtube-text-secondary">CTR</p>
              <p className="text-xl font-bold text-white">{overallCTR}%</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-xtube-border bg-xtube-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-xtube-red/10">
              <DollarSign className="h-5 w-5 text-xtube-red" />
            </div>
            <div>
              <p className="text-xs text-xtube-text-secondary">Revenue</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Ad Analytics Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-xtube-border bg-xtube-card p-4 md:p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-white">Ad Performance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip content={<AdChartTooltip />} />
              <Bar dataKey="Impressions" fill="#E50914" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Clicks" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-xtube-border bg-xtube-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-xtube-text-secondary" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ads..."
            className="border-xtube-border bg-xtube-bg pl-10 text-white placeholder:text-xtube-text-secondary"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white md:w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="border-xtube-border bg-xtube-card">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="banner">Banner</SelectItem>
            <SelectItem value="popup">Popup</SelectItem>
            <SelectItem value="overlay">Overlay</SelectItem>
          </SelectContent>
        </Select>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white md:w-36">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent className="border-xtube-border bg-xtube-card">
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="hero">Hero</SelectItem>
            <SelectItem value="sidebar">Sidebar</SelectItem>
            <SelectItem value="footer">Footer</SelectItem>
            <SelectItem value="entry">Entry</SelectItem>
            <SelectItem value="exit">Exit</SelectItem>
            <SelectItem value="timed">Timed</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || typeFilter !== 'all' || positionFilter !== 'all') && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-xtube-red hover:text-xtube-red-hover"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Ads Table */}
      <div className="rounded-xl border border-xtube-border bg-xtube-card">
        <Table>
          <TableHeader>
            <TableRow className="border-xtube-border hover:bg-transparent">
              <TableHead className="text-xtube-text-secondary">Preview</TableHead>
              <TableHead className="text-xtube-text-secondary">Title</TableHead>
              <TableHead className="text-xtube-text-secondary">Type</TableHead>
              <TableHead className="text-xtube-text-secondary">Position</TableHead>
              <TableHead className="text-xtube-text-secondary">Impressions</TableHead>
              <TableHead className="text-xtube-text-secondary">Clicks</TableHead>
              <TableHead className="text-xtube-text-secondary">CTR</TableHead>
              <TableHead className="text-xtube-text-secondary">Revenue</TableHead>
              <TableHead className="text-xtube-text-secondary">Status</TableHead>
              <TableHead className="text-xtube-text-secondary">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAds.length === 0 ? (
              <TableRow className="border-xtube-border hover:bg-transparent">
                <TableCell colSpan={10} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Megaphone className="h-10 w-10 text-xtube-text-secondary" />
                    <p className="text-white">No ads found</p>
                    <p className="text-sm text-xtube-text-secondary">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAds.map((ad) => (
                <TableRow
                  key={ad.id}
                  className="border-xtube-border hover:bg-white/[0.02]"
                >
                  <TableCell>
                    <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-md bg-xtube-bg">
                      <ImageIcon className="h-5 w-5 text-xtube-text-secondary" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[160px] truncate font-medium text-white">{ad.title}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-xtube-border capitalize text-xtube-text-secondary">
                      {ad.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-xtube-border capitalize text-xtube-text-secondary">
                      {ad.position}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-white">{formatNumber(ad.impressions)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-white">{formatNumber(ad.clicks)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-xtube-red">
                      {getCTR(ad.clicks, ad.impressions)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-white">{formatCurrency(ad.revenue)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`cursor-pointer ${
                        ad.isActive
                          ? 'border-green-500/30 bg-green-500/10 text-green-400'
                          : 'border-red-500/30 bg-red-500/10 text-red-400'
                      }`}
                      onClick={() => onToggle(ad.id)}
                    >
                      {ad.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-xtube-text-secondary hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="border-xtube-border bg-xtube-card" align="end">
                        <DropdownMenuItem
                          className="text-white focus:bg-white/5"
                          onClick={() => onToggle(ad.id)}
                        >
                          {ad.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 focus:bg-red-500/10"
                          onClick={() => onDelete(ad.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
