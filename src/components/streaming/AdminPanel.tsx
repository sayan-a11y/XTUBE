'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Film,
  Upload,
  List,
  Megaphone,
  BarChart3,
  Users,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Bell,
  Lock,
  Play,
  Image,
  Popcorn,
  Monitor,
  Layers,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { useAppStore, type AdminSection } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import { AdminDashboard } from './AdminDashboard'
import { VideoManager } from './VideoManager'
import { AdsManager } from './AdsManager'
import { AnalyticsPage } from '@/components/admin/AnalyticsPage'
import { UsersPage } from '@/components/admin/UsersPage'
import { SettingsPage } from '@/components/admin/SettingsPage'
import { CatalogPage } from '@/components/admin/CatalogPage'
import { VideoAdsAnalytics } from '@/components/admin/VideoAdsAnalytics'
import { VideoUploadPage } from '@/components/admin/VideoUploadPage'
import { PreRollAdsPage } from '@/components/admin/PreRollAdsPage'
import { MidRollAdsPage } from '@/components/admin/MidRollAdsPage'
import { PostRollAdsPage } from '@/components/admin/PostRollAdsPage'

// ─── Custom Hook: Tablet Detection ────────────────────────────────────────────

function useIsTablet() {
  const [isTablet, setIsTablet] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const onChange = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    mql.addEventListener('change', onChange)
    onChange()
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isTablet
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

interface NavItem {
  id: AdminSection | string
  label: string
  icon: React.ElementType
  section?: AdminSection
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'dashboard' },
  {
    id: 'video-group',
    label: 'Video',
    icon: Film,
    children: [
      { id: 'all-videos', label: 'All Videos', icon: Film, section: 'all-videos' },
      { id: 'video-upload', label: 'Video Upload', icon: Upload, section: 'video-upload' },
    ],
  },
  { id: 'catalog', label: 'Catalog', icon: List, section: 'catalog' },
  {
    id: 'ads-group',
    label: 'Ads Manager',
    icon: Megaphone,
    children: [
      { id: 'all-ads', label: 'All Ads', icon: Megaphone, section: 'all-ads' },
      { id: 'banner-ads', label: 'Banner Ads', icon: Image, section: 'banner-ads' },
      { id: 'popup-ads', label: 'Popup Ads', icon: Popcorn, section: 'popup-ads' },
      { id: 'hero-footer-ads', label: 'Hero/Footer Ads', icon: Monitor, section: 'hero-footer-ads' },
      {
        id: 'video-ads-group',
        label: 'Video Ads',
        icon: Play,
        children: [
          { id: 'pre-roll-ads', label: 'Pre-roll', icon: Play, section: 'pre-roll-ads' },
          { id: 'mid-roll-ads', label: 'Mid-roll', icon: Play, section: 'mid-roll-ads' },
          { id: 'post-roll-ads', label: 'Post-roll', icon: Play, section: 'post-roll-ads' },
          { id: 'overlay-ads', label: 'Overlay', icon: Layers, section: 'overlay-ads' },
          { id: 'video-ads-analytics', label: 'Ads Analytics', icon: BarChart3, section: 'video-ads-analytics' },
        ],
      },
    ],
  },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, section: 'analytics' },
  { id: 'users', label: 'Users', icon: Users, section: 'users' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'settings' },
]

// ─── Section Title Map ────────────────────────────────────────────────────────

const sectionTitles: Record<AdminSection, string> = {
  dashboard: 'Dashboard',
  'all-videos': 'All Videos',
  'video-upload': 'Video Upload',
  catalog: 'Catalog',
  'all-ads': 'All Ads',
  'banner-ads': 'Banner Ads',
  'popup-ads': 'Popup Ads',
  'hero-footer-ads': 'Hero / Footer Ads',
  'pre-roll-ads': 'Pre-roll Ads',
  'mid-roll-ads': 'Mid-roll Ads',
  'post-roll-ads': 'Post-roll Ads',
  'overlay-ads': 'Overlay Ads',
  'video-ads-analytics': 'Video Ads Analytics',
  analytics: 'Analytics',
  users: 'Users',
  settings: 'Settings',
}

