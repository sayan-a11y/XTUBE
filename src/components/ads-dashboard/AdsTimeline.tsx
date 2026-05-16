'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pencil, Trash2, Plus } from 'lucide-react';

// --- Data ---

const adBlocks = [
  { label: 'Pre-roll', left: '0%', width: '5%', bg: 'rgba(59,130,246,0.4)', border: '#3B82F6' },
  { label: 'Mid-roll 1', left: '30%', width: '4%', bg: 'rgba(16,185,129,0.4)', border: '#10B981' },
  { label: 'Mid-roll 2', left: '55%', width: '4%', bg: 'rgba(139,92,246,0.4)', border: '#8B5CF6' },
  { label: 'Post-roll', left: '92%', width: '5%', bg: 'rgba(245,158,11,0.4)', border: '#F59E0B' },
];

const timeMarkers = ['00:00', '00:30:00', '01:00:00', '01:30:00', '02:00:00'];

const adList = [
  { id: 1, type: 'Pre-roll', name: 'Nike 4K Video Ad', format: 'Video', duration: '00:30', color: '#3B82F6' },
  { id: 2, type: 'Mid-roll', name: 'Samsung Galaxy Ad', format: 'Video', duration: '00:45', color: '#10B981' },
  { id: 3, type: 'Mid-roll', name: 'Amazon Banner', format: 'Image', duration: '-', color: '#8B5CF6' },
  { id: 4, type: 'Mid-roll', name: 'Car Brand Ad', format: 'Video', duration: '00:15', color: '#F59E0B' },
  { id: 5, type: 'Post-roll', name: 'Coca-Cola Banner', format: 'Image', duration: '-', color: '#EC4899' },
];

// --- Animation Variants ---

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

// --- Component ---

export default function AdsTimeline() {
  return (
    <motion.div
      className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Ads Timeline</h3>
        <span className="bg-[#E50914]/15 text-[#E50914] text-xs px-2 py-0.5 rounded-full">
          Unlimited Ads
        </span>
      </div>

      {/* Video Title */}
      <p className="text-xs text-gray-400 mb-1">The Future of AI Technology</p>
      <p className="text-xs text-gray-500">(02:00:00)</p>

      {/* Timeline Bar */}
      <div className="mt-3">
        <div className="w-full h-12 bg-[#0a0a0a] rounded-lg relative overflow-hidden">
          {/* Ad blocks */}
          {adBlocks.map((block, idx) => (
            <motion.div
              key={idx}
              className="absolute top-0 h-full rounded-sm flex items-center justify-center"
              style={{
                left: block.left,
                width: block.width,
                backgroundColor: block.bg,
                borderLeft: `2px solid ${block.border}`,
              }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
            >
              <Play className="w-3 h-3 text-white/70" />
            </motion.div>
          ))}

          {/* Time markers */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 pb-0.5">
            {timeMarkers.map((time, idx) => (
              <span key={idx} className="text-[9px] text-gray-600">
                {time}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Ad List */}
      <div className="mt-3 space-y-2">
        {adList.map((ad, idx) => (
          <motion.div
            key={ad.id}
            className="flex items-center justify-between bg-[#0a0a0a] rounded-lg px-3 py-2"
            variants={listItemVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3, delay: 0.4 + idx * 0.08 }}
          >
            {/* Left: color dot + ad name + type badge + duration */}
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: ad.color }}
              />
              <span className="text-xs text-white">{ad.name}</span>
              <span className="text-[10px] text-gray-500 bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                {ad.format}
              </span>
              {ad.duration !== '-' && (
                <span className="text-[10px] text-gray-500">{ad.duration}</span>
              )}
            </div>

            {/* Right: Edit + Delete buttons */}
            <div className="flex items-center gap-1">
              <button className="p-1 text-gray-500 hover:text-white transition-colors" aria-label="Edit ad">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 text-gray-500 hover:text-white transition-colors" aria-label="Delete ad">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Ad Button */}
      <motion.button
        className="mt-3 bg-[#E50914] text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-[#b0070f] transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="w-3.5 h-3.5" />
        Add Ad
      </motion.button>
    </motion.div>
  );
}
