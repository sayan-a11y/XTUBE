'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// --- Mock Data ---

function generatePerformanceData() {
  const data = [];
  const startDate = new Date(2025, 4, 10); // May 10
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const trend = i * 800;
    data.push({
      date: dateStr,
      impressions: Math.floor(150000 + Math.random() * 30000 + trend),
      clicks: Math.floor(5000 + Math.random() * 3000 + i * 300),
      revenue: Math.floor(1000 + Math.random() * 1000 + i * 120),
    });
  }
  return data;
}

const performanceData = generatePerformanceData();

const adFormatData = [
  { name: 'Video Ads', value: 72, fill: '#3B82F6', percent: 56.3 },
  { name: 'Image Ads', value: 44, fill: '#10B981', percent: 34.4 },
  { name: 'Overlay Ads', value: 8, fill: '#F59E0B', percent: 6.3 },
  { name: 'Banner Ads', value: 4, fill: '#EC4899', percent: 3.1 },
];

const adTypeData = [
  { name: 'Pre-roll Ads', count: 32, percent: 25, color: '#3B82F6' },
  { name: 'Mid-roll Ads', count: 68, percent: 53, color: '#10B981' },
  { name: 'Post-roll Ads', count: 12, percent: 9, color: '#F59E0B' },
  { name: 'Overlay Ads', count: 8, percent: 6, color: '#EC4899' },
  { name: 'Image Banner Ads', count: 8, percent: 6, color: '#8B5CF6' },
];

// --- Custom Tooltip ---

interface PerformanceTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function PerformanceTooltip({ active, payload, label }: PerformanceTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-xs font-medium" style={{ color: entry.color }}>
          {entry.name}:{' '}
          {entry.name === 'Revenue'
            ? `$${(entry.value / 1000).toFixed(1)}K`
            : entry.name === 'Impressions'
              ? `${(entry.value / 1000).toFixed(0)}K`
              : `${(entry.value / 1000).toFixed(1)}K`}
        </p>
      ))}
    </div>
  );
}

// --- Animation Variants ---

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// --- Component ---

export default function ChartsSection() {
  const totalAds = adFormatData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT: Performance Over Time */}
      <motion.div
        className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Performance Over Time</h3>
          <button className="bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-xs text-gray-300 flex items-center gap-1 hover:border-[#333] transition-colors">
            Last 30 Days
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={performanceData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1f1f1f"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#666', fontSize: 10 }}
              interval={4}
            />
            <YAxis width={0} />
            <Tooltip content={<PerformanceTooltip />} />
            <Line
              type="monotone"
              dataKey="impressions"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            <span className="text-xs text-gray-400">Impressions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span className="text-xs text-gray-400">Clicks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span className="text-xs text-gray-400">Revenue</span>
          </div>
        </div>
      </motion.div>

      {/* CENTER: Ad Format Distribution */}
      <motion.div
        className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Ad Format Distribution</h3>
        </div>

        <div className="relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={adFormatData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {adFormatData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">{totalAds}</span>
            <span className="text-[10px] text-gray-400">Total Ads</span>
          </div>
        </div>

        <div className="space-y-2 mt-3">
          {adFormatData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-xs text-gray-400">{item.name}</span>
                <span className="text-xs text-white font-medium">{item.value}</span>
              </div>
              <span className="text-xs text-gray-300">{item.percent}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* RIGHT: Ad Type Distribution */}
      <motion.div
        className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Ad Type Distribution</h3>
        </div>

        <div className="space-y-3">
          {adTypeData.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{item.name}</span>
                <span className="text-xs text-gray-300">
                  {item.count}{' '}
                  <span className="text-gray-500">({item.percent}%)</span>
                </span>
              </div>
              <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}4D`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percent}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + idx * 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
