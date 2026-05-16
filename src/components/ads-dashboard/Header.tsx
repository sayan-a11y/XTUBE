'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  PlayCircle,
  Calendar,
  ChevronDown,
  Download,
  Bell,
  Menu,
  Plus,
} from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-0"
      style={{
        height: '70px',
        background: '#0a0a0a',
        borderBottom: '1px solid #1f1f1f',
      }}
    >
      {/* Left Side */}
      <div className="flex items-center gap-3">
        {/* Hamburger menu - tablet/mobile only */}
        <button
          onClick={onMenuToggle}
          className="flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>

        <PlayCircle size={24} className="shrink-0" style={{ color: '#E50914' }} />

        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white leading-tight">
            Video Ads Analytics
          </h1>
          <span className="hidden text-xs text-gray-400 md:block">
            Manage, analyze and optimize your video &amp; image ads performance
          </span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Date Range Dropdown */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="hidden items-center gap-2 rounded-lg border px-3 py-2 sm:flex"
          style={{
            background: '#111111',
            borderColor: '#1f1f1f',
          }}
        >
          <Calendar size={16} className="shrink-0 text-gray-400" />
          <span className="text-sm text-gray-300">
            <span className="hidden lg:inline">May 10, 2025 - Jun 10, 2025</span>
            <span className="lg:hidden">May 10 - Jun 10</span>
          </span>
          <ChevronDown size={14} className="shrink-0 text-gray-400" />
        </motion.button>

        {/* Mobile-only calendar icon button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center rounded-lg border p-2 sm:hidden"
          style={{
            background: '#111111',
            borderColor: '#1f1f1f',
          }}
          aria-label="Select date range"
        >
          <Calendar size={16} className="text-gray-300" />
        </motion.button>

        {/* Export Report Button */}
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.98 }}
          className="hidden items-center gap-2 rounded-lg border px-4 py-2 sm:flex"
          style={{
            background: '#111111',
            borderColor: '#1f1f1f',
          }}
        >
          <Download size={16} className="shrink-0 text-gray-400" />
          <span className="text-sm text-gray-300">Export Report</span>
        </motion.button>

        {/* Mobile-only download icon button */}
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center rounded-lg border p-2 sm:hidden"
          style={{
            background: '#111111',
            borderColor: '#1f1f1f',
          }}
          aria-label="Export report"
        >
          <Download size={16} className="text-gray-300" />
        </motion.button>

        {/* Notification Bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center justify-center rounded-full border p-2"
          style={{
            background: '#111111',
            borderColor: '#1f1f1f',
          }}
          aria-label="Notifications"
        >
          <Bell size={20} className="text-gray-300" />
          {/* Red dot indicator */}
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ background: '#E50914' }}
          />
        </motion.button>

        {/* Admin Avatar */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #E50914, #b0070f)',
            boxShadow: '0 0 0 2px #1f1f1f',
          }}
        >
          A
        </div>

        {/* Create New Ad Button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(229, 9, 20, 0.35)' }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{
            background: 'linear-gradient(135deg, #E50914, #b0070f)',
          }}
        >
          <Plus size={16} className="shrink-0" />
          <span className="hidden md:inline">Create New Ad</span>
        </motion.button>
      </div>
    </motion.header>
  );
}
