'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Video,
  Grid3X3,
  Radio,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Crown,
  Image,
  MessageSquare,
  FileText,
  Layers,
  Settings,
  Globe,
  Puzzle,
  ScrollText,
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  icon: React.ElementType
  label: string
  id: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
      { icon: Video, label: 'Videos', id: 'videos' },
      { icon: Grid3X3, label: 'Categories', id: 'categories' },
      { icon: Radio, label: 'Live TV', id: 'live-tv' },
      { icon: Users, label: 'Users', id: 'users' },
      { icon: CreditCard, label: 'Subscriptions', id: 'subscriptions' },
      { icon: Receipt, label: 'Transactions', id: 'transactions' },
      { icon: BarChart3, label: 'Reports', id: 'reports' },
    ],
  },
  {
    label: 'ADS MANAGEMENT',
    items: [
      { icon: Crown, label: 'Premium Ads', id: 'premium-ads' },
      { icon: Image, label: 'Banner Ads', id: 'banner-ads' },
      { icon: MessageSquare, label: 'Popup Ads', id: 'popup-ads' },
      { icon: FileText, label: 'Native Ads', id: 'native-ads' },
      { icon: Layers, label: 'Hero/Footer Ads', id: 'hero-footer-ads' },
      { icon: PlayCircle, label: 'Video Ads Analytics', id: 'video-ads-analytics' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { icon: Settings, label: 'Settings', id: 'settings' },
      { icon: Globe, label: 'Website Settings', id: 'website-settings' },
      { icon: Puzzle, label: 'Add-ons', id: 'add-ons' },
      { icon: ScrollText, label: 'System Logs', id: 'system-logs' },
    ],
  },
]

// Active nav items with special styling
const activeMainItem = 'dashboard'
const activeAdsItem = 'video-ads-analytics'

function TooltipWrapper({
  children,
  label,
  show,
}: {
  children: React.ReactNode
  label: string
  show: boolean
}) {
  const [hovered, setHovered] = useState(false)

  if (!show) return <>{children}</>

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#1a1a1a] px-2.5 py-1.5 text-xs font-medium text-white shadow-lg border border-[#2a2a2a]"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavItemButton({
  item,
  isActive,
  isCollapsed,
  isRedGlow = false,
}: {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  isRedGlow?: boolean
}) {
  const Icon = item.icon

  return (
    <TooltipWrapper label={item.label} show={isCollapsed}>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
          isActive
            ? isRedGlow
              ? 'bg-[#E50914]/10 text-[#E50914]'
              : 'bg-[#E50914]/10 text-[#E50914]'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        {/* Active left border indicator */}
        {isActive && (
          <motion.div
            layoutId="ads-sidebar-active-indicator"
            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#E50914]"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}

        {/* Red glow background for video-ads-analytics */}
        {isActive && isRedGlow && (
          <div className="absolute inset-0 rounded-lg bg-[#E50914]/5 shadow-[0_0_15px_rgba(229,9,20,0.15)]" />
        )}

        {/* Hover effect */}
        <div className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-white/[0.03]" />

        <Icon
          className={`relative z-10 h-5 w-5 flex-shrink-0 ${
            isActive ? 'text-[#E50914]' : 'text-gray-400 group-hover:text-white'
          }`}
        />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 whitespace-nowrap font-medium"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </TooltipWrapper>
  )
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const getIsActive = useCallback(
    (item: NavItem) => {
      return item.id === activeMainItem || item.id === activeAdsItem
    },
    []
  )

  const isRedGlow = useCallback((item: NavItem) => {
    return item.id === 'video-ads-analytics'
  }, [])

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[#1f1f1f] bg-[#0a0a0a] lg:flex"
    >
      {/* Top Section: Logo & Toggle */}
      <div className="flex h-16 items-center justify-between border-b border-[#1f1f1f] px-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <PlayCircle className="h-7 w-7 flex-shrink-0 text-[#E50914]" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="whitespace-nowrap text-sm font-bold text-white leading-tight">
                  Video Ads
                </span>
                <span className="whitespace-nowrap text-[11px] text-[#9ca3af] leading-tight">
                  Analytics
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <TooltipWrapper label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} show={collapsed}>
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </motion.button>
        </TooltipWrapper>
      </div>

      {/* Navigation Sections */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {/* Section Label */}
              <AnimatePresence>
                {!collapsed ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mb-2 px-3"
                  >
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                      {section.label}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0 }}
                    className="mb-2 flex justify-center"
                  >
                    <div className="h-px w-6 bg-[#1f1f1f]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItemButton
                    key={item.id}
                    item={item}
                    isActive={getIsActive(item)}
                    isCollapsed={collapsed}
                    isRedGlow={isRedGlow(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* System Status Card */}
      <div className="border-t border-[#1f1f1f] p-3">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="expanded-status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-[#1f1f1f] bg-[#111111] p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">System Status</span>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <span className="text-[11px] text-green-500">All Systems Operational</span>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex justify-center py-1"
            >
              <TooltipWrapper label="All Systems Operational" show={collapsed}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#1f1f1f] bg-[#111111]">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </TooltipWrapper>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
