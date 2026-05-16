import { create } from 'zustand'

export type ViewMode = 'home' | 'trending' | 'category' | 'bookmarks' | 'history' | 'video' | 'admin' | 'search'

export type AdminSection =
  | 'dashboard'
  | 'all-videos'
  | 'video-upload'
  | 'catalog'
  | 'all-ads'
  | 'banner-ads'
  | 'popup-ads'
  | 'hero-footer-ads'
  | 'pre-roll-ads'
  | 'mid-roll-ads'
  | 'post-roll-ads'
  | 'overlay-ads'
  | 'analytics'
  | 'users'
  | 'settings'

interface AppState {
  // Navigation
  currentView: ViewMode
  selectedCategory: string | null
  selectedVideoId: string | null
  searchQuery: string

  // Sidebar
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean

  // Admin
  adminUnlocked: boolean
  adminClickCount: number
  adminSection: AdminSection
  adminSidebarCollapsed: boolean

  // Video Player
  theaterMode: boolean

  // Actions
  setView: (view: ViewMode) => void
  setSelectedCategory: (category: string | null) => void
  setSelectedVideoId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  toggleSidebar: () => void
  setMobileMenuOpen: (open: boolean) => void
  incrementAdminClick: () => void
  setAdminUnlocked: (unlocked: boolean) => void
  setAdminSection: (section: AdminSection) => void
  setAdminSidebarCollapsed: (collapsed: boolean) => void
  setTheaterMode: (mode: boolean) => void
  navigateToVideo: (videoId: string) => void
  goBack: () => void
}

const viewHistory: ViewMode[] = ['home']

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'home',
  selectedCategory: null,
  selectedVideoId: null,
  searchQuery: '',

  // Sidebar
  sidebarCollapsed: false,
  mobileMenuOpen: false,

  // Admin
  adminUnlocked: false,
  adminClickCount: 0,
  adminSection: 'dashboard',
  adminSidebarCollapsed: false,

  // Video Player
  theaterMode: false,

  // Actions
  setView: (view) => {
    viewHistory.push(get().currentView)
    set({ currentView: view })
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setSelectedVideoId: (id) => set({ selectedVideoId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  incrementAdminClick: () => {
    const newCount = get().adminClickCount + 1
    if (newCount >= 7) {
      set({ adminClickCount: 0, adminUnlocked: true })
    } else {
      set({ adminClickCount: newCount })
      // Reset after 2 seconds if not completed
      setTimeout(() => {
        if (get().adminClickCount < 7) {
          set({ adminClickCount: 0 })
        }
      }, 2000)
    }
  },

  setAdminUnlocked: (unlocked) => set({ adminUnlocked: unlocked }),

  setAdminSection: (section) => set({ adminSection: section }),

  setAdminSidebarCollapsed: (collapsed) => set({ adminSidebarCollapsed: collapsed }),

  setTheaterMode: (mode) => set({ theaterMode: mode }),

  navigateToVideo: (videoId) => {
    viewHistory.push(get().currentView)
    set({ selectedVideoId: videoId, currentView: 'video' })
  },

  goBack: () => {
    const lastView = viewHistory.pop() || 'home'
    set({ currentView: lastView, selectedVideoId: lastView !== 'video' ? null : get().selectedVideoId })
  },
}))
