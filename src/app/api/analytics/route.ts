import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get overall stats in parallel for max performance
    const [
      videosCountRes,
      viewsAggRes,
      commentsCountRes,
      adsCountRes,
      usersCountRes,
      adStatsRes,
      recentAnalyticsRes,
      categoryStatsRes
    ] = await Promise.allSettled([
      db.video.count(),
      db.video.aggregate({ _sum: { views: true } }),
      db.comment.count(),
      db.ad.count(),
      db.user.count(),
      db.ad.aggregate({ _sum: { clicks: true, impressions: true } }),
      db.analytics.findMany({ orderBy: { date: 'desc' }, take: 30 }),
      db.video.groupBy({ by: ['category'], _count: { _all: true }, _sum: { views: true } })
    ])

    const totalVideos = videosCountRes.status === 'fulfilled' ? videosCountRes.value : 0
    const totalViews = viewsAggRes.status === 'fulfilled' ? viewsAggRes.value : { _sum: { views: 0 } }
    const totalComments = commentsCountRes.status === 'fulfilled' ? commentsCountRes.value : 0
    const totalAds = adsCountRes.status === 'fulfilled' ? adsCountRes.value : 0
    const totalUsers = usersCountRes.status === 'fulfilled' ? usersCountRes.value : 0
    const adStats = adStatsRes.status === 'fulfilled' ? adStatsRes.value : { _sum: { clicks: 0, impressions: 0 } }
    const recentAnalytics = recentAnalyticsRes.status === 'fulfilled' ? recentAnalyticsRes.value : []
    const categoryStats = categoryStatsRes.status === 'fulfilled' ? categoryStatsRes.value : []

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
