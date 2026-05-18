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

  // ─── Fetch combined ads from APIs in parallel ──────────────────────────

  const fetchAds = useCallback(async () => {
    try {
      const f = filtersRef.current

      // Determine endpoints to query to eliminate query bloat
      let fetchStandard = true
      let fetchHero = false
      let fetchFooter = false

      if (!f?.position) {
        // Aggregate All Ads dashboard view: fetch everything
        fetchStandard = true
        fetchHero = true
        fetchFooter = true
      } else if (f.position === 'hero') {
        fetchStandard = false
        fetchHero = true
      } else if (f.position === 'footer') {
        fetchStandard = false
        fetchFooter = true
      }

      const promises: Promise<any>[] = []

      // 1. Fetch standard Ads table
      if (fetchStandard) {
        const params = new URLSearchParams({ admin: 'true', limit: '200' })
        if (f?.type) params.set('type', f.type)
        if (f?.position && f.position !== 'hero' && f.position !== 'footer') {
          params.set('position', f.position)
        }
        if (f?.status) params.set('status', f.status)
        if (f?.search) params.set('search', f.search)
        promises.push(
          fetch(`/api/ads?${params.toString()}`)
            .then(res => res.ok ? res.json() : { ads: [] })
            .catch(() => ({ ads: [] }))
        )
      } else {
        promises.push(Promise.resolve({ ads: [] }))
      }

      // 2. Fetch HeroAds table
      if (fetchHero) {
        promises.push(
          fetch('/api/hero-ads')
            .then(res => res.ok ? res.json() : { heroAds: [] })
            .catch(() => ({ heroAds: [] }))
        )
      } else {
        promises.push(Promise.resolve({ heroAds: [] }))
      }

      // 3. Fetch FooterAds table
      if (fetchFooter) {
        promises.push(
          fetch('/api/footer-ads')
            .then(res => res.ok ? res.json() : { footerAds: [] })
            .catch(() => ({ footerAds: [] }))
        )
      } else {
        promises.push(Promise.resolve({ footerAds: [] }))
      }

      const [adsResult, heroResult, footerResult] = await Promise.all(promises)

      // Map standard ads
      const standardRecords: AdRecord[] = adsResult.ads || []

      // Map Hero ads to standard AdRecord layout
      const heroRecords: AdRecord[] = (heroResult.heroAds || []).map((hero: any) => ({
        id: hero.id,
        type: 'banner',
        position: 'hero',
        title: hero.title,
        imageUrl: hero.thumbnailUrl || hero.mediaUrl,
        linkUrl: null,
        impressions: hero.impressions || 0,
        clicks: hero.clicks || 0,
        revenue: 0,
        isActive: hero.isActive,
        startDate: hero.startDate || null,
        endDate: hero.endDate || null,
        frequency: 1,
        mediaUrl: hero.mediaUrl,
        mediaFormat: hero.mediaFormat || 'jpg',
        adDuration: 0,
        skipAfter: 5,
        quality: '720p',
        createdAt: hero.createdAt,
        updatedAt: hero.updatedAt,
      }))

      // Map Footer ads to standard AdRecord layout
      const footerRecords: AdRecord[] = (footerResult.footerAds || []).map((footer: any) => ({
        id: footer.id,
        type: 'banner',
        position: 'footer',
        title: footer.title,
        imageUrl: footer.thumbnailUrl || footer.mediaUrl,
        linkUrl: footer.linkUrl || null,
        impressions: footer.impressions || 0,
        clicks: footer.clicks || 0,
        revenue: 0,
        isActive: footer.isActive,
        startDate: footer.startDate || null,
        endDate: footer.endDate || null,
        frequency: 1,
        mediaUrl: footer.mediaUrl,
        mediaFormat: footer.mediaFormat || 'jpg',
        adDuration: 0,
        skipAfter: 5,
        quality: '720p',
        createdAt: footer.createdAt,
        updatedAt: footer.updatedAt,
      }))

      // Combine and order by newest
      const combined = [...standardRecords, ...heroRecords, ...footerRecords]
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setAds(combined)
      if (adsResult.pagination) {
        setPagination({
          ...adsResult.pagination,
          total: combined.length,
          totalPages: Math.ceil(combined.length / adsResult.pagination.limit)
        })
      } else {
        setPagination({ page: 1, limit: 200, total: combined.length, totalPages: 1 })
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching aggregated ads:', err)
      setError('Failed to load ads')
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Delete ad from correct table ──────────────────────────────────────

  const deleteAd = useCallback(async (id: string) => {
    try {
      // Look up target ad in memory to check its model table source
      const targetAd = ads.find(a => a.id === id)
      let url = `/api/ads?id=${id}`
      let method = 'DELETE'
      let body: any = null

      if (targetAd?.position === 'hero') {
        url = '/api/hero-ads'
        body = { id }
      } else if (targetAd?.position === 'footer') {
        url = '/api/footer-ads'
        body = { id }
      }

      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      })
      if (!res.ok) throw new Error('Failed to delete ad')

      // Optimistic state update
      setAds(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Error deleting ad:', err)
    }
  }, [ads])

  // ─── Toggle ad status on correct table ─────────────────────────────────

  const toggleAdStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      const targetAd = ads.find(a => a.id === id)
      let url = '/api/ads'

      if (targetAd?.position === 'hero') {
        url = '/api/hero-ads'
      } else if (targetAd?.position === 'footer') {
        url = '/api/footer-ads'
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle ad')

      // Optimistic state update
      setAds(prev => prev.map(a => a.id === id ? { ...a, isActive } : a))
    } catch (err) {
      console.error('Error toggling ad status:', err)
    }
  }, [ads])

  // ─── Compute stats reactively ──────────────────────────────────────────

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

  // ─── Supabase realtime channels for all three tables ───────────────────

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return

    const channel = supabase
      .channel('admin-ads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Ad' },
        () => {
          fetchAds()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'HeroAd' },
        () => {
          fetchAds()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'FooterAd' },
        () => {
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
      if (
        detail?.type?.startsWith('ad:') ||
        detail?.type?.startsWith('hero_ad:') ||
        detail?.type?.startsWith('footer_ad:')
      ) {
        fetchAds()
      }
    }
    window.addEventListener('realtime-sync', handler)
    return () => window.removeEventListener('realtime-sync', handler)
  }, [fetchAds])

  return { ads, loading, error, stats, pagination, fetchAds, deleteAd, toggleAdStatus }
}
