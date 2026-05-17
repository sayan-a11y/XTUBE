import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import {
  Grid3X3,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Film,
  GripVertical,
  Flame,
  Sparkles,
  Heart,
  Clock,
  Star,
  Gamepad2,
  Music,
  Newspaper,
  GraduationCap,
  Dumbbell,
  Globe,
  Mic2,
  Palette,
  Plane,
  Utensils,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface CategoryItem {
  id: string
  name: string
  slug: string
  icon: string
  order: number
  videoCount: number
  viewCount: number
}

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  sparkles: Sparkles,
  heart: Heart,
  clock: Clock,
  star: Star,
  gamepad: Gamepad2,
  music: Music,
  newspaper: Newspaper,
  graduation: GraduationCap,
  dumbbell: Dumbbell,
  globe: Globe,
  mic: Mic2,
  palette: Palette,
  plane: Plane,
  utensils: Utensils,
  film: Film,
}

const iconOptions = Object.keys(iconMap)

function formatViewCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

const categoryColors = [
  'from-red-600/20 to-red-900/10',
  'from-amber-600/20 to-amber-900/10',
  'from-green-600/20 to-green-900/10',
  'from-blue-600/20 to-blue-900/10',
  'from-purple-600/20 to-purple-900/10',
  'from-cyan-600/20 to-cyan-900/10',
  'from-pink-600/20 to-pink-900/10',
  'from-indigo-600/20 to-indigo-900/10',
  'from-orange-600/20 to-orange-900/10',
  'from-teal-600/20 to-teal-900/10',
  'from-yellow-600/20 to-yellow-900/10',
  'from-rose-600/20 to-rose-900/10',
]

export function CatalogPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formIcon, setFormIcon] = useState('flame')
  const [formOrder, setFormOrder] = useState('1')

  const fetchCategories = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Hook up realtime listener for instant category changes
  useRealtimeSync(useCallback((type) => {
    if (type.startsWith('category:') || type.includes('category:')) {
      fetchCategories(true)
    }
  }, [fetchCategories]))

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])


  const resetForm = () => {
    setFormName('')
    setFormSlug('')
    setFormIcon('flame')
    setFormOrder('1')
    setEditingCategory(null)
  }

  const openEditDialog = (category: CategoryItem) => {
    setEditingCategory(category)
    setFormName(category.name)
    setFormSlug(category.slug)
    setFormIcon(category.icon)
    setFormOrder(category.order.toString())
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setFormOrder((categories.length + 1).toString())
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formSlug.trim()) return

    try {
      if (editingCategory) {
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCategory.id,
            name: formName,
            slug: formSlug,
            icon: formIcon,
            order: parseInt(formOrder, 10),
          }),
        })
        if (res.ok) {
          fetchCategories()
        }
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            slug: formSlug,
            icon: formIcon,
            order: parseInt(formOrder, 10),
          }),
        })
        if (res.ok) {
          fetchCategories()
        }
      }
    } catch (err) {
      console.error('Error saving category:', err)
    }

    setDialogOpen(false)
    resetForm()
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    try {
      const res = await fetch(`/api/categories?id=${deletingCategory.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchCategories()
      }
    } catch (err) {
      console.error('Error deleting category:', err)
    }
    setDeleteDialogOpen(false)
    setDeletingCategory(null)
  }

  const openDeleteDialog = (category: CategoryItem) => {
    setDeletingCategory(category)
    setDeleteDialogOpen(true)
  }

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)


  return (
    <div className="space-y-4 p-3 lg:p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-xtube-red/10">
            <Grid3X3 className="h-5 w-5 text-xtube-red" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Category Management</h2>
            <p className="text-sm text-xtube-text-secondary">{categories.length} categories configured</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              className="bg-xtube-red hover:bg-xtube-red-hover text-white h-9 px-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="border-xtube-border bg-xtube-card text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </DialogTitle>
              <DialogDescription className="text-xtube-text-secondary">
                {editingCategory ? 'Update the category details.' : 'Add a new category to organize your content.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-sm text-white">Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value)
                    setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                  }}
                  placeholder="Category name"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white">Slug</Label>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="category-slug"
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary h-9 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white">Icon</Label>
                <Select value={formIcon} onValueChange={setFormIcon}>
                  <SelectTrigger className="border-xtube-border bg-xtube-bg text-white h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-xtube-border bg-xtube-card text-white max-h-[200px]">
                    {iconOptions.map((iconKey) => {
                      const IconComp = iconMap[iconKey]
                      return (
                        <SelectItem key={iconKey} value={iconKey}>
                          <span className="flex items-center gap-2">
                            <IconComp className="h-4 w-4" />
                            <span className="capitalize">{iconKey}</span>
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white">Order</Label>
                <Input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(e.target.value)}
                  min={1}
                  className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary h-9 w-24"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => { setDialogOpen(false); resetForm() }}
                className="text-xtube-text-secondary hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-xtube-red hover:bg-xtube-red-hover text-white"
                disabled={!formName.trim() || !formSlug.trim()}
              >
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Category Grid */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-xtube-red border-t-transparent" />
        </div>
      ) : sortedCategories.length === 0 ? (
        <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0f0f0f]/80 p-8 text-center backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-xtube-red/10 text-xtube-red mb-3">
            <Grid3X3 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Categories Found</h3>
          <p className="text-sm text-xtube-text-secondary max-w-sm mb-4">
            Create categories to organize your video catalog and show them on the home page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {sortedCategories.map((category, idx) => {
              const IconComp = iconMap[category.icon] || Film
              const gradientColor = categoryColors[idx % categoryColors.length]

              return (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: 0.05 + idx * 0.03, duration: 0.3 }}
                  className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl p-3 lg:p-4 transition-all hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="relative z-10">
                    {/* Top: Icon + Order + Actions */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-3 w-3 items-center justify-center text-xtube-text-secondary/40">
                          <GripVertical className="h-3 w-3" />
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xtube-red/10">
                          <IconComp className="h-5 w-5 text-xtube-red" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditDialog(category)}
                          className="rounded-md p-1.5 text-xtube-text-secondary hover:text-white hover:bg-white/10 transition-colors"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(category)}
                          className="rounded-md p-1.5 text-xtube-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Category Name */}
                    <h4 className="text-base font-semibold text-white mb-1">{category.name}</h4>
                    <p className="text-xs text-xtube-text-secondary font-mono mb-3">/{category.slug}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Film className="h-3.5 w-3.5 text-xtube-text-secondary" />
                        <span className="text-sm text-xtube-text-secondary">{category.videoCount} videos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-xtube-text-secondary" />
                        <span className="text-sm text-xtube-text-secondary">{formatViewCount(category.viewCount)} views</span>
                      </div>
                    </div>

                    {/* Order badge */}
                    <div className="absolute top-3 right-3 group-hover:top-auto group-hover:right-auto group-hover:bottom-3 group-hover:left-3">
                      <Badge
                        variant="outline"
                        className="border-xtube-border bg-xtube-bg/50 text-xtube-text-secondary text-[10px] h-5 px-1.5"
                      >
                        #{category.order}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-xtube-border bg-xtube-card text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Category</DialogTitle>
            <DialogDescription className="text-xtube-text-secondary">
              Are you sure you want to delete &ldquo;{deletingCategory?.name}&rdquo;? This action cannot be undone. Videos in this category will become uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-xtube-text-secondary hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
