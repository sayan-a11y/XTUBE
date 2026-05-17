import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const SAMPLE_THUMBNAILS = [
  'https://picsum.photos/seed/vid1/640/360',
  'https://picsum.photos/seed/vid2/640/360',
  'https://picsum.photos/seed/vid3/640/360',
  'https://picsum.photos/seed/vid4/640/360',
  'https://picsum.photos/seed/vid5/640/360',
  'https://picsum.photos/seed/vid6/640/360',
  'https://picsum.photos/seed/vid7/640/360',
  'https://picsum.photos/seed/vid8/640/360',
  'https://picsum.photos/seed/vid9/640/360',
  'https://picsum.photos/seed/vid10/640/360',
  'https://picsum.photos/seed/vid11/640/360',
  'https://picsum.photos/seed/vid12/640/360',
  'https://picsum.photos/seed/vid13/640/360',
  'https://picsum.photos/seed/vid14/640/360',
  'https://picsum.photos/seed/vid15/640/360',
  'https://picsum.photos/seed/vid16/640/360',
  'https://picsum.photos/seed/vid17/640/360',
  'https://picsum.photos/seed/vid18/640/360',
  'https://picsum.photos/seed/vid19/640/360',
  'https://picsum.photos/seed/vid20/640/360',
  'https://picsum.photos/seed/vid21/640/360',
  'https://picsum.photos/seed/vid22/640/360',
  'https://picsum.photos/seed/vid23/640/360',
  'https://picsum.photos/seed/vid24/640/360',
]

const SAMPLE_VIDEOS = [
  { title: 'Epic Mountain Adventure', category: 'Sports', duration: '12:34', isHd: true },
  { title: 'Deep Ocean Exploration', category: 'Movies', duration: '45:21', isHd: true },
  { title: 'Gaming Highlights 2024', category: 'Gaming', duration: '18:45', isHd: true },
  { title: 'Music Festival Live', category: 'Music', duration: '1:23:45', isHd: true },
  { title: 'Breaking News Update', category: 'News & Politics', duration: '5:30', isHd: false },
  { title: 'Short Comedy Skit', category: 'Shorts', duration: '0:45', isHd: false },
  { title: 'Top Rated Documentary', category: 'Movies', duration: '1:45:12', isHd: true },
  { title: 'Cooking Masterclass', category: 'Popular', duration: '22:10', isHd: true },
  { title: 'Tech Review: Latest Gadgets', category: 'Popular', duration: '15:33', isHd: true },
  { title: 'Workout Routine Pro', category: 'Sports', duration: '30:00', isHd: true },
  { title: 'Indie Game Showcase', category: 'Gaming', duration: '25:18', isHd: true },
  { title: 'Classical Music Concert', category: 'Music', duration: '52:30', isHd: true },
  { title: 'Political Debate Highlights', category: 'News & Politics', duration: '35:22', isHd: false },
  { title: 'Fast Comedy Reel', category: 'Shorts', duration: '0:30', isHd: false },
  { title: 'Travel Vlog: Japan', category: 'Popular', duration: '20:15', isHd: true },
  { title: 'E-Sports Championship Finals', category: 'Gaming', duration: '2:15:00', isHd: true },
  { title: 'Rock Concert Live', category: 'Music', duration: '1:10:45', isHd: true },
  { title: 'Marathon Training Tips', category: 'Sports', duration: '16:40', isHd: true },
  { title: 'Award Winning Short Film', category: 'Movies', duration: '28:15', isHd: true },
  { title: 'Daily News Roundup', category: 'News & Politics', duration: '8:20', isHd: false },
  { title: 'Minecraft Speedrun World Record', category: 'Gaming', duration: '42:10', isHd: true },
  { title: 'Jazz Evening Session', category: 'Music', duration: '38:55', isHd: true },
  { title: 'Extreme Sports Compilation', category: 'Sports', duration: '14:22', isHd: true },
  { title: 'Viral Dance Challenge', category: 'Shorts', duration: '0:55', isHd: false },
]