// ─── Placeholder Components ───────────────────────────────────────────────────

function PlaceholderSection({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4 rounded-2xl border border-xtube-border bg-xtube-card px-12 py-16"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-xtube-red/10">
          <Icon className="h-8 w-8 text-xtube-red" />
        </div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-sm text-xtube-text-secondary">This section is coming soon.</p>
      </motion.div>
    </div>
  )
}

// ─── Mobile Block Screen ──────────────────────────────────────────────────────

function MobileBlockScreen({ onReturn }: { onReturn: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050505]"
    >
      {/* Subtle red glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-xtube-red/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-xtube-red shadow-[0_0_20px_rgba(229,9,20,0.4)]">
            <span className="text-xl font-bold text-white">X</span>
          </div>
          <span className="text-2xl font-bold text-white">
            Xtube<span className="text-xtube-text-secondary">.Admin</span>
          </span>
        </div>

        {/* Lock Icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="flex h-20 w-20 items-center justify-center rounded-full border border-xtube-border bg-xtube-card"
        >
          <Lock className="h-10 w-10 text-xtube-red" />
        </motion.div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Admin Panel Not Available on Mobile</h1>
          <p className="max-w-xs text-sm text-xtube-text-secondary">
            Please use a tablet or desktop device to access the admin dashboard.
          </p>
        </div>

        {/* Return Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onReturn}
          className="mt-2 rounded-xl bg-xtube-red px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-xtube-red-hover"
        >
          Return to Homepage
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

interface SidebarNavItemProps {
  item: NavItem
  depth: number
  activeSection: AdminSection
  collapsed: boolean
  expandedGroups: Set<string>
  onToggleGroup: (groupId: string) => void
  onSelectSection: (section: AdminSection) => void
  delay: number
}

function SidebarNavItem({
  item,
  depth,
  activeSection,
  collapsed,
  expandedGroups,
  onToggleGroup,
  onSelectSection,
  delay,
}: SidebarNavItemProps) {
  const hasChildren = item.children && item.children.length > 0
  const isActive = item.section === activeSection
  const isGroupExpanded = expandedGroups.has(item.id)
  const Icon = item.icon

  // Check if any child is active (for parent highlighting)
  const isChildActive = useMemo(() => {
    if (!hasChildren) return false
    const checkActive = (children: NavItem[]): boolean => {
      return children.some(
        (child) =>
          child.section === activeSection ||
          (child.children ? checkActive(child.children) : false)
      )
    }
    return checkActive(item.children!)
  }, [hasChildren, item.children, activeSection])

  const handleClick = () => {
    if (hasChildren) {
      onToggleGroup(item.id)
    } else if (item.section) {
      onSelectSection(item.section)
    }
  }

  // Collapsed mode: just show icon with tooltip
  if (collapsed) {
    return (
      <div className="relative group">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay }}
          onClick={handleClick}
          className={`relative flex w-full items-center justify-center rounded-lg px-0 py-2.5 transition-colors ${
            isActive
              ? 'bg-xtube-red/10 text-white'
              : isChildActive
                ? 'text-white'
                : 'text-xtube-text-secondary hover:bg-white/5 hover:text-white'
          }`}
        >
          {isActive && (
            <motion.div
              layoutId="admin-active-indicator"
              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-xtube-red"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <Icon
            className={`h-5 w-5 flex-shrink-0 ${
              isActive ? 'text-xtube-red' : isChildActive ? 'text-xtube-red/70' : ''
            }`}
          />
        </motion.button>
        {/* Tooltip */}
        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-xtube-card px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg border border-xtube-border transition-opacity group-hover:opacity-100">
          {item.label}
        </div>
      </div>
    )
  }

  return (
    <div>
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.2 }}
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          depth > 0 ? 'pl-7' : ''
        } ${
          isActive
            ? 'bg-xtube-red/10 text-white shadow-[0_0_10px_rgba(229,9,20,0.15)]'
            : isChildActive
              ? 'text-white'
              : 'text-xtube-text-secondary hover:bg-white/5 hover:text-white'
        }`}
      >
        {/* Active left border */}
        {isActive && (
          <motion.div
            layoutId="admin-active-tab"
            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-xtube-red"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}

        <Icon
          className={`h-[18px] w-[18px] flex-shrink-0 ${
            isActive
              ? 'text-xtube-red'
              : isChildActive
                ? 'text-xtube-red/70'
                : 'text-xtube-text-secondary group-hover:text-white'
          }`}
        />

        <span className="flex-1 text-left">{item.label}</span>

        {/* Expand/collapse chevron */}
        {hasChildren && (
          <motion.div
            animate={{ rotate: isGroupExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-xtube-text-secondary" />
          </motion.div>
        )}
      </motion.button>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && isGroupExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">
              {item.children!.map((child, idx) => (
                <SidebarNavItem
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  activeSection={activeSection}
                  collapsed={collapsed}
                  expandedGroups={expandedGroups}
                  onToggleGroup={onToggleGroup}
                  onSelectSection={onSelectSection}
                  delay={delay + (idx + 1) * 0.03}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main AdminPanel Component ────────────────────────────────────────────────

export function AdminPanel() {
  const {
    adminUnlocked,
    adminSection,
    adminSidebarCollapsed,
    setAdminSection,
    setAdminUnlocked,
    setAdminSidebarCollapsed,
  } = useAppStore()

  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet && !adminSidebarCollapsed) {
      setAdminSidebarCollapsed(true)
    }
  }, [isTablet, adminSidebarCollapsed, setAdminSidebarCollapsed])

  // Expandable groups state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['video-group', 'ads-group']))

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const [dashboardData, setDashboardData] = useState<any>(null)
  const [adminVideos, setAdminVideos] = useState<any[]>([])
  const [adminAds, setAdminAds] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const fetchAdminData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [analyticsRes, videosRes, adsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/videos?limit=100'),
        fetch('/api/ads'),
      ])

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setDashboardData(analyticsData)
      }

      if (videosRes.ok) {
        const videosData = await videosRes.json()
        setAdminVideos(videosData.videos || [])
      }

      if (adsRes.ok) {
        const adsData = await adsRes.json()
        setAdminAds(adsData.ads || [])
      }
    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (adminUnlocked) {
      fetchAdminData()
    }
  }, [adminUnlocked, fetchAdminData])

  // ─── Video Handlers ─────────────────────────────────────────────────────

  const handleVideoUpload = useCallback(
    async (data: any) => {
      try {
        const res = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error uploading video:', err)
      }
    },
    [fetchAdminData]
  )

  const handleVideoDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error deleting video:', err)
      }
    },
    [fetchAdminData]
  )

  const handleVideoTogglePublish = useCallback(
    async (id: string) => {
      const video = adminVideos.find((v) => v.id === id)
      if (!video) return
      try {
        const res = await fetch(`/api/videos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: !video.isPublished }),
        })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error toggling video publish:', err)
      }
    },
    [adminVideos, fetchAdminData]
  )

  // ─── Ad Handlers ────────────────────────────────────────────────────────

  const handleAdCreate = useCallback(
    async (data: any) => {
      try {
        const res = await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error creating ad:', err)
      }
    },
    [fetchAdminData]
  )

  const handleAdDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/ads?id=${id}`, { method: 'DELETE' })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error deleting ad:', err)
      }
    },
    [fetchAdminData]
  )

  const handleAdToggle = useCallback(
    async (id: string) => {
      const ad = adminAds.find((a) => a.id === id)
      if (!ad) return
      try {
        const res = await fetch('/api/ads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, isActive: !ad.isActive }),
        })
        if (res.ok) fetchAdminData()
      } catch (err) {
        console.error('Error toggling ad:', err)
      }
    },
    [adminAds, fetchAdminData]
  )

  // ─── Close Handler ──────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    setAdminUnlocked(false)
  }, [setAdminUnlocked])

  // ─── Content Rendering ─────────────────────────────────────────────────

  const adsSections: AdminSection[] = [
    'all-ads',
    'banner-ads',
    'popup-ads',
    'hero-footer-ads',
    'pre-roll-ads',
    'mid-roll-ads',
    'post-roll-ads',
    'overlay-ads',
    'video-ads-analytics',
  ]

  const renderContent = () => {
    switch (adminSection) {
      case 'dashboard':
        return <AdminDashboard data={dashboardData} loading={dataLoading} />
      case 'all-videos':
        return (
          <VideoManager
            videos={adminVideos.map((v) => ({
              id: v.id,
              title: v.title,
              thumbnail: v.thumbnail,
              category: v.category,
              views: v.views,
              duration: v.duration,
              isPublished: v.isPublished,
              createdAt: v.createdAt,
            }))}
            onUpload={handleVideoUpload}
            onDelete={handleVideoDelete}
            onTogglePublish={handleVideoTogglePublish}
            loading={dataLoading}
          />
        )
      case 'video-upload':
        return <VideoUploadPage />
      case 'pre-roll-ads':
        return <PreRollAdsPage />
      case 'mid-roll-ads':
        return <MidRollAdsPage />
      case 'post-roll-ads':
        return <PostRollAdsPage />
      case 'catalog':
        return <CatalogPage />
      case 'analytics':
        return <AnalyticsPage data={dashboardData} loading={dataLoading} />
      case 'users':
        return <UsersPage />
      case 'settings':
        return <SettingsPage />
      case 'video-ads-analytics':
        return (
          <VideoAdsAnalytics
            ads={adminAds.map((a) => ({
              id: a.id,
              type: a.type,
              position: a.position,
              title: a.title,
              imageUrl: a.imageUrl,
              impressions: a.impressions,
              clicks: a.clicks,
              revenue: a.revenue,
              isActive: a.isActive,
              createdAt: a.createdAt,
            }))}
          />
        )
      default:
        if (adsSections.includes(adminSection)) {
          return (
            <AdsManager
              ads={adminAds.map((a) => ({
                id: a.id,
                type: a.type,
                position: a.position,
                title: a.title,
                imageUrl: a.imageUrl,
                impressions: a.impressions,
                clicks: a.clicks,
                revenue: a.revenue,
                isActive: a.isActive,
                createdAt: a.createdAt,
              }))}
              onCreate={handleAdCreate}
              onDelete={handleAdDelete}
              onToggle={handleAdToggle}
              loading={dataLoading}
            />
          )
        }
        return <AdminDashboard data={dashboardData} loading={dataLoading} />
    }
  }

  // ─── Main Render ────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {adminUnlocked && (
        <motion.div
          key="admin-panel"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 flex bg-[#050505]"
        >
          {/* Mobile Block Screen */}
          {isMobile && <MobileBlockScreen onReturn={handleClose} />}

          {/* Desktop/Tablet Layout */}
          {!isMobile && (
            <>
              {/* ── Left Sidebar ── */}
              <motion.aside
                animate={{ width: adminSidebarCollapsed ? 72 : 240 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="relative flex flex-shrink-0 flex-col border-r border-xtube-border bg-[#0a0a0a] overflow-hidden"
              >
                {/* Sidebar Header */}
                <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-xtube-border px-4">
                  <AnimatePresence mode="wait">
                    {!adminSidebarCollapsed ? (
                      <motion.div
                        key="full-logo"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2.5"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xtube-red shadow-[0_0_10px_rgba(229,9,20,0.3)]">
                          <span className="text-sm font-bold text-white">X</span>
                        </div>
                        <span className="text-base font-bold text-white">
                          Xtube<span className="text-xtube-text-secondary">.Admin</span>
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="collapsed-logo"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center justify-center w-full"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-xtube-red shadow-[0_0_10px_rgba(229,9,20,0.3)]">
                          <span className="text-sm font-bold text-white">X</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!adminSidebarCollapsed && (
                    <button
                      onClick={handleClose}
                      className="rounded-lg p-1.5 text-xtube-text-secondary transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Close admin panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 no-scrollbar">
                  {navigationItems.map((item, idx) => (
                    <SidebarNavItem
                      key={item.id}
                      item={item}
                      depth={0}
                      activeSection={adminSection}
                      collapsed={adminSidebarCollapsed}
                      expandedGroups={expandedGroups}
                      onToggleGroup={toggleGroup}
                      onSelectSection={setAdminSection}
                      delay={idx * 0.04}
                    />
                  ))}
                </nav>

                {/* Sidebar Footer - Logout */}
                <div className="flex-shrink-0 border-t border-xtube-border p-3">
                  {adminSidebarCollapsed ? (
                    <div className="relative group">
                      <button
                        onClick={handleClose}
                        className="flex w-full items-center justify-center rounded-lg px-0 py-2.5 text-xtube-text-secondary transition-colors hover:bg-xtube-red/10 hover:text-xtube-red"
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-xtube-card px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg border border-xtube-border transition-opacity group-hover:opacity-100">
                        Logout
                      </div>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleClose}
                      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-xtube-text-secondary transition-colors hover:bg-xtube-red/10 hover:text-xtube-red"
                    >
                      <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
                      <span>Logout</span>
                    </motion.button>
                  )}
                </div>

                {/* Collapse/Expand Toggle */}
                <button
                  onClick={() => setAdminSidebarCollapsed(!adminSidebarCollapsed)}
                  className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-xtube-border bg-xtube-card text-xtube-text-secondary shadow-md transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={adminSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {adminSidebarCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronLeft className="h-3 w-3" />
                  )}
                </button>
              </motion.aside>

              {/* ── Main Content Area ── */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl px-4 md:px-6">
                  {/* Left: Hamburger + Title */}
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAdminSidebarCollapsed(!adminSidebarCollapsed)}
                      className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Toggle sidebar"
                    >
                      {adminSidebarCollapsed ? (
                        <PanelLeft className="h-5 w-5" />
                      ) : (
                        <PanelLeftClose className="h-5 w-5" />
                      )}
                    </motion.button>
                    <div>
                      <h1 className="text-lg font-bold text-white">
                        {sectionTitles[adminSection] || 'Admin Dashboard'}
                      </h1>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 md:gap-3">
                    {/* Create New Ad Button */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setAdminSection('all-ads')}
                      className="hidden items-center gap-2 rounded-xl bg-xtube-red px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-colors hover:bg-xtube-red-hover sm:flex"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Ad
                    </motion.button>

                    {/* Notification Bell with badge count */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {/* Notification count badge */}
                      <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-xtube-red text-[9px] font-bold text-white shadow-[0_0_8px_rgba(229,9,20,0.6)]">
                        12
                      </span>
                    </motion.button>

                    {/* Admin Avatar + Dropdown */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5"
                      aria-label="Admin profile"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-xtube-red to-red-700 shadow-[0_0_12px_rgba(229,9,20,0.3)]">
                        <span className="text-xs font-bold text-white">A</span>
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-xs font-semibold text-white">Admin</p>
                        <p className="text-[10px] text-white/30">Super Admin</p>
                      </div>
                      <ChevronDown className="hidden h-3 w-3 text-white/40 sm:block" />
                    </motion.button>
                  </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-xtube-bg">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={adminSection}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {renderContent()}
                    </motion.div>
                  </AnimatePresence>
                </main>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
