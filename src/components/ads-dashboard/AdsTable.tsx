'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Play, Image as ImageIcon, Pencil, BarChart3, Trash2 } from 'lucide-react'

type AdType = 'Video' | 'Image'
type AdStatus = 'Active' | 'Paused' | 'Draft'

interface AdData {
  id: number
  name: string
  type: AdType
  placement: string
  duration: string
  status: AdStatus
  previewBg: string
  previewIcon: 'play' | 'image'
}

const adsData: AdData[] = [
  {
    id: 1,
    name: 'Nike 4K Video Ad',
    type: 'Video',
    placement: 'Pre-roll',
    duration: '00:30',
    status: 'Active',
    previewBg: 'bg-[#3B82F6]/20',
    previewIcon: 'play',
  },
  {
    id: 2,
    name: 'Coca-Cola Banner',
    type: 'Image',
    placement: 'Banner',
    duration: '-',
    status: 'Active',
    previewBg: 'bg-[#10B981]/20',
    previewIcon: 'image',
  },
  {
    id: 3,
    name: 'Samsung Galaxy Ad',
    type: 'Video',
    placement: 'Mid-roll',
    duration: '00:45',
    status: 'Paused',
    previewBg: 'bg-[#8B5CF6]/20',
    previewIcon: 'play',
  },
  {
    id: 4,
    name: 'Amazon Big Sale',
    type: 'Image',
    placement: 'Overlay',
    duration: '-',
    status: 'Active',
    previewBg: 'bg-[#F59E0B]/20',
    previewIcon: 'image',
  },
  {
    id: 5,
    name: 'Car Brand Video Ad',
    type: 'Video',
    placement: 'Post-roll',
    duration: '00:15',
    status: 'Draft',
    previewBg: 'bg-[#EC4899]/20',
    previewIcon: 'play',
  },
]

type TabFilter = 'All' | 'Video Ads' | 'Image Ads'

const statusStyles: Record<AdStatus, string> = {
  Active: 'bg-green-500/15 text-green-400',
  Paused: 'bg-amber-500/15 text-amber-400',
  Draft: 'bg-gray-500/15 text-gray-400',
}

const typeStyles: Record<AdType, string> = {
  Video: 'bg-blue-500/15 text-blue-400',
  Image: 'bg-green-500/15 text-green-400',
}

export default function AdsTable() {
  const [activeTab, setActiveTab] = useState<TabFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAds = adsData.filter((ad) => {
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Video Ads' && ad.type === 'Video') ||
      (activeTab === 'Image Ads' && ad.type === 'Image')

    const matchesSearch = ad.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  const tabs: TabFilter[] = ['All', 'Video Ads', 'Image Ads']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">All Ads List</h2>
        <div className="flex items-center gap-2">
          {/* Tab Filters */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-[#E50914] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search ads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914]/50 w-40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#0a0a0a]">
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Ad Preview
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Ad Name
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Placement
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAds.map((ad) => (
              <motion.tr
                key={ad.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border-b border-[#1f1f1f] hover:bg-white/[0.02] transition-colors"
              >
                {/* Ad Preview */}
                <td className="px-4 py-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${ad.previewBg} flex items-center justify-center`}
                  >
                    {ad.previewIcon === 'play' ? (
                      <Play className="w-4 h-4 text-white/70" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-white/70" />
                    )}
                  </div>
                </td>

                {/* Ad Name */}
                <td className="px-4 py-3 text-sm text-white font-medium">
                  {ad.name}
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${typeStyles[ad.type]}`}
                  >
                    {ad.type}
                  </span>
                </td>

                {/* Placement */}
                <td className="px-4 py-3 text-sm text-gray-400">
                  {ad.placement}
                </td>

                {/* Duration */}
                <td className="px-4 py-3 text-sm text-gray-400">
                  {ad.duration}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${statusStyles[ad.status]}`}
                  >
                    {ad.status === 'Active' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    )}
                    {ad.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-white transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}

            {filteredAds.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No ads found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Showing 1-{filteredAds.length} of 128 ads
        </span>
        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            disabled
            className="w-8 h-8 rounded-lg text-xs flex items-center justify-center bg-[#1a1a1a] text-gray-600 cursor-not-allowed"
          >
            &lt;
          </button>

          {/* Page 1 - Active */}
          <button className="w-8 h-8 rounded-lg text-xs flex items-center justify-center bg-[#E50914] text-white">
            1
          </button>

          {/* Page 2 */}
          <button className="w-8 h-8 rounded-lg text-xs flex items-center justify-center bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
            2
          </button>

          {/* Page 3 */}
          <button className="w-8 h-8 rounded-lg text-xs flex items-center justify-center bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
            3
          </button>

          {/* Ellipsis */}
          <span className="w-8 h-8 flex items-center justify-center text-xs text-gray-500">
            ...
          </span>

          {/* Page 10 */}
          <button className="w-8 h-8 rounded-lg text-xs flex items-center justify-center bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
            10
          </button>

          {/* Next */}
          <button className="w-8 h-8 rounded-lg text-xs flex items-center justify-center bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
            &gt;
          </button>
        </div>
      </div>
    </motion.div>
  )
}
