import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get overall stats
    let totalVideos = 0
    let totalViews: any = { _sum: { views: 0 } }
    let totalComments = 0
    let totalAds = 0
    let totalUsers = 0
    let adStats: any = { _sum: { clicks: 0, impressions: 0 } }
    let recentAnalytics: any[] = []

    try { totalVideos = await db.video.count() } catch (e) { console.warn('video count failed', e) }
    try { totalViews = await db.video.aggregate({ _sum: { views: true } }) } catch (e) { console.warn('video aggregate failed', e) }
    try { totalComments = await db.comment.count() } catch (e) { console.warn('comment count failed', e) }
    try { totalAds = await db.ad.count() } catch (e) { console.warn('ad count failed', e) }
    try { totalUsers = await db.user.count() } catch (e) { console.warn('user count failed', e) }
    try { adStats = await db.ad.aggregate({ _sum: { clicks: true, impressions: true } }) } catch (e) { console.warn('ad aggregate failed', e) }
    try { 
      recentAnalytics = await db.analytics.findMany({
        orderBy: { date: 'desc' },
        take: 30,
      }) 
    } catch (e) { console.warn('analytics findMany failed', e) }

    // Calculate views over time
    const viewsByDate = recentAnalytics.reduce((acc: Record<string, number>, a) => {
      const date = new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      acc[date] = (acc[date] || 0) + a.views
      return acc
    }, {})

    const viewsGraph = Object.entries(viewsByDate).map(([date, views]) => ({ date, views }))

    // Calculate revenue
    const totalRevenue = recentAnalytics.reduce((sum, a) => sum + a.revenue, 0)
    const revenueByDate = recentAnalytics.reduce((acc: Record<string, number>, a) => {
      const date = new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      acc[date] = (acc[date] || 0) + a.revenue
      return acc
    }, {})

    const revenueGraph = Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue }))

    // Device breakdown
    const deviceBreakdown = recentAnalytics.reduce((acc: Record<string, number>, a) => {
      acc[a.device] = (acc[a.device] || 0) + a.views
      return acc
    }, {})

    // Category breakdown
    let categoryStats: any[] = []
    try {
      categoryStats = await db.video.groupBy({
        by: ['category'],
        _count: { _all: true },
        _sum: { views: true },
      })
    } catch (e) { console.warn('video groupBy failed', e) }

    return new NextResponse(JSON.stringify({
      totalVideos,
      totalViews: totalViews._sum.views || 0,
      totalClicks: adStats._sum.clicks || 0,
      totalComments,
      totalAds,
      totalUsers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      viewsGraph,
      revenueGraph,
      deviceBreakdown,
      categoryStats: categoryStats.map((c) => ({
        category: c.category,
        count: c._count?._all || 0,
        views: c._sum?.views || 0,
      })),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
