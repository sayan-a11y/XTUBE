'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Upload,
  Trash2,
  Edit,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Film,
  Clock,
  Eye,
  X,
  CloudUpload,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'

interface VideoManagerProps {
  videos: Array<{
    id: string
    title: string
    thumbnail: string
    category: string
    views: number
    duration: string
    isPublished: boolean
    createdAt: string
  }>
  onUpload: (data: Record<string, unknown>) => void
  onDelete: (id: string) => void
  onTogglePublish: (id: string) => void
  loading?: boolean
}

function formatViews(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

type SortField = 'title' | 'category' | 'views' | 'createdAt' | 'duration'
type SortDirection = 'asc' | 'desc'

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
  return sortDirection === 'asc' ? (
    <ArrowUp className="ml-1 h-3 w-3 text-xtube-red" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3 text-xtube-red" />
  )
}

const ITEMS_PER_PAGE = 8

const categories = [
  'Entertainment',
  'Music',
  'Gaming',
  'Education',
  'Sports',
  'News',
  'Technology',
  'Lifestyle',
]

/* ────────────────────────────────────────────
   Upload View
   ──────────────────────────────────────────── */

function UploadView({ onUpload }: { onUpload: (data: Record<string, unknown>) => void }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success'>('idle')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    isHD: false,
  })

  const simulateUpload = useCallback((fileName: string) => {
    setUploadedFileName(fileName)
    setUploadState('uploading')
    setUploadProgress(0)

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)

    let progress = 0
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15 + 3
      if (progress >= 100) {
        progress = 100
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
        setUploadProgress(100)
        setTimeout(() => setUploadState('success'), 300)
      } else {
        setUploadProgress(Math.min(progress, 100))
      }
    }, 150)
  }, [])

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        simulateUpload(files[0].name)
      }
    },
    [simulateUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        simulateUpload(files[0].name)
      }
    },
    [simulateUpload]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleResetUpload = useCallback(() => {
    setUploadState('idle')
    setUploadProgress(0)
    setUploadedFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      onUpload({
        title: form.title,
        description: form.description,
        category: form.category,
        duration: form.duration,
        isHD: form.isHD,
        fileName: uploadedFileName,
      })
      setForm({ title: '', description: '', category: '', duration: '', isHD: false })
      handleResetUpload()
    },
    [form, onUpload, uploadedFileName, handleResetUpload]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Upload Video</h2>
        <p className="text-sm text-xtube-text-secondary">
          Drag and drop your video files or browse to upload
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragOver ? '#E50914' : '#1f1f1f',
          backgroundColor: isDragOver ? 'rgba(229,9,20,0.05)' : 'rgba(15,15,15,0.8)',
        }}
        transition={{ duration: 0.2 }}
        className="relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-[#0f0f0f]/80 backdrop-blur-xl transition-shadow hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <AnimatePresence mode="wait">
          {uploadState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-xtube-red/10">
                <CloudUpload className="h-8 w-8 text-xtube-red" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-white">Drag & drop video files here</p>
                <p className="mt-1 text-sm text-xtube-text-secondary">
                  or{' '}
                  <span className="cursor-pointer text-xtube-red underline underline-offset-2 hover:text-xtube-red-hover">
                    browse files
                  </span>
                </p>
              </div>
              <p className="text-xs text-xtube-text-secondary">
                MP4, MOV, AVI up to 2GB
              </p>
            </motion.div>
          )}

          {uploadState === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex w-full max-w-sm flex-col items-center gap-4 px-6"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-xtube-red/10">
                <Upload className="h-8 w-8 animate-bounce text-xtube-red" />
              </div>
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-white" title={uploadedFileName}>
                    {uploadedFileName}
                  </span>
                  <span className="ml-2 flex-shrink-0 font-mono text-xtube-red">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2 bg-xtube-border [&>div]:bg-xtube-red" />
              </div>
              <p className="text-xs text-xtube-text-secondary">Uploading... Please wait</p>
            </motion.div>
          )}

          {uploadState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-white">Upload Complete!</p>
                <p className="mt-1 text-sm text-xtube-text-secondary">
                  {uploadedFileName}
                </p>
              </div>

              {/* Thumbnail preview */}
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-white/5 bg-[#0f0f0f]/80 p-3">
                <div className="flex h-14 w-24 items-center justify-center rounded-md bg-xtube-bg">
                  <Film className="h-6 w-6 text-xtube-text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{uploadedFileName}</p>
                  <p className="text-xs text-xtube-text-secondary">Ready to publish</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleResetUpload()
                }}
                className="mt-2 text-sm text-xtube-red underline underline-offset-2 hover:text-xtube-red-hover"
              >
                Upload another file
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Form Fields */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-6 backdrop-blur-xl transition-shadow hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
      >
        <h3 className="mb-5 text-lg font-semibold text-white">Video Details</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-white">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter video title"
              className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary focus:border-xtube-red/40 focus:ring-xtube-red/20"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-white">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your video..."
              className="min-h-[100px] border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary focus:border-xtube-red/40 focus:ring-xtube-red/20"
              rows={4}
            />
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white focus:ring-xtube-red/20">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="border-xtube-border bg-xtube-card">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Duration</Label>
              <Input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 12:30"
                className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary focus:border-xtube-red/40 focus:ring-xtube-red/20"
              />
            </div>
          </div>

          {/* HD Quality Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-xtube-border bg-xtube-bg/50 p-4">
            <div>
              <p className="text-sm font-medium text-white">HD Quality</p>
              <p className="text-xs text-xtube-text-secondary">Enable high-definition streaming</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isHD}
                onCheckedChange={(checked) => setForm({ ...form, isHD: checked })}
              />
              <span className={`text-sm font-medium ${form.isHD ? 'text-xtube-red' : 'text-xtube-text-secondary'}`}>
                {form.isHD ? 'HD' : 'SD'}
              </span>
            </div>
          </div>

          {/* Publish Button */}
          <Button
            type="submit"
            className="w-full bg-xtube-red py-6 text-base font-semibold text-white transition-all hover:bg-xtube-red-hover hover:shadow-[0_0_20px_rgba(229,9,20,0.3)]"
          >
            <Upload className="mr-2 h-5 w-5" />
            Publish Now
          </Button>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────
   Table View
   ──────────────────────────────────────────── */

