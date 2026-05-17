'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdRecord {
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
  mediaUrl: string | null
  mediaFormat: string
  adDuration: number
  skipAfter: number
  quality: string
  createdAt: string
  updatedAt: string
}

export interface AdsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdsFilterOptions {
  type?: string
  position?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}

export interface AdsStats {
  totalAds: number
  activeAds: number
  pausedAds: number
  totalImpressions: number
  totalClicks: number
  totalRevenue: number
  avgCTR: number
}

// ─── Helper: Format numbers ──────────────────────────────────────────────────

export function formatAdNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

export function formatAdRevenue(num: number): string {
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRealtimeAds(filters?: AdsFilterOptions) {
  const [ads, setAds] = useState<AdRecord[]>([])
  const [pagination, setPagination] = useState<AdsPagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filtersRef = useRef(filters)

  // Keep filters ref updated
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // ─── Fetch ads from API ────────────────────────────────────────────────

  const fetchAds = useCallback(async () => {
    try {
      const params = new URLSearchParams({ admin: 'true', limit: '200' })
      const f = filtersRef.current
      if (f?.type) params.set('type', f.type)
      if (f?.position) params.set('position', f.position)
      if (f?.status) params.set('status', f.status)
      if (f?.search) params.set('search', f.search)
      if (f?.page) params.set('page', String(f.page))
      if (f?.limit) params.set('limit', String(f.limit))

      const res = await fetch(`/api/ads?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch ads')
      const data = await res.json()
      setAds(data.ads || [])
      if (data.pagination) setPagination(data.pagination)
      setError(null)
    } catch (err) {
      console.error('Error fetching ads:', err)
      setError('Failed to load ads')
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Delete ad ─────────────────────────────────────────────────────────

  const deleteAd = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ads?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete ad')
      // Optimistic removal
      setAds(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Error deleting ad:', err)
    }
  }, [])

  // ─── Toggle ad status ─────────────────────────────────────────────────

  const toggleAdStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle ad')
      // Optimistic update
      setAds(prev => prev.map(a => a.id === id ? { ...a, isActive } : a))
    } catch (err) {
      console.error('Error toggling ad:', err)
    }
  }, [])

  // ─── Compute stats ────────────────────────────────────────────────────

  const stats: AdsStats = {
    totalAds: ads.length,
    activeAds: ads.filter(a => a.isActive).length,
    pausedAds: ads.filter(a => !a.isActive).length,
    totalImpressions: ads.reduce((s, a) => s + a.impressions, 0),
    totalClicks: ads.reduce((s, a) => s + a.clicks, 0),
    totalRevenue: ads.reduce((s, a) => s + a.revenue, 0),
    avgCTR: ads.length > 0
      ? (ads.reduce((s, a) => s + (a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0), 0) / ads.length)
      : 0,
  }

  // ─── Initial fetch ────────────────────────────────────────────────────

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  // ─── Supabase realtime subscription ───────────────────────────────────

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return

    const channel = supabase
      .channel('admin-ads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Ad' },
        () => {
          // Refetch on any ad table change
          fetchAds()
        }
      )
      .subscribe()

    return () => {
      supabase?.removeChannel(channel)
    }
  }, [fetchAds])

  // ─── SSE realtime listener ────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.type?.startsWith('ad:')) {
        fetchAds()
      }
    }
    window.addEventListener('realtime-sync', handler)
    return () => window.removeEventListener('realtime-sync', handler)
  }, [fetchAds])

  return { ads, loading, error, stats, pagination, fetchAds, deleteAd, toggleAdStatus }
}
