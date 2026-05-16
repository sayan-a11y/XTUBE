'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Film,
  Megaphone,
  BarChart3,
  Settings,
  X,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { AdminDashboard } from './AdminDashboard'
import { VideoManager } from './VideoManager'
import { AdsManager } from './AdsManager'

interface AdminTab {
  id: string
  label: string
  icon: React.ElementType
}

const adminTabs: AdminTab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'videos', label: 'Videos', icon: Film },
  { id: 'ads', label: 'Ads', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function AdminSettings() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>
      <div className="rounded-lg border border-xtube-border bg-xtube-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">General Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-xtube-border p-4">
            <div>
              <p className="font-medium text-white">Site Name</p>
              <p className="text-sm text-xtube-text-secondary">Xtube Streaming Platform</p>
            </div>
            <button className="rounded-md bg-xtube-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-xtube-red-hover">
              Edit
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-xtube-border p-4">
            <div>
              <p className="font-medium text-white">Maintenance Mode</p>
              <p className="text-sm text-xtube-text-secondary">Disable site for maintenance</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-xtube-border transition-colors" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-xtube-border p-4">
            <div>
              <p className="font-medium text-white">Default Video Quality</p>
              <p className="text-sm text-xtube-text-secondary">Auto (Recommended)</p>
            </div>
            <button className="rounded-md bg-xtube-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-xtube-red-hover">
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminPanel() {
  const { adminUnlocked, adminTab, setAdminTab, setAdminUnlocked, setView } = useAppStore()

  // Real data state
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [adminVideos, setAdminVideos] = useState<any[]>([])
  const [adminAds, setAdminAds] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Fetch all admin data
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

  // Load data when admin panel opens
  useEffect(() => {
    if (adminUnlocked) {
      fetchAdminData()
    }
  }, [adminUnlocked, fetchAdminData])

  const handleClose = () => {
    setAdminUnlocked(false)
    setView('home')
  }

  // Video management handlers
  const handleVideoUpload = useCallback(async (data: any) => {
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error('Error uploading video:', err)
    }
  }, [fetchAdminData])

  const handleVideoDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error('Error deleting video:', err)
    }
  }, [fetchAdminData])

  const handleVideoTogglePublish = useCallback(async (id: string) => {
    const video = adminVideos.find((v) => v.id === id)
    if (!video) return
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !video.isPublished }),
      })
      if (res.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error('Error toggling video publish:', err)
    }
  }, [adminVideos, fetchAdminData])

  // Ad management handlers
  const handleAdCreate = useCallback(async (data: any) => {
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error('Error creating ad:', err)
    }
  }, [fetchAdminData])

  const handleAdDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ads?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error('Error deleting ad:', err)
    }
  }, [fetchAdminData])

  const handleAdToggle = useCallback(async (id: string) => {
    const ad = adminAds.find((a) => a.id === id)
    if (!ad) return
    try {
      const res = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !ad.isActive }),
      })
      if (res.ok) {
        fetchAdminData()
      }
    } catch (err) {
      console.error('Error toggling ad:', err)
    }
  }, [adminAds, fetchAdminData])

  const renderContent = () => {
    switch (adminTab) {
      case 'dashboard':
        return <AdminDashboard data={dashboardData} loading={dataLoading} />
      case 'videos':
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
      case 'ads':
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
      case 'analytics':
        return <AdminDashboard data={dashboardData} loading={dataLoading} />
      case 'settings':
        return <AdminSettings />
      default:
        return <AdminDashboard data={dashboardData} loading={dataLoading} />
    }
  }

  return (
    <AnimatePresence>
      {adminUnlocked && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 flex bg-[#0a0a0a]"
        >
          {/* Sidebar */}
          <div className="flex w-56 flex-shrink-0 flex-col border-r border-xtube-border bg-[#0a0a0a] md:w-64">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-xtube-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-xtube-red">
                  <span className="text-sm font-bold text-white">X</span>
                </div>
                <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              </div>
              <button
                onClick={handleClose}
                className="rounded-md p-1.5 text-xtube-text-secondary transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close admin panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3">
              {adminTabs.map((tab) => {
                const isActive = adminTab === tab.id
                const Icon = tab.icon

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-xtube-red/10 text-white'
                        : 'text-xtube-text-secondary hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="admin-active-tab"
                        className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-xtube-red"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-xtube-red' : 'text-xtube-text-secondary group-hover:text-white'
                      }`}
                    />
                    <span>{tab.label}</span>
                  </motion.button>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-xtube-border p-3">
              <div className="rounded-lg bg-xtube-card p-3">
                <p className="text-xs text-xtube-text-secondary">Logged in as</p>
                <p className="text-sm font-medium text-white">Admin</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="flex h-16 items-center justify-between border-b border-xtube-border bg-[#0a0a0a] px-6">
              <h2 className="text-lg font-semibold capitalize text-white">
                {adminTab === 'analytics' ? 'Analytics' : adminTab}
              </h2>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                  Live
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-xtube-bg">
              {renderContent()}
            </div>
          </div>

          {/* Mobile Close Overlay */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-xtube-red/20 p-2 text-xtube-red transition-colors hover:bg-xtube-red/30 md:hidden"
            aria-label="Close admin panel"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