function TableView({
  videos,
  onDelete,
  onTogglePublish,
  loading,
}: {
  videos: VideoManagerProps['videos']
  onDelete: VideoManagerProps['onDelete']
  onTogglePublish: VideoManagerProps['onTogglePublish']
  loading?: boolean
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = [...videos]

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (v) => v.title.toLowerCase().includes(q) || v.category.toLowerCase().includes(q)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((v) => v.category === categoryFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isPublished = statusFilter === 'published'
      result = result.filter((v) => v.isPublished === isPublished)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'views':
          comparison = a.views - b.views
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'duration':
          comparison = a.duration.localeCompare(b.duration)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [videos, searchQuery, categoryFilter, statusFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE)
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedVideos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedVideos.map((v) => v.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => onDelete(id))
    setSelectedIds(new Set())
  }

  const resetFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-full bg-xtube-card" />
        <Skeleton className="h-96 w-full bg-xtube-card" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">All Videos</h2>
          <p className="text-sm text-xtube-text-secondary">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-[#0f0f0f]/80 p-4 backdrop-blur-xl transition-shadow hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-xtube-text-secondary" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search videos..."
            className="border-xtube-border bg-xtube-bg pl-10 text-white placeholder:text-xtube-text-secondary focus:border-xtube-red/40 focus:ring-xtube-red/20"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white focus:ring-xtube-red/20 md:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="border-xtube-border bg-xtube-card">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white focus:ring-xtube-red/20 md:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="border-xtube-border bg-xtube-card">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-xtube-red hover:text-xtube-red-hover"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 rounded-lg border border-xtube-red/30 bg-xtube-red/5 px-4 py-2.5 backdrop-blur-sm"
          >
            <span className="text-sm font-medium text-white">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-xtube-text-secondary hover:text-white"
            >
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Table */}
      <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl transition-shadow hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-xtube-border hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={paginatedVideos.length > 0 && selectedIds.size === paginatedVideos.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-xtube-text-secondary">Thumbnail</TableHead>
                <TableHead
                  className="cursor-pointer text-xtube-text-secondary hover:text-white"
                  onClick={() => handleSort('title')}
                >
                  <span className="inline-flex items-center">
                    Title <SortIcon field="title" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-xtube-text-secondary hover:text-white"
                  onClick={() => handleSort('category')}
                >
                  <span className="inline-flex items-center">
                    Category <SortIcon field="category" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-xtube-text-secondary hover:text-white"
                  onClick={() => handleSort('views')}
                >
                  <span className="inline-flex items-center">
                    Views <SortIcon field="views" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-xtube-text-secondary hover:text-white"
                  onClick={() => handleSort('duration')}
                >
                  <span className="inline-flex items-center">
                    Duration <SortIcon field="duration" sortField={sortField} sortDirection={sortDirection} />
                  </span>
                </TableHead>
                <TableHead className="text-xtube-text-secondary">Status</TableHead>
                <TableHead className="text-xtube-text-secondary">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVideos.length === 0 ? (
                <TableRow className="border-xtube-border hover:bg-transparent">
                  <TableCell colSpan={8} className="py-16 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-xtube-red/5">
                        <Film className="h-8 w-8 text-xtube-text-secondary" />
                      </div>
                      <p className="text-lg font-medium text-white">No videos found</p>
                      <p className="text-sm text-xtube-text-secondary">
                        Try adjusting your search or filters
                      </p>
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVideos.map((video, index) => (
                  <motion.tr
                    key={video.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className="group border-xtube-border transition-colors hover:bg-white/[0.02]"
                  >
                    <TableCell className="py-3">
                      <Checkbox
                        checked={selectedIds.has(video.id)}
                        onCheckedChange={() => toggleSelect(video.id)}
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="relative h-12 w-20 overflow-hidden rounded-md bg-xtube-bg">
                        <div className="flex h-full w-full items-center justify-center">
                          <Film className="h-5 w-5 text-xtube-text-secondary" />
                        </div>
                        {/* Duration overlay */}
                        <div className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                          {video.duration}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="max-w-[200px] truncate font-medium text-white">
                        {video.title}
                      </p>
                      <p className="text-xs text-xtube-text-secondary">
                        {new Date(video.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className="border-xtube-border text-xtube-text-secondary"
                      >
                        {video.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-xtube-text-secondary" />
                        <span className="text-sm text-white">{formatViews(video.views)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-xtube-text-secondary" />
                        <span className="text-sm text-white">{video.duration}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        className={`cursor-pointer transition-colors ${
                          video.isPublished
                            ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                        }`}
                        onClick={() => onTogglePublish(video.id)}
                      >
                        {video.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-xtube-text-secondary opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="border-xtube-border bg-xtube-card"
                          align="end"
                        >
                          <DropdownMenuItem className="text-white focus:bg-white/5">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 focus:bg-red-500/10"
                            onClick={() => onDelete(video.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
        >
          <p className="text-sm text-xtube-text-secondary">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredVideos.length)} of{' '}
            {filteredVideos.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-xtube-text-secondary hover:text-white"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 ${
                  page === currentPage
                    ? 'bg-xtube-red text-white hover:bg-xtube-red-hover'
                    : 'text-xtube-text-secondary hover:text-white'
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-xtube-text-secondary hover:text-white"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

/* ────────────────────────────────────────────
   Main VideoManager Component
   ──────────────────────────────────────────── */

export function VideoManager({ videos, onUpload, onDelete, onTogglePublish, loading }: VideoManagerProps) {
  const { adminSection } = useAppStore()

  if (adminSection === 'video-upload') {
    return <UploadView onUpload={onUpload} />
  }

  return (
    <TableView
      videos={videos}
      onDelete={onDelete}
      onTogglePublish={onTogglePublish}
      loading={loading}
    />
  )
}
