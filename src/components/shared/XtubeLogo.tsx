'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'

interface XtubeLogoProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Show full text or just icon */
  showText?: boolean
  /** Click handler override — if not provided, uses default admin click logic */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
}

const sizeMap = {
  sm: { circle: 'h-6 w-6', letter: 'text-[10px]', text: 'text-sm', gap: 'gap-1.5' },
  md: { circle: 'h-8 w-8', letter: 'text-xs', text: 'text-base', gap: 'gap-2' },
  lg: { circle: 'h-10 w-10', letter: 'text-sm', text: 'text-lg', gap: 'gap-2.5' },
  xl: { circle: 'h-14 w-14', letter: 'text-xl', text: 'text-2xl', gap: 'gap-3' },
}

export function XtubeLogo({ size = 'md', showText = true, onClick, className = '' }: XtubeLogoProps) {
  const adminClickCount = useAppStore((s) => s.adminClickCount)
  const incrementAdminClick = useAppStore((s) => s.incrementAdminClick)
  const setView = useAppStore((s) => s.setView)

  const s = sizeMap[size]

  const handleClick = onClick || (() => {
    // Default behavior: desktop/tablet = admin click tracking, mobile = just go home
    // Detect if mobile (viewport < 768px)
    const isMobile = window.innerWidth < 768
    incrementAdminClick(!isMobile)

    // For all clicks before 7: navigate to home (refresh)
    const store = useAppStore.getState()
    if (!store.adminUnlocked && !store.adminUnlocking) {
      setView('home')
    }
  })

  return (
    <button
      onClick={handleClick}
      className={`flex items-center ${s.gap} focus:outline-none ${className}`}
      aria-label="Xtube Home"
    >
      {/* Red circle with white "x" */}
      <motion.div
        animate={adminClickCount > 0 ? {
          boxShadow: [
            '0 0 8px rgba(255,0,0,0.2)',
            '0 0 20px rgba(255,0,0,0.5)',
            '0 0 8px rgba(255,0,0,0.2)',
          ],
        } : {}}
        transition={{ duration: 0.5, repeat: adminClickCount > 0 ? Infinity : 0 }}
        className={`flex ${s.circle} flex-shrink-0 items-center justify-center rounded-full bg-[#FF0000] shadow-[0_0_10px_rgba(255,0,0,0.3)]`}
      >
        <span className={`${s.letter} font-black text-white leading-none`}>x</span>
      </motion.div>

      {/* Text: "X" white + "tube" red — Sportix Live style */}
      <AnimatePresence>
        {showText && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.2 }}
            className={`whitespace-nowrap ${s.text} font-extrabold leading-none`}
          >
            <span className="text-white">X</span>
            <span className="text-[#FF0000]">tube</span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
