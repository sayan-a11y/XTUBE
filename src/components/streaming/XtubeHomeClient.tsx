'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/streaming/Sidebar'
import { BottomNav } from '@/components/streaming/BottomNav'
import { SearchBar } from '@/components/streaming/SearchBar'
import { HeroAdsSlider } from '@/components/streaming/HeroAdsSlider'
import { FooterAds } from '@/components/streaming/FooterAds'
import { CategorySection } from '@/components/streaming/CategorySection'
import { VideoGrid } from '@/components/streaming/VideoGrid'
import { Flame, Sparkles, Clock, Search, Film, History } from 'lucide-react'
import { XtubeLogo } from '@/components/shared/XtubeLogo'
import { AdminLoginModal } from '@/components/shared/AdminLoginModal'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

// ─── Dynamic imports (SSR: false) to prevent server-side hoisting and window API conflicts ───
const VideoPlayer = dynamic(
  () => import('@/components/streaming/VideoPlayer').then((m) => m.VideoPlayer),
  { ssr: false }
)

const AdminPanel = dynamic(
  () => import('@/components/streaming/AdminPanel').then((m) => m.AdminPanel),
  { ssr: false }
)

const AgeVerificationPopup = dynamic(
  () => import('@/components/streaming/AgeVerificationPopup').then((m) => m.AgeVerificationPopup),
  { ssr: false }
)

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoData {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  category: string
  duration: string
  views: number
  isHd: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface CategoryData {
  id: string
  name: string
  slug: string
  icon: string | null
  order: number
}

interface AdData {
  id: string
  type: string
  position: string
  title: string
  imageUrl: string
  linkUrl: string | null
  impressions: number
  clicks: number
  revenue: number
  isActive: boolean
  startDate: string | null
  endDate: string | null
  frequency: number
  createdAt: string
}

interface HeroAdData {
  id: string
  title: string
  description?: string
  category?: string
  mediaUrl: string
  thumbnailUrl?: string
  adType: string
  mediaFormat: string
  isActive: boolean
  displayOrder: number
  impressions: number
  clicks: number
  ctr: number
}

interface FooterAdData {
  id: string
  title: string
  mediaUrl: string
  thumbnailUrl?: string
  adType: string
  mediaFormat: string
  linkUrl?: string
  isActive: boolean
  impressions: number
  clicks: number
  ctr: number
}

interface CommentData {
  id: string
  content: string
  likes: number
  createdAt: string
  user: {
    id: string
    username: string
    avatar: string | null
  }
  replies?: Array<{
    id: string
    content: string
    likes: number
    createdAt: string
    user: {
      id: string
      username: string
      avatar: string | null
    }
    replies?: Array<never>
  }>
}

export interface XtubeHomeClientProps {
  initialVideos?: VideoData[]
  initialCategories?: CategoryData[]
  initialAds?: AdData[]
  initialHeroAds?: HeroAdData[]
  initialFooterAds?: FooterAdData[]
}

export function XtubeHomeClient({
  initialVideos = [],
  initialCategories = [],
  initialAds = [],
  initialHeroAds = [],
  initialFooterAds = [],
}: XtubeHomeClientProps) {
  const {
    currentView,
    selectedVideoId,
    selectedCategory,
    searchQuery,
    sidebarCollapsed,
  } = useAppStore()

  // ─── Restore admin session on page load ────────────────────────────────────

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('admin_token')
      if (token && !useAppStore.getState().adminUnlocked) {
        useAppStore.getState().setAdminUnlocked(true)
        useAppStore.getState().setAdminLoggedIn(true)
      }
    }
  }, [])

  // Data state
  const [videos, setVideos] = useState<VideoData[]>(initialVideos)
  const [categories, setCategories] = useState<CategoryData[]>(initialCategories)
  const [ads, setAds] = useState<AdData[]>(initialAds)
  const [heroAds, setHeroAds] = useState<HeroAdData[]>(initialHeroAds)
  const [footerAds, setFooterAds] = useState<FooterAdData[]>(initialFooterAds)
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null)
  const [videoComments, setVideoComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(initialVideos.length === 0)
  const [seeded, setSeeded] = useState(false)

  // ─── Fetch Videos ──────────────────────────────────────────────────────────

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/videos?limit=50')
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos || [])
      }
    } catch (err) {
      console.error('Error fetching videos:', err)
    }
  }, [])

  // ─── Fetch Categories ──────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  // ─── Fetch Ads ─────────────────────────────────────────────────────────────

  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch('/api/ads?position=hero')
      if (res.ok) {
        const data = await res.json()
        setAds(data.ads || [])
      }
    } catch (err) {
      console.error('Error fetching ads:', err)
    }
  }, [])

  // ─── Fetch Hero Ads ────────────────────────────────────────────────────────

  const fetchHeroAds = useCallback(async () => {
    try {
      const res = await fetch('/api/hero-ads?active=true')
      if (res.ok) {
        const data = await res.json()
        setHeroAds(data.heroAds || [])
      }
    } catch (err) {
      console.error('Error fetching hero ads:', err)
    }
  }, [])

  // ─── Fetch Footer Ads ─────────────────────────────────────────────────────

  const fetchFooterAds = useCallback(async () => {
    try {
      const res = await fetch('/api/footer-ads?active=true')
      if (res.ok) {
        const data = await res.json()
        setFooterAds(data.footerAds || [])
      }
    } catch (err) {
      console.error('Error fetching footer ads:', err)
    }
  }, [])

  // ─── Realtime Synchronization Hook ──────────────────────────────────────────
  useRealtimeSync(useCallback((type, data) => {
    console.log(`Realtime sync event received: ${type}`, data)
    if (type.startsWith('video:') || type.includes('video:')) {
      fetchVideos()
    } else if (type.startsWith('category:') || type.includes('category:')) {
      fetchCategories()
    } else if (
      type.startsWith('ad:') || type.includes('ad:') ||
      type.startsWith('hero_ad:') || type.includes('hero_ad:') ||
      type.startsWith('footer_ad:') || type.includes('footer_ad:')
    ) {
      fetchAds()
      fetchHeroAds()
      fetchFooterAds()
    }
  }, [fetchVideos, fetchCategories, fetchAds, fetchHeroAds, fetchFooterAds]))

  // ─── Seed Database (Non-blocking background check) ─────────────────────────
  useEffect(() => {
    fetch('/api/seed', { method: 'POST' }).catch((err) => {
      console.warn('Background seed check completed/skipped:', err)
    })
  }, [])

  // ─── Load initial data (Instant on mount) ───────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const loadData = async () => {
      try {
        await Promise.all([
          fetchVideos(),
          fetchCategories(),
          fetchAds(),
          fetchHeroAds(),
          fetchFooterAds(),
        ])
      } catch (err) {
        console.error('Error fetching initial page data:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [fetchVideos, fetchCategories, fetchAds, fetchHeroAds, fetchFooterAds])

  // ─── Load video when selected ──────────────────────────────────────────────

  useEffect(() => {
    if (!selectedVideoId) return
    let cancelled = false
    const load = async () => {
      try {
        const [videoRes, commentsRes] = await Promise.all([
          fetch(`/api/videos/${selectedVideoId}`),
          fetch(`/api/comments?videoId=${selectedVideoId}`),
        ])
        if (cancelled) return
        if (videoRes.ok) {
          const videoData = await videoRes.json()
          setCurrentVideo(videoData.video)
        }
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json()
          setVideoComments(commentsData.comments || [])
        }
      } catch (err) {
        if (!cancelled) console.error('Error loading video:', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedVideoId])

  // ─── Add Comment Handler ───────────────────────────────────────────────────

  const handleAddComment = useCallback(
    async (content: string, parentId?: string) => {
      if (!selectedVideoId) return
      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            videoId: selectedVideoId,
            parentId,
          }),
        })
        if (res.ok) {
          const commentsRes = await fetch(`/api/comments?videoId=${selectedVideoId}`)
          if (commentsRes.ok) {
            const commentsData = await commentsRes.json()
            setVideoComments(commentsData.comments || [])
          }
        }
      } catch (err) {
        console.error('Error adding comment:', err)
      }
    },
    [selectedVideoId]
  )

  // ─── Group videos by category (memoized to prevent re-computing) ──────────

  const videosByCategory = useMemo(() => {
    const grouped: Record<string, VideoData[]> = {}
    videos.forEach((v) => {
      if (!grouped[v.category]) grouped[v.category] = []
      grouped[v.category].push(v)
    })
    return grouped
  }, [videos])

  // ─── Get trending videos (memoized) ────────────────────────────────────

  const trendingVideos = useMemo(() =>
    [...videos].sort((a, b) => b.views - a.views).slice(0, 20),
    [videos]
  )

  // ─── Get filtered videos for search ────────────────────────────────────────

  const searchResults = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ─── Get related videos for video player ───────────────────────────────────

  const relatedVideos = currentVideo
    ? videos
        .filter((v) => v.id !== currentVideo.id)
        .sort((a, b) => {
          if (a.category === currentVideo.category && b.category !== currentVideo.category) return -1
          if (b.category === currentVideo.category && a.category !== currentVideo.category) return 1
          return b.views - a.views
        })
        .slice(0, 15)
        .map((v) => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          duration: v.duration,
          views: v.views,
          category: v.category,
        }))
    : []

  // ─── Prepare hero ads for slider ──────────────────────────────────────────

  const heroAdsSliderData = heroAds.map((ad) => ({
    id: ad.id,
    title: ad.title,
    description: ad.description || undefined,
    category: ad.category || undefined,
    mediaUrl: ad.mediaUrl,
    thumbnailUrl: ad.thumbnailUrl || undefined,
    adType: ad.adType as 'image' | 'video',
    mediaFormat: ad.mediaFormat,
  }))

  // Prepare footer ads data
  const footerAdsData = footerAds.map((ad) => ({
    id: ad.id,
    title: ad.title,
    mediaUrl: ad.mediaUrl,
    thumbnailUrl: ad.thumbnailUrl || undefined,
    adType: ad.adType as 'image' | 'video' | 'gif' | 'html5',
    mediaFormat: ad.mediaFormat,
    linkUrl: ad.linkUrl || undefined,
  }))

  // ─── Get videos for specific category ──────────────────────────────────────

  const categoryVideos = selectedCategory
    ? videos.filter((v) => v.category === selectedCategory)
    : []

  // ─── Render Views ──────────────────────────────────────────────────────────

  const renderHomeView = () => {
    if (loading) {
      return (
        <div className="space-y-6 pb-20 md:pb-8">
          <div className="h-[240px] sm:h-[320px] md:h-[420px] animate-shimmer bg-xtube-card" />
          <section className="px-3 md:px-5 space-y-4">
            <div className="h-7 w-40 rounded-lg animate-shimmer bg-xtube-card" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[200px] sm:w-[220px] md:w-[240px] flex-shrink-0 space-y-2">
                  <div className="aspect-video rounded-lg animate-shimmer bg-xtube-card" />
                  <div className="h-4 w-3/4 rounded animate-shimmer bg-xtube-card" />
                  <div className="h-3 w-1/2 rounded animate-shimmer bg-xtube-card" />
                </div>
              ))}
            </div>
          </section>
        </div>
      )
    }

    return (
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Hero Ads Slider - Only hero ads, no trending videos */}
        <HeroAdsSlider ads={heroAdsSliderData} />
        <section className="px-3 md:px-5">
          <CategorySection
            title="🔥 Trending Now"
            category="trending"
            videos={trendingVideos.map((v) => ({
              id: v.id,
              title: v.title,
              thumbnail: v.thumbnail,
              duration: v.duration,
              views: v.views,
              category: v.category,
              isHd: v.isHd,
              createdAt: v.createdAt,
            }))}
          />
        </section>
        {Object.entries(videosByCategory).map(([category, categoryVids]) => (
          <section key={category} className="px-4 md:px-6">
            <CategorySection
              title={category}
              category={category}
              videos={categoryVids.map((v) => ({
                id: v.id,
                title: v.title,
                thumbnail: v.thumbnail,
                duration: v.duration,
                views: v.views,
                category: v.category,
                isHd: v.isHd,
                createdAt: v.createdAt,
              }))}
            />
          </section>
        ))}
        {/* Footer Ads Section */}
        <div className="mt-6">
          <FooterAds ads={footerAdsData} />
        </div>
      </div>
    )
  }

  const renderTrendingView = () => (
    <div className="px-3 md:px-5 pb-20 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/20">
          <Flame className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Trending</h1>
          <p className="text-sm text-xtube-text-secondary">Most popular videos right now</p>
        </div>
      </div>
      <VideoGrid
        videos={trendingVideos.map((v) => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          duration: v.duration,
          views: v.views,
          category: v.category,
          isHd: v.isHd,
          createdAt: v.createdAt,
        }))}
        loading={loading}
        emptyMessage="No trending videos"
      />
    </div>
  )

  const renderCategoryView = () => (
    <div className="px-3 md:px-5 pb-20 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/20">
          <Sparkles className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {selectedCategory || 'All Categories'}
          </h1>
          <p className="text-sm text-xtube-text-secondary">
            Browse videos by category
          </p>
        </div>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => useAppStore.getState().setSelectedCategory(cat.name)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === cat.name
                ? 'bg-xtube-red text-white'
                : 'bg-xtube-card text-xtube-text-secondary hover:bg-xtube-card-hover hover:text-white'
            }`}
          >
            {cat.name}
          </motion.button>
        ))}
      </div>
      <VideoGrid
        videos={categoryVideos.map((v) => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          duration: v.duration,
          views: v.views,
          category: v.category,
          isHd: v.isHd,
          createdAt: v.createdAt,
        }))}
        loading={loading}
        emptyMessage={`No videos in ${selectedCategory || 'this category'}`}
      />
    </div>
  )

  const renderBookmarksView = () => (
    <div className="px-3 md:px-5 pb-20 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/20">
          <Clock className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Bookmarks</h1>
          <p className="text-sm text-xtube-text-secondary">Your saved videos</p>
        </div>
      </div>
      <VideoGrid
        videos={[]}
        loading={loading}
        emptyMessage="No bookmarked videos yet. Save videos to watch later!"
      />
    </div>
  )

  const renderHistoryView = () => (
    <div className="px-3 md:px-5 pb-20 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/20">
          <History className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Watch History</h1>
          <p className="text-sm text-xtube-text-secondary">Videos you've watched</p>
        </div>
      </div>
      <VideoGrid
        videos={[]}
        loading={loading}
        emptyMessage="No watch history yet. Start watching videos!"
      />
    </div>
  )

  const renderSearchView = () => (
    <div className="px-3 md:px-5 pb-20 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xtube-red/20">
          <Search className="h-5 w-5 text-xtube-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Search: {searchQuery}
          </h1>
          <p className="text-sm text-xtube-text-secondary">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>
      <VideoGrid
        videos={searchResults.map((v) => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail,
          duration: v.duration,
          views: v.views,
          category: v.category,
          isHd: v.isHd,
          createdAt: v.createdAt,
        }))}
        loading={loading}
        emptyMessage={`No videos found for "${searchQuery}"`}
      />
    </div>
  )

  const renderVideoView = () => {
    if (!currentVideo) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse-red flex h-12 w-12 items-center justify-center rounded-full bg-xtube-red/20">
            <Film className="h-6 w-6 text-xtube-red" />
          </div>
        </div>
      )
    }

    return (
      <VideoPlayer
        video={currentVideo}
        relatedVideos={relatedVideos}
        comments={videoComments}
        onAddComment={handleAddComment}
      />
    )
  }

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Video view has its own full layout */}
      {currentView === 'video' ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {renderVideoView()}
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Mobile Bottom Nav */}
          <BottomNav />

          {/* Main Content Area */}
          <motion.main
            className={`min-h-screen transition-all duration-300 ${
              sidebarCollapsed ? 'md:ml-[64px]' : 'md:ml-[180px]'
            }`}
          >
            {/* Top Header Bar */}
            {currentView !== 'admin' && (
              <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-xtube-border bg-[#050505]/90 px-3 backdrop-blur-md md:px-4 lg:px-5">
                <div className="flex items-center gap-2">
                  {/* Mobile Logo — only shows on mobile (<768px), sidebar has logo on md+ */}
                  <div className="md:hidden">
                     <XtubeLogo
                      size="sm"
                      showText={true}
                      showLive={true}
                    />
                  </div>

                  {/* View Title - only on md+ since sidebar has logo */}
                  <h2 className="hidden text-xs font-medium text-xtube-text-secondary md:block">
                    {currentView === 'home' && 'Home'}
                    {currentView === 'trending' && 'Trending'}
                    {currentView === 'category' && 'Categories'}
                    {currentView === 'bookmarks' && 'Bookmarks'}
                    {currentView === 'history' && 'History'}
                    {currentView === 'search' && 'Search'}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <SearchBar />
                </div>
              </header>
            )}

            {/* Page Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {currentView === 'home' && renderHomeView()}
                {currentView === 'trending' && renderTrendingView()}
                {currentView === 'category' && renderCategoryView()}
                {currentView === 'bookmarks' && renderBookmarksView()}
                {currentView === 'history' && renderHistoryView()}
                {currentView === 'search' && renderSearchView()}
              </motion.div>
            </AnimatePresence>
          </motion.main>
        </>
      )}

      {/* Age Verification Popup */}
      <AgeVerificationPopup />

      {/* Admin Login Modal (triggered by 7th logo click on desktop) */}
      <AdminLoginModal />

      {/* Admin Panel Overlay */}
      <AdminPanel />
    </div>
  )
}
