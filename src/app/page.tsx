import { db } from '@/lib/db'
import { XtubeHomeClient } from '@/components/streaming/XtubeHomeClient'

// Force dynamic rendering so server fetches latest content on every reload
export const dynamic = 'force-dynamic'

export default async function Page() {
  const now = new Date()

  // Fetch all initial resources in parallel to eliminate sequential query blocking
  const [
    videosRaw,
    categoriesRaw,
    adsRaw,
    heroAdsRaw,
    footerAdsRaw
  ] = await Promise.all([
    db.video.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.category.findMany({
      orderBy: { order: 'asc' },
    }),
    db.ad.findMany({
      where: {
        isActive: true,
        position: 'hero',
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.heroAd.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    }),
    db.footerAd.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })
  ])

  // Serialize dates to ISO strings for Client Component boundary safety
  const videos = videosRaw.map(v => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }))

  const categories = categoriesRaw.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    order: c.order,
  }))

  // Increment impressions asynchronously in background
  Promise.all(
    adsRaw.map((ad) =>
      db.ad.update({
        where: { id: ad.id },
        data: { impressions: { increment: 1 } },
      }).catch((err) => console.error('Background ad impression increment failed:', err))
    )
  )

  const ads = adsRaw.map(ad => ({
    ...ad,
    startDate: ad.startDate?.toISOString() || null,
    endDate: ad.endDate?.toISOString() || null,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  }))

  // Increment impressions for hero ads asynchronously in background
  Promise.all(
    heroAdsRaw.map((ad) =>
      db.heroAd.update({
        where: { id: ad.id },
        data: { impressions: { increment: 1 } },
      }).catch((err) => console.error('Background hero ad impression increment failed:', err))
    )
  )

  const heroAds = heroAdsRaw.map(ad => ({
    ...ad,
    startDate: ad.startDate?.toISOString() || null,
    endDate: ad.endDate?.toISOString() || null,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  }))

  // Increment impressions for footer ads asynchronously in background
  Promise.all(
    footerAdsRaw.map((ad) =>
      db.footerAd.update({
        where: { id: ad.id },
        data: { impressions: { increment: 1 } },
      }).catch((err) => console.error('Background footer ad impression increment failed:', err))
    )
  )

  const footerAds = footerAdsRaw.map(ad => ({
    ...ad,
    startDate: ad.startDate?.toISOString() || null,
    endDate: ad.endDate?.toISOString() || null,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  }))

  return (
    <XtubeHomeClient
      initialVideos={videos}
      initialCategories={categories}
      initialAds={ads}
      initialHeroAds={heroAds}
      initialFooterAds={footerAds}
    />
  )
}
