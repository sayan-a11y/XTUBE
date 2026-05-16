'use client'

import { useState, useMemo } from 'react'
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
  Plus,
  X,
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'

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

export function VideoManager({ videos, onUpload, onDelete, onTogglePublish, loading }: VideoManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [uploadOpen, setUploadOpen] = useState(false)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: '',
    isHD: false,
  })

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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpload(uploadForm)
    setUploadForm({
      title: '',
      description: '',
      category: '',
      videoUrl: '',
      thumbnailUrl: '',
      duration: '',
      isHD: false,
    })
    setUploadOpen(false)
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
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Video Management</h2>
          <p className="text-sm text-xtube-text-secondary">{filteredVideos.length} videos total</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-xtube-red hover:bg-xtube-red-hover">
              <Plus className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-xtube-border bg-xtube-card sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Upload New Video</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Title</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Video title"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Description</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Video description"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Category</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(v) => setUploadForm({ ...uploadForm, category: v })}
                >
                  <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white">
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
                <Label className="text-white">Video URL</Label>
                <Input
                  value={uploadForm.videoUrl}
                  onChange={(e) => setUploadForm({ ...uploadForm, videoUrl: e.target.value })}
                  placeholder="https://r2.example.com/video.mp4"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Thumbnail URL</Label>
                <Input
                  value={uploadForm.thumbnailUrl}
                  onChange={(e) => setUploadForm({ ...uploadForm, thumbnailUrl: e.target.value })}
                  placeholder="https://r2.example.com/thumb.jpg"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Duration</Label>
                  <Input
                    value={uploadForm.duration}
                    onChange={(e) => setUploadForm({ ...uploadForm, duration: e.target.value })}
                    placeholder="12:30"
                    className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">HD Quality</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={uploadForm.isHD}
                      onCheckedChange={(checked) => setUploadForm({ ...uploadForm, isHD: checked })}
                    />
                    <span className="text-sm text-xtube-text-secondary">
                      {uploadForm.isHD ? 'HD' : 'SD'}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-xtube-red hover:bg-xtube-red-hover"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-xtube-border bg-xtube-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-xtube-text-secondary" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search videos..."
            className="border-xtube-border bg-xtube-bg pl-10 text-white placeholder:text-xtube-text-secondary"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1) }}>
          <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white md:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="border-xtube-border bg-xtube-card">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
          <SelectTrigger className="w-full border-xtube-border bg-xtube-bg text-white md:w-36">
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

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 rounded-lg border border-xtube-red/30 bg-xtube-red/5 px-4 py-2"
          >
            <span className="text-sm text-white">{selectedIds.size} selected</span>
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
      <div className="rounded-xl border border-xtube-border bg-xtube-card">
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
                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer text-xtube-text-secondary hover:text-white"
                onClick={() => handleSort('category')}
              >
                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer text-xtube-text-secondary hover:text-white"
                onClick={() => handleSort('views')}
              >
                Views {sortField === 'views' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer text-xtube-text-secondary hover:text-white"
                onClick={() => handleSort('duration')}
              >
                Duration {sortField === 'duration' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-xtube-text-secondary">Status</TableHead>
              <TableHead className="text-xtube-text-secondary">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVideos.length === 0 ? (
              <TableRow className="border-xtube-border hover:bg-transparent">
                <TableCell colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Film className="h-10 w-10 text-xtube-text-secondary" />
                    <p className="text-white">No videos found</p>
                    <p className="text-sm text-xtube-text-secondary">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedVideos.map((video) => (
                <TableRow
                  key={video.id}
                  className="border-xtube-border hover:bg-white/[0.02]"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(video.id)}
                      onCheckedChange={() => toggleSelect(video.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="h-12 w-20 overflow-hidden rounded-md bg-xtube-bg">
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-5 w-5 text-xtube-text-secondary" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[200px] truncate font-medium text-white">{video.title}</p>
                    <p className="text-xs text-xtube-text-secondary">{video.createdAt}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-xtube-border text-xtube-text-secondary">
                      {video.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-xtube-text-secondary" />
                      <span className="text-sm text-white">{formatViews(video.views)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-xtube-text-secondary" />
                      <span className="text-sm text-white">{video.duration}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`cursor-pointer ${
                        video.isPublished
                          ? 'border-green-500/30 bg-green-500/10 text-green-400'
                          : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                      }`}
                      onClick={() => onTogglePublish(video.id)}
                    >
                      {video.isPublished ? 'Published' : 'Draft'}
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-xtube-text-secondary">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredVideos.length)} of{' '}
            {filteredVideos.length}
          </p>
          <div className="flex items-center gap-2">
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
        </div>
      )}
    </div>
  )
}
