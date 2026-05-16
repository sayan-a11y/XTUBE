'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown, Play, Image as ImageIcon } from 'lucide-react';

// --- Data ---

const topAds = [
  { name: 'Nike 4K Video Ad', revenue: '$4,250.75', color: '#3B82F6', icon: 'video' },
  { name: 'Samsung Galaxy Ad', revenue: '$3,845.20', color: '#8B5CF6', icon: 'video' },
  { name: 'Coca-Cola Banner', revenue: '$2,125.60', color: '#10B981', icon: 'image' },
];

const deviceData = [
  { name: 'Mobile', value: 52.5, fill: '#3B82F6', impressions: '1.28M' },
  { name: 'Desktop', value: 28.7, fill: '#10B981', impressions: '701K' },
  { name: 'Tablet', value: 18.8, fill: '#F59E0B', impressions: '461K' },
];

const countryData = [
  { name: 'United States', flag: '🇺🇸', percent: 45.6, color: '#3B82F6' },
  { name: 'India', flag: '🇮🇳', percent: 24.3, color: '#10B981' },
  { name: 'United Kingdom', flag: '🇬🇧', percent: 10.2, color: '#F59E0B' },
  { name: 'Canada', flag: '🇨🇦', percent: 6.1, color: '#EC4899' },
  { name: 'Australia', flag: '🇦🇺', percent: 3.8, color: '#8B5CF6' },
];

// --- Animation Variants ---

const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// --- Component ---

export default function BottomPanels() {
  const [autoAds, setAutoAds] = useState(true);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Panel 1: Top Performing Ads */}
      <motion.div
        className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Top Performing Ads</h3>
          <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
            By Revenue
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {topAds.map((ad, idx) => (
            <motion.div
              key={idx}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + idx * 0.1 }}
            >
              {/* Thumbnail */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${ad.color}20` }}
              >
                {ad.icon === 'video' ? (
                  <Play className="w-3.5 h-3.5" style={{ color: ad.color }} />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" style={{ color: ad.color }} />
                )}
              </div>

              {/* Name */}
              <span className="text-xs text-white truncate">{ad.name}</span>

              {/* Revenue */}
              <span className="text-xs text-[#E50914] font-semibold ml-auto flex-shrink-0">
                {ad.revenue}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Panel 2: Device Performance */}
      <motion.div
        className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">Device Performance</h3>
        </div>

        {/* Donut Chart */}
        <div className="relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
                stroke="none"
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-white">2.44M</span>
            <span className="text-[10px] text-gray-400">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 space-y-2">
          {deviceData.map((device, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: device.fill }}
                />
                <span className="text-xs text-gray-400">{device.name}</span>
                <span className="text-xs text-white">{device.impressions}</span>
              </div>
              <span className="text-xs text-gray-300">{device.value}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Panel 3: Top Countries */}
      <motion.div
        className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">Top Countries</h3>
        </div>

        <div className="space-y-3">
          {countryData.map((country, idx) => (
            <div key={idx}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">
                  {country.flag} {country.name}
                </span>
                <span className="text-xs text-gray-300">{country.percent}%</span>
              </div>
              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: country.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${country.percent}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + idx * 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Panel 4: Ads Settings */}
      <motion.div
        className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">Ads Settings</h3>
        </div>

        <div className="space-y-3">
          {/* Auto Ads Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Auto Ads</span>
            <button
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                autoAds ? 'bg-[#E50914]' : 'bg-[#333]'
              }`}
              onClick={() => setAutoAds(!autoAds)}
              aria-label="Toggle auto ads"
              role="switch"
              aria-checked={autoAds}
            >
              <motion.span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                animate={{ left: autoAds ? 18 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Skip Ads After */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Skip Ads After</span>
            <span className="text-xs text-white bg-[#1a1a1a] px-2 py-1 rounded">5 Seconds</span>
          </div>

          {/* Max Ads Per Video */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Max Ads Per Video</span>
            <span className="text-xs text-white bg-[#1a1a1a] px-2 py-1 rounded">Unlimited</span>
          </div>

          {/* Minimum Gap Between Ads */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Minimum Gap Between Ads</span>
            <span className="text-xs text-white bg-[#1a1a1a] px-2 py-1 rounded">10 Minutes</span>
          </div>

          {/* Ad Quality */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Ad Quality</span>
            <span className="text-xs text-white bg-[#1a1a1a] px-2 py-1 rounded">4K Auto</span>
          </div>

          {/* Ad Playback */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Ad Playback</span>
            <span className="text-xs text-white bg-[#1a1a1a] px-2 py-1 rounded">Smart No Lag</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
