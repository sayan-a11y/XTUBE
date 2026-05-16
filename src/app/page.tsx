'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/ads-dashboard/Sidebar'
import Header from '@/components/ads-dashboard/Header'
import AnalyticsCards from '@/components/ads-dashboard/AnalyticsCards'
import ChartsSection from '@/components/ads-dashboard/ChartsSection'
import UploadSection from '@/components/ads-dashboard/UploadSection'
import AdsTable from '@/components/ads-dashboard/AdsTable'
import AdsTimeline from '@/components/ads-dashboard/AdsTimeline'
import BottomPanels from '@/components/ads-dashboard/BottomPanels'

export default function VideoAdsAnalytics() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const marginLeft = isDesktop ? (sidebarCollapsed ? 72 : 240) : 0

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 lg:hidden"
            >
              <Sidebar
                collapsed={false}
                onToggle={() => setMobileMenuOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        className="transition-all duration-300 ease-in-out min-h-screen"
        style={{ marginLeft }}
      >
        {/* Header */}
        <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Dashboard Content */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1800px] mx-auto">
          {/* Analytics Stat Cards */}
          <AnalyticsCards />

          {/* Charts Section */}
          <ChartsSection />

          {/* Upload + Ads Table + Timeline Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <UploadSection />
            <AdsTable />
            <AdsTimeline />
          </div>

          {/* Bottom Panels */}
          <BottomPanels />
        </div>
      </div>
    </div>
  )
}
