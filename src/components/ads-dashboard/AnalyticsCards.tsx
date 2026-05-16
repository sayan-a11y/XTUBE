'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone,
  Eye,
  MousePointerClick,
  DollarSign,
  TrendingUp,
  BarChart3,
  ArrowUp,
  type LucideIcon,
} from 'lucide-react'

interface CardData {
  label: string
  value: string
  numericValue: number
  suffix: string
  prefix: string
  percentage: string
  icon: LucideIcon
  color: string
}

const cardsData: CardData[] = [
  {
    label: 'Total Ads',
    value: '128',
    numericValue: 128,
    suffix: '',
    prefix: '',
    percentage: '+12.5%',
    icon: Megaphone,
    color: '#3B82F6',
  },
  {
    label: 'Impressions',
    value: '2.45M',
    numericValue: 2.45,
    suffix: 'M',
    prefix: '',
    percentage: '+18.7%',
    icon: Eye,
    color: '#8B5CF6',
  },
  {
    label: 'Clicks',
    value: '148.7K',
    numericValue: 148.7,
    suffix: 'K',
    prefix: '',
    percentage: '+9.3%',
    icon: MousePointerClick,
    color: '#10B981',
  },
  {
    label: 'Revenue',
    value: '$24,780.50',
    numericValue: 24780.5,
    suffix: '',
    prefix: '$',
    percentage: '+16.4%',
    icon: DollarSign,
    color: '#F59E0B',
  },
  {
    label: 'Avg. CTR',
    value: '6.06%',
    numericValue: 6.06,
    suffix: '%',
    prefix: '',
    percentage: '+4.6%',
    icon: TrendingUp,
    color: '#EC4899',
  },
  {
    label: 'Avg. CPM',
    value: '$10.12',
    numericValue: 10.12,
    suffix: '',
    prefix: '$',
    percentage: '+8.2%',
    icon: BarChart3,
    color: '#06B6D4',
  },
]

function useCountUp(
  target: number,
  duration: number = 1500,
  delay: number = 0
): number {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const startTime = performance.now() + delay

    const animate = (now: number) => {
      if (now < startTime) {
        rafRef.current = requestAnimationFrame(animate)
        return
      }

      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(eased * target)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, delay])

  return count
}

function formatCount(
  value: number,
  prefix: string,
  suffix: string,
  originalValue: string
): string {
  if (suffix === 'M') {
    return `${prefix}${value.toFixed(2)}${suffix}`
  }
  if (suffix === 'K') {
    return `${prefix}${value.toFixed(1)}${suffix}`
  }
  if (prefix === '$') {
    if (originalValue.includes(',')) {
      return `${prefix}${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }
    return `${prefix}${value.toFixed(2)}`
  }
  if (suffix === '%') {
    return `${prefix}${value.toFixed(2)}${suffix}`
  }
  return `${prefix}${Math.round(value)}${suffix}`
}

function StatCard({
  data,
  index,
}: {
  data: CardData
  index: number
}) {
  const { label, numericValue, suffix, prefix, percentage, icon: Icon, color, value: originalValue } = data

  const animatedCount = useCountUp(numericValue, 1500, index * 100 + 300)
  const displayValue = formatCount(animatedCount, prefix, suffix, originalValue)

  const glowShadow = `0 8px 30px rgba(0,0,0,0.3), 0 0 20px ${color}20, 0 0 40px ${color}10`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: 'easeOut',
      }}
      whileHover={{
        scale: 1.02,
        y: -2,
        boxShadow: glowShadow,
      }}
      className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4 transition-all duration-300"
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        {/* Icon container */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}26` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>

        {/* Percentage badge */}
        <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5">
          <ArrowUp className="h-3 w-3 text-green-400" />
          <span className="text-xs font-medium text-green-400">{percentage}</span>
        </div>
      </div>

      {/* Value */}
      <div className="mt-3 text-2xl font-bold text-white">{displayValue}</div>

      {/* Label */}
      <div className="mt-1 text-xs text-gray-400">{label}</div>

      {/* Subtext */}
      <div className="mt-0.5 text-[10px] text-gray-500">from last 30 days</div>
    </motion.div>
  )
}

export default function AnalyticsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cardsData.map((card, index) => (
        <StatCard key={card.label} data={card} index={index} />
      ))}
    </div>
  )
}
