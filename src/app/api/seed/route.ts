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
    // Only seed default Guest user
    await db.user.upsert({
      where: { id: 'default-user' },
      update: {},
      create: {
        id: 'default-user',
        username: 'Guest',
        email: 'guest@xtube.com',
      },
    })

    // Only seed default Admin user
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

    // Seed a sample hero ad if none exist to ensure the hero section is visible
    const heroAdCount = await db.heroAd.count()
    if (heroAdCount === 0) {
      await db.heroAd.create({
        data: {
          title: 'Premium Video Streaming',
          description: 'Experience the best video streaming platform with high quality and zero lag.',
          category: 'Premium',
          mediaUrl: 'https://picsum.photos/seed/hero/1920/1080',
          adType: 'image',
          mediaFormat: 'jpg',
          isActive: true,
          displayOrder: 0,
        },
      })
    }

    return NextResponse.json({ success: true, message: 'Database initialized with admin, guest users, and sample hero ad' })

  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 })
  }
}
