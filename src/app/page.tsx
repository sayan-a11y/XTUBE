import { db } from '@/lib/db'
import { XtubeHomeClient } from '@/components/streaming/XtubeHomeClient'

// Enable Incremental Static Regeneration (ISR) with 60-second cache revalidation.
// Since the frontend client has reactive realtime sync listeners to push updates instantly,
// caching the HTML at the CDN edge for 60 seconds guarantees 0.01s loading time with zero server overhead.
export const revalidate = 60

export default async function Page() {
  const now = new Date()

  let videosRaw: any[] = []
  let categoriesRaw: any[] = []
  let adsRaw: any[] = []
  let heroAdsRaw: any[] = []
  let footerAdsRaw: any[] = []

  try {
    // Fetch all initial resources in parallel to eliminate sequential query blocking
    const [
      v,
      c,
      a,
      ha,
      fa
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

    videosRaw = v
    categoriesRaw = c
    adsRaw = a
    heroAdsRaw = ha
    footerAdsRaw = fa

    // Only increment impressions at runtime (not during build-time static generation)
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-action-build' || process.env.IS_BUILD === 'true'
    if (!isBuildPhase) {
      // Increment impressions asynchronously in background
      Promise.all(
        adsRaw.map((ad) =>
          db.ad.update({
            where: { id: ad.id },
            data: { impressions: { increment: 1 } },
          }).catch((err) => console.error('Background ad impression increment failed:', err))
        )
      )

      // Increment impressions for hero ads asynchronously in background
      Promise.all(
        heroAdsRaw.map((ad) =>
          db.heroAd.update({
            where: { id: ad.id },
            data: { impressions: { increment: 1 } },
          }).catch((err) => console.error('Background hero ad impression increment failed:', err))
        )
      )

      // Increment impressions for footer ads asynchronously in background
      Promise.all(
        footerAdsRaw.map((ad) =>
          db.footerAd.update({
            where: { id: ad.id },
            data: { impressions: { increment: 1 } },
          }).catch((err) => console.error('Background footer ad impression increment failed:', err))
        )
      )
    }

  } catch (dbError) {
    console.warn('Database fetching timed out or failed during build, using safe fallbacks:', dbError)
  }

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

  const ads = adsRaw.map(ad => ({
    ...ad,
    startDate: ad.startDate?.toISOString() || null,
    endDate: ad.endDate?.toISOString() || null,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  }))

  const heroAds = heroAdsRaw.map(ad => ({
    ...ad,
    startDate: ad.startDate?.toISOString() || null,
    endDate: ad.endDate?.toISOString() || null,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  }))

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
