'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface XtubeLogoProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Show full text or just icon */
  showText?: boolean
  /** Show "Live" red text alongside Xtube */
  showLive?: boolean
  /** Click handler override — if not provided, uses default admin click logic */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
}

// ─── Size Map ────────────────────────────────────────────────────────────────

const sizeMap = {
  xs:  { icon: 20, letter: 10, nameText: 13, liveText: 11, gap: 5  },
  sm:  { icon: 24, letter: 12, nameText: 16, liveText: 13, gap: 6  },
  md:  { icon: 32, letter: 16, nameText: 20, liveText: 16, gap: 8  },
  lg:  { icon: 40, letter: 20, nameText: 26, liveText: 21, gap: 10 },
  xl:  { icon: 56, letter: 28, nameText: 36, liveText: 28, gap: 14 },
}

// ─── SVG Logo Icon ───────────────────────────────────────────────────────────

function LogoIcon({ size, pulseGlow }: { size: number; pulseGlow: boolean }) {
  const r = size / 2
  const innerR = r * 0.85
  const fontSize = size * 0.5

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        {/* Glow filter */}
        <filter id={`glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={size * 0.08} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Inner shadow for 3D depth */}
        <radialGradient id={`circleGrad-${size}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ff3333" />
          <stop offset="100%" stopColor="#cc0000" />
        </radialGradient>
        {/* Highlight arc */}
        <radialGradient id={`highlight-${size}`} cx="40%" cy="30%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Outer glow ring (animated when pulseGlow) */}
      {pulseGlow && (
        <circle
          cx={r}
          cy={r}
          r={innerR + 2}
          fill="none"
          stroke="#ff0000"
          strokeWidth="2"
          opacity="0.4"
        >
          <animate attributeName="r" values={`${innerR + 1};${innerR + 4};${innerR + 1}`} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Main circle */}
      <circle
        cx={r}
        cy={r}
        r={innerR}
        fill={`url(#circleGrad-${size})`}
        filter={`url(#glow-${size})`}
      />

      {/* Highlight overlay for 3D effect */}
      <circle
        cx={r}
        cy={r}
        r={innerR}
        fill={`url(#highlight-${size})`}
      />

      {/* "X" letter */}
      <text
        x={r}
        y={r + fontSize * 0.36}
        textAnchor="middle"
        fontSize={fontSize}
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontWeight="900"
        fill="white"
        style={{ letterSpacing: '-0.02em' }}
      >
        X
      </text>
    </svg>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function XtubeLogo({
  size = 'md',
  showText = true,
  showLive = true,
  onClick,
  className = '',
}: XtubeLogoProps) {
  const adminClickCount = useAppStore((s) => s.adminClickCount)
  const incrementAdminClick = useAppStore((s) => s.incrementAdminClick)
  const adminUnlocked = useAppStore((s) => s.adminUnlocked)
  const adminUnlocking = useAppStore((s) => s.adminUnlocking)

  const s = sizeMap[size]
  const pulseGlow = adminClickCount > 0 && !adminUnlocked

  const handleClick = onClick || (() => {
    const isMobile = window.innerWidth < 768

    // If admin is already unlocked, just refresh
    const store = useAppStore.getState()
    if (store.adminUnlocked) {
      window.location.reload()
      return
    }

    // If modal is about to show, don't refresh
    if (store.adminUnlocking || store.showAdminModal) {
      incrementAdminClick(!isMobile)
      return
    }

    // Track click count for admin unlock
    incrementAdminClick(!isMobile)

    // After incrementing, check the NEW state
    const newState = useAppStore.getState()

    // If 7th click triggered unlock, modal will open — don't refresh
    if (newState.adminUnlocking || newState.showAdminModal) {
      return
    }

    // For clicks 1-6: refresh the page
    window.location.reload()
  })

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center focus:outline-none ${className}`}
      style={{ touchAction: 'manipulation' }}
      aria-label="Xtube Home"
    >
      {/* Red circle icon with X */}
      <LogoIcon size={s.icon} pulseGlow={pulseGlow} />

      {/* Text: "Xtube" white + "Live" red */}
      <AnimatePresence>
        {showText && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-baseline whitespace-nowrap leading-none"
            style={{ gap: s.gap * 0.4 }}
          >
            {/* "Xtube" in white */}
            <span
              className="font-extrabold text-white"
              style={{
                fontSize: s.nameText,
                letterSpacing: '-0.03em',
              }}
            >
              Xtube
            </span>

            {/* "Live" in red with subtle glow */}
            {showLive && (
              <motion.span
                animate={pulseGlow ? {
                  textShadow: [
                    '0 0 6px rgba(255,0,0,0.3)',
                    '0 0 16px rgba(255,0,0,0.6)',
                    '0 0 6px rgba(255,0,0,0.3)',
                  ],
                } : {
                  textShadow: '0 0 8px rgba(255,0,0,0.2)',
                }}
                transition={{ duration: 1.5, repeat: pulseGlow ? Infinity : 0 }}
                className="font-extrabold text-[#FF0000]"
                style={{
                  fontSize: s.liveText,
                  letterSpacing: '0.02em',
                }}
              >
                Live
              </motion.span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