const CATEGORIES = [
  { name: 'Popular', slug: 'popular', icon: 'Flame', order: 0 },
  { name: 'New Videos', slug: 'new-videos', icon: 'Sparkles', order: 1 },
  { name: 'Top Rated', slug: 'top-rated', icon: 'Star', order: 2 },
  { name: 'Longest', slug: 'longest', icon: 'Clock', order: 3 },
  { name: 'Shorts', slug: 'shorts', icon: 'Zap', order: 4 },
  { name: 'Music', slug: 'music', icon: 'Music', order: 5 },
  { name: 'Gaming', slug: 'gaming', icon: 'Gamepad2', order: 6 },
  { name: 'Movies', slug: 'movies', icon: 'Film', order: 7 },
  { name: 'Sports', slug: 'sports', icon: 'Trophy', order: 8 },
  { name: 'News & Politics', slug: 'news-politics', icon: 'Newspaper', order: 9 },
]

export async function POST() {
  try {
    // Seed categories
    for (const cat of CATEGORIES) {
      await db.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    }

    // Seed default user
    await db.user.upsert({
      where: { id: 'default-user' },
      update: {},
      create: {
        id: 'default-user',
        username: 'Guest',
        email: 'guest@xtube.com',
      },
    })

    // Seed admin user
    await db.user.upsert({
      where: { id: 'admin-user' },
      update: {},
      create: {
        id: 'admin-user',
        username: 'Admin',
        email: 'admin@xtube.com',
        role: 'admin',
      },
    })

    // Check if videos already exist
    const existingVideos = await db.video.count()
    if (existingVideos === 0) {
      // Seed videos
      for (let i = 0; i < SAMPLE_VIDEOS.length; i++) {
        const v = SAMPLE_VIDEOS[i]
        await db.video.create({
          data: {
            title: v.title,
            description: `Watch ${v.title} on Xtube. High quality streaming with adaptive bitrate support.`,
            thumbnail: SAMPLE_THUMBNAILS[i % SAMPLE_THUMBNAILS.length],
            videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // Free HLS test stream
            category: v.category,
            duration: v.duration,
            isHd: v.isHd,
            views: Math.floor(Math.random() * 500000) + 1000,
          },
        })
      }
    }

    // Seed ads
    const existingAds = await db.ad.count()
    if (existingAds === 0) {
      await db.ad.createMany({
        data: [
          {
            type: 'banner',
            position: 'hero',
            title: 'Premium Streaming - Watch in 4K',
            imageUrl: 'https://picsum.photos/seed/ad1/1280/400',
            linkUrl: '#',
            impressions: 15420,
            clicks: 890,
            revenue: 267.50,
          },
          {
            type: 'banner',
            position: 'sidebar',
            title: 'Upgrade to Xtube Pro',
            imageUrl: 'https://picsum.photos/seed/ad2/300/250',
            linkUrl: '#',
            impressions: 8200,
            clicks: 420,
            revenue: 125.00,
          },
          {
            type: 'popup',
            position: 'entry',
            title: 'Special Offer - First Month Free',
            imageUrl: 'https://picsum.photos/seed/ad3/600/400',
            linkUrl: '#',
            impressions: 3200,
            clicks: 180,
            revenue: 54.00,
          },
          {
            type: 'overlay',
            position: 'footer',
            title: 'Download Our App',
            imageUrl: 'https://picsum.photos/seed/ad4/468/60',
            linkUrl: '#',
            impressions: 22100,
            clicks: 1100,
            revenue: 330.00,
          },
        ],
      })
    }

    // Seed analytics
    const existingAnalytics = await db.analytics.count()
    if (existingAnalytics === 0) {
      const analyticsData: any[] = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const devices = ['desktop', 'mobile', 'tablet']
        for (const device of devices) {
          analyticsData.push({
            date,
            device,
            country: 'US',
            views: Math.floor(Math.random() * 5000) + 500,
            watchTime: Math.floor(Math.random() * 50000) + 5000,
            revenue: Math.round((Math.random() * 50 + 10) * 100) / 100,
            adClicks: Math.floor(Math.random() * 200) + 20,
            newUsers: Math.floor(Math.random() * 100) + 5,
          })
        }
      }
      await db.analytics.createMany({ data: analyticsData })
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully' })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
