'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { formatAdNumber, formatAdRevenue } from '@/hooks/useRealtimeAds'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  CloudUpload,
  Upload,
  Trash2,
  CheckCircle2,
  Film,
  Megaphone,
  Eye,
  TrendingUp,
  DollarSign,
  MousePointer,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  BarChart3,
  Pencil,
  ExternalLink,
  Radio,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Monitor,
  Tablet,
  Smartphone,
  ArrowDownFromLine,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

type UploadStage = 'idle' | 'uploading' | 'processing' | 'success'
type PreviewMode = 'desktop' | 'tablet' | 'mobile'
type AdTab = 'image' | 'video'

interface FooterAd {
  id: string
  title: string
  type: 'Image' | 'Video'
  placement: string
  size: string
  impressions: string
  clicks?: number
  rawImpressions?: number
  rawRevenue?: number
  ctr: string
  revenue: string
  status: 'Active' | 'Paused' | 'Draft'
  gradient: string
  imageUrl: string
  mediaUrl: string | null
}

const STAT_COLORS = ['#ff1e1e', '#8b5cf6', '#10b981', '#ec4899', '#f97316']
const DONUT_COLORS = ['#ff1e1e', '#8b5cf6']

const premiumPlaceholderImages = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1500627869374-13cd993b1115?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=60',
]

function MiniSparkline({ color, index }: { color: string; index: number }) {
  const paths = [
    'M0,20 L8,16 L16,18 L24,10 L32,12 L40,6 L48,8 L56,2',
    'M0,18 L8,14 L16,16 L24,8 L32,10 L40,4 L48,6 L56,0',
    'M0,22 L8,18 L16,20 L24,12 L32,14 L40,8 L48,10 L56,4',
    'M0,16 L8,12 L16,14 L24,6 L32,8 L40,2 L48,4 L56,0',
    'M0,20 L8,16 L16,18 L24,10 L32,12 L40,6 L48,8 L56,2',
  ]
  return (
    <svg viewBox="0 0 56 24" className="mt-2 h-6 w-full opacity-40">
      <path
        d={paths[index % paths.length]}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay,
  index,
}: {
  title: string
  value: string
  change: string
  icon: React.ElementType
  color: string
  delay: number
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 p-3 lg:p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:shadow-lg"
    >
      <div className="absolute left-0 top-0 h-[2px] w-full" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: color, filter: 'blur(40px)', opacity: 0.06 }} />

      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">{title}</p>
          <p className="text-xl font-bold text-white">{value}</p>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">{change}</span>
            <span className="text-[10px] text-white/25">from last 30 days</span>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      <MiniSparkline color={color} index={index} />
    </motion.div>
  )
}

export function HeroFooterAdsPage() {
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState('0 MB/s')
  const [uploadRemaining, setUploadRemaining] = useState('')
  const [uploadedSize, setUploadedSize] = useState('0 GB')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [adTab, setAdTab] = useState<AdTab>('image')

  // Ad Settings state
  const [adTitle, setAdTitle] = useState('')
  const [adLink, setAdLink] = useState('')
  const [statusActive, setStatusActive] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Preview state
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [extractedThumbnails, setExtractedThumbnails] = useState<string[]>([])
  const [isExtractingThumbnails, setIsExtractingThumbnails] = useState(false)
  const [fileDetails, setFileDetails] = useState<{
    name: string
    size: string
    resolution: string
    format: string
    duration: number
  } | null>(null)

  // Live Syncing State
  const [footerAds, setFooterAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const footerRes = await fetch('/api/footer-ads')
      if (footerRes.ok) {
        const footerData = await footerRes.json()
        setFooterAds(footerData.footerAds || [])
      }
    } catch (e) {
      console.error('Error fetching ads data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return

    const channelFooter = supabase
      .channel('admin-footer-realtime-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'FooterAd' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase?.removeChannel(channelFooter)
    }
  }, [fetchData])

  // Canvas frame extraction logic
  const extractCanvasThumbnails = useCallback((file: File, duration: number) => {
    setIsExtractingThumbnails(true)
    const tempVideo = document.createElement('video')
    tempVideo.src = URL.createObjectURL(file)
    tempVideo.preload = 'metadata'
    tempVideo.muted = true
    tempVideo.playsInline = true

    tempVideo.onloadedmetadata = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 320
      canvas.height = 180

      const frames: string[] = []
      let captured = 0

      const captureFrame = (time: number) => {
        tempVideo.currentTime = time
        tempVideo.onseeked = () => {
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height)
            frames.push(canvas.toDataURL('image/jpeg', 0.8))
          }
          captured++
          if (captured < 10) {
            captureFrame((duration / 10) * captured)
          } else {
            setExtractedThumbnails(frames)
            setIsExtractingThumbnails(false)
            setUploadStage('success')
          }
        }
      }
      captureFrame(0.5) // start at 0.5s to avoid black frames
    }

    tempVideo.onerror = () => {
      setExtractedThumbnails(premiumPlaceholderImages)
      setIsExtractingThumbnails(false)
      setUploadStage('success')
    }
  }, [])

  const processSelectedFile = useCallback((file: File) => {
    // Generate object URL for immediate local preview and thumbnail extraction
    const objectUrl = URL.createObjectURL(file)
    setLocalPreviewUrl(objectUrl)
    setMediaUrl(objectUrl)

    const isVideo = file.type.startsWith('video/')
    const format = file.name.split('.').pop()?.toUpperCase() || ''

    if (isVideo) {
      setAdTab('video')
      const tempVid = document.createElement('video')
      tempVid.src = objectUrl
      tempVid.preload = 'metadata'
      tempVid.onloadedmetadata = () => {
        const roundedDuration = Math.round(tempVid.duration || 5)
        const resolution = `${tempVid.videoWidth}×${tempVid.videoHeight}`
        setFileDetails({
          name: file.name,
          size: `${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`,
          resolution,
          format,
          duration: roundedDuration,
        })
        if (!adTitle) setAdTitle(file.name.replace(/\.[^/.]+$/, ""))

        // Start REAL upload using XMLHttpRequest
        setUploadStage('uploading')
        setUploadProgress(0)

        const startTime = Date.now()

        // 1. Try Direct R2 upload bypass first if enabled
        const startDirectUpload = async () => {
          try {
            const initRes = await fetch('/api/upload-ad', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'init',
                fileName: file.name,
                fileType: file.type,
                category: 'ad',
              }),
            })

            if (initRes.ok) {
              const { direct, uploadUrl, publicUrl } = await initRes.json()
              if (direct && uploadUrl) {
                const xhr = new XMLHttpRequest()
                xhr.open('PUT', uploadUrl, true)
                xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')

                xhr.upload.onprogress = (event) => {
                  if (event.lengthComputable) {
                    const percent = (event.loaded / event.total) * 100
                    setUploadProgress(percent)

                    const uploadedSizeStr = (event.loaded / (1024 * 1024)).toFixed(1) + ' MB'
                    const totalSizeStr = (event.total / (1024 * 1024)).toFixed(1) + ' MB'
                    setUploadedSize(`${uploadedSizeStr} / ${totalSizeStr}`)

                    const elapsedSeconds = (Date.now() - startTime) / 1000
                    const speedBytesPerSec = elapsedSeconds > 0 ? event.loaded / elapsedSeconds : 0
                    const speedMbPerSec = (speedBytesPerSec / (1024 * 1024)).toFixed(1)
                    setUploadSpeed(`${speedMbPerSec} MB/s`)

                    const remainingBytes = event.total - event.loaded
                    const timeRemainingSecs = speedBytesPerSec > 0 ? Math.ceil(remainingBytes / speedBytesPerSec) : 0
                    setUploadRemaining(timeRemainingSecs > 60 ? `${Math.ceil(timeRemainingSecs / 60)} mins` : `${timeRemainingSecs} secs`)
                  }
                }

                xhr.onload = () => {
                  if (xhr.status === 200 || xhr.status === 201) {
                    setMediaUrl(publicUrl)
                    setUploadStage('processing')
                    extractCanvasThumbnails(file, tempVid.duration)
                  } else {
                    fallbackUpload()
                  }
                }

                xhr.onerror = () => {
                  fallbackUpload()
                }

                xhr.send(file)
                return true
              }
            }
          } catch (err) {
            console.warn('Direct upload failed to initialize, trying fallback...', err)
          }
          return false
        }

        const fallbackUpload = () => {
          const xhr = new XMLHttpRequest()
          const formData = new FormData()
          formData.append('file', file)
          formData.append('category', 'ad')

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = (event.loaded / event.total) * 100
              setUploadProgress(percent)

              const uploadedSizeStr = (event.loaded / (1024 * 1024)).toFixed(1) + ' MB'
              const totalSizeStr = (event.total / (1024 * 1024)).toFixed(1) + ' MB'
              setUploadedSize(`${uploadedSizeStr} / ${totalSizeStr}`)

              const elapsedSeconds = (Date.now() - startTime) / 1000
              const speedBytesPerSec = elapsedSeconds > 0 ? event.loaded / elapsedSeconds : 0
              const speedMbPerSec = (speedBytesPerSec / (1024 * 1024)).toFixed(1)
              setUploadSpeed(`${speedMbPerSec} MB/s`)

              const remainingBytes = event.total - event.loaded
              const timeRemainingSecs = speedBytesPerSec > 0 ? Math.ceil(remainingBytes / speedBytesPerSec) : 0
              setUploadRemaining(timeRemainingSecs > 60 ? `${Math.ceil(timeRemainingSecs / 60)} mins` : `${timeRemainingSecs} secs`)
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText)
                setMediaUrl(response.url)
                setUploadStage('processing')
                extractCanvasThumbnails(file, tempVid.duration)
              } catch (e) {
                alert('Failed to parse upload response')
                setUploadStage('idle')
              }
            } else {
              alert(`Upload failed: ${xhr.statusText || xhr.status}`)
              setUploadStage('idle')
            }
          }

          xhr.onerror = () => {
            alert('Network upload error')
            setUploadStage('idle')
          }

          xhr.open('POST', '/api/upload-ad')
          xhr.send(formData)
        }

        startDirectUpload().then((success) => {
          if (!success) fallbackUpload()
        })
      }
    } else {
      // Image file
      setAdTab('image')
      setFileDetails({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        resolution: 'Responsive Dimension',
        format,
        duration: 0,
      })
      if (!adTitle) setAdTitle(file.name.replace(/\.[^/.]+$/, ""))

      setUploadStage('uploading')
      setUploadProgress(0)

      const startTime = Date.now()

      // 1. Try Direct R2 upload bypass first if enabled
      const startDirectUpload = async () => {
        try {
          const initRes = await fetch('/api/upload-ad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'init',
              fileName: file.name,
              fileType: file.type,
              category: 'ad',
            }),
          })

          if (initRes.ok) {
            const { direct, uploadUrl, publicUrl } = await initRes.json()
            if (direct && uploadUrl) {
              const xhr = new XMLHttpRequest()
              xhr.open('PUT', uploadUrl, true)
              xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg')

              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                  const percent = (event.loaded / event.total) * 100
                  setUploadProgress(percent)
                  setUploadedSize(`${percent.toFixed(0)}%`)

                  const elapsedSeconds = (Date.now() - startTime) / 1000
                  const speedBytesPerSec = elapsedSeconds > 0 ? event.loaded / elapsedSeconds : 0
                  setUploadSpeed(`${(speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`)
                  setUploadRemaining('Uploading...')
                }
              }

              xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 201) {
                  setMediaUrl(publicUrl)
                  setExtractedThumbnails([publicUrl])
                  setUploadStage('success')
                } else {
                  fallbackUpload()
                }
              }

              xhr.onerror = () => {
                fallbackUpload()
              }

              xhr.send(file)
              return true
            }
          }
        } catch (err) {
          console.warn('Direct upload failed to initialize, trying fallback...', err)
        }
        return false
      }

      const fallbackUpload = () => {
        const xhr = new XMLHttpRequest()
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', 'ad')

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100
            setUploadProgress(percent)
            setUploadedSize(`${percent.toFixed(0)}%`)

            const elapsedSeconds = (Date.now() - startTime) / 1000
            const speedBytesPerSec = elapsedSeconds > 0 ? event.loaded / elapsedSeconds : 0
            setUploadSpeed(`${(speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`)
            setUploadRemaining('Calculating...')
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              setMediaUrl(response.url)
              setExtractedThumbnails([response.url])
              setUploadStage('success')
            } catch (e) {
              alert('Failed to parse upload response')
              setUploadStage('idle')
            }
          } else {
            alert(`Upload failed: ${xhr.statusText || xhr.status}`)
            setUploadStage('idle')
          }
        }

        xhr.onerror = () => {
          alert('Network upload error')
          setUploadStage('idle')
        }

        xhr.open('POST', '/api/upload-ad')
        xhr.send(formData)
      }

      startDirectUpload().then((success) => {
        if (!success) fallbackUpload()
      })
    }
  }, [adTitle, extractCanvasThumbnails])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) processSelectedFile(files[0])
  }, [processSelectedFile])

  const handleResetUpload = useCallback(() => {
    setUploadStage('idle')
    setUploadProgress(0)
    setSelectedThumbnail(0)
    setFileDetails(null)
    setMediaUrl(null)
    setLocalPreviewUrl(null)
    setExtractedThumbnails([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const deleteAd = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this footer ad?')) return
    try {
      const res = await fetch('/api/footer-ads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }, [fetchData])

  const toggleAdStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/footer-ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }, [fetchData])

  const [saving, setSaving] = useState(false)
  const handleSaveAd = useCallback(async () => {
    if (!adTitle) {
      alert('Please enter an ad campaign title')
      return
    }
    setSaving(true)
    try {
      const activeThumbnail = extractedThumbnails[selectedThumbnail] || premiumPlaceholderImages[0]

      const payload: Record<string, any> = {
        title: adTitle,
        mediaUrl: mediaUrl || activeThumbnail,
        thumbnailUrl: activeThumbnail,
        adType: adTab === 'video' ? 'video' : 'image',
        mediaFormat: fileDetails?.format?.toLowerCase() || (adTab === 'video' ? 'mp4' : 'jpg'),
        isActive: statusActive,
        linkUrl: adLink || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      }

      const res = await fetch('/api/footer-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setAdTitle('')
        setAdLink('')
        setStartDate('')
        setEndDate('')
        handleResetUpload()
        fetchData()
        alert('Footer ad campaign saved successfully!')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }, [adTitle, adTab, statusActive, startDate, endDate, adLink, handleResetUpload, mediaUrl, extractedThumbnails, selectedThumbnail, fileDetails, fetchData])

  // KPIs
  const stats = useMemo(() => {
    const totalFooter = footerAds.length
    const activeFooter = footerAds.filter(a => a.isActive).length

    const totalImpressions = footerAds.reduce((s, a) => s + (a.impressions || 0), 0)
    const totalClicks = footerAds.reduce((s, a) => s + (a.clicks || 0), 0)
    const totalRevenue = footerAds.reduce((s, a) => s + (a.revenue || 0), 0)
    const avgCTR = footerAds.length > 0
      ? (footerAds.reduce((s, a) => s + (a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0), 0) / footerAds.length)
      : 0

    return {
      totalAds: totalFooter,
      activeAds: activeFooter,
      totalImpressions,
      avgCTR,
      totalRevenue
    }
  }, [footerAds])

  const adGradients = ['from-red-900/60 via-rose-800/40 to-pink-900/30','from-blue-900/60 via-indigo-800/40 to-violet-900/30','from-cyan-900/60 via-sky-800/40 to-blue-900/30','from-emerald-900/60 via-teal-800/40 to-cyan-900/30']

  const mappedAds: FooterAd[] = useMemo(() => {
    return footerAds.map((ad, i) => ({
      id: ad.id,
      title: ad.title,
      type: (ad.adType === 'video' || ad.mediaFormat === 'mp4' ? 'Video' : 'Image'),
      placement: 'Footer Anchored Ad',
      size: '970×250',
      impressions: formatAdNumber(ad.impressions || 0),
      clicks: ad.clicks || 0,
      rawImpressions: ad.impressions || 0,
      rawRevenue: ad.revenue || 0,
      ctr: (ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0%'),
      revenue: formatAdRevenue(ad.revenue || 0),
      status: ad.isActive ? 'Active' : 'Paused',
      gradient: adGradients[i % adGradients.length],
      imageUrl: ad.thumbnailUrl || ad.mediaUrl,
      mediaUrl: ad.mediaUrl,
    }))
  }, [footerAds])

  const donutData = useMemo(() => {
    const vidVal = footerAds.filter(a => a.adType === 'video' || a.mediaFormat === 'mp4').reduce((s, a) => s + (a.impressions || 0), 0)
    const imgVal = footerAds.filter(a => a.adType !== 'video' && a.mediaFormat !== 'mp4').reduce((s, a) => s + (a.impressions || 0), 0)
    if (vidVal === 0 && imgVal === 0) {
      return [{ name: 'No Footer Ads', value: 1 }]
    }
    return [
      { name: 'Video Footer Ads', value: vidVal },
      { name: 'Image Footer Ads', value: imgVal }
    ]
  }, [footerAds])

  const totalFooterImpressions = useMemo(() => {
    const sum = footerAds.reduce((s, a) => s + (a.impressions || 0), 0)
    if (sum >= 1000000) return `${(sum / 1000000).toFixed(1)}M`
    if (sum >= 1000) return `${(sum / 1000).toFixed(1)}K`
    return String(sum)
  }, [footerAds])

  const filteredAds = mappedAds.filter((ad) => {
    if (statusFilter !== 'all' && ad.status.toLowerCase() !== statusFilter) return false
    if (searchQuery && !ad.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const statusStyles: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto no-scrollbar"
    >
      <div className="min-h-full p-3 lg:p-5 space-y-4">
        {/* TOP HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">Footer Ads</h1>
            <p className="mt-1 text-xs text-white/40">Deploy anchored footer advertisement banner &amp; video creatives</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111]/60 px-3 py-2 text-xs font-medium text-white/60 backdrop-blur-xl transition-colors hover:border-white/20 hover:text-white">
              <Clock className="h-3.5 w-3.5" />
              May 10 – Jun 10, 2026
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111]/60 px-3 py-2 text-xs font-medium text-white/60 backdrop-blur-xl transition-colors hover:border-white/20 hover:text-white">
              <Upload className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* TOP ANALYTICS CARDS */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard title="Total Footer Ads" value={String(stats.totalAds)} change="+9.4%" icon={Megaphone} color={STAT_COLORS[0]} delay={0} index={0} />
          <StatCard title="Active Campaigns" value={String(stats.activeAds)} change="+11.2%" icon={Radio} color={STAT_COLORS[1]} delay={0.05} index={1} />
          <StatCard title="Impressions" value={formatAdNumber(stats.totalImpressions)} change="+22.7%" icon={Eye} color={STAT_COLORS[2]} delay={0.1} index={2} />
          <StatCard title="Average CTR" value={stats.avgCTR.toFixed(2) + '%'} change="+8.4%" icon={MousePointer} color={STAT_COLORS[3]} delay={0.15} index={3} />
          <StatCard title="Revenue Track" value={formatAdRevenue(stats.totalRevenue)} change="+19.6%" icon={DollarSign} color={STAT_COLORS[4]} delay={0.2} index={4} />
        </div>

        {/* THREE COLUMN MAIN LAYOUT */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_300px] 2xl:grid-cols-[1fr_1fr_340px]">
          
          {/* COLUMN 1: FORM & UPLOAD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 backdrop-blur-xl"
          >
            <div className="p-3 lg:p-4">
              <h2 className="mb-4 text-base font-bold text-white">Create Footer Ad</h2>

              {/* Ad Creative Type Tabs */}
              <div className="mb-4 flex items-center gap-0 border-b border-white/5">
                <button
                  onClick={() => { setAdTab('image'); handleResetUpload() }}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'image' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image Creative
                  {adTab === 'image' && (
                    <motion.div
                      layoutId="footer-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-xtube-red"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => { setAdTab('video'); handleResetUpload() }}
                  className={`relative flex items-center gap-2 px-4 pb-2.5 text-sm font-medium transition-colors ${
                    adTab === 'video' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  Video Creative
                  {adTab === 'video' && (
                    <motion.div
                      layoutId="footer-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-xtube-red"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {/* Upload Drop Zone */}
              <AnimatePresence mode="wait">
                {uploadStage === 'idle' ? (
                  <motion.div
                    key="upload-idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200 ${
                      isDragOver
                        ? 'border-xtube-red bg-xtube-red/5 shadow-[0_0_20px_rgba(229,9,20,0.15)]'
                        : 'border-white/10 bg-[#0a0a0a]/60 hover:border-white/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={adTab === 'video' ? 'video/mp4,video/mov,video/webm' : 'image/*'}
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) processSelectedFile(e.target.files[0]) }}
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-xtube-red/10">
                      <CloudUpload className="h-6 w-6 text-xtube-red" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">
                        Drag &amp; drop your {adTab === 'video' ? 'video' : 'creative image'} here
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        or <span className="text-xtube-red underline underline-offset-2">browse files</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25">
                      {adTab === 'video' ? 'Max file size: 5GB | Supported: MP4, WebM, MOV' : 'Supported: JPG, PNG, WEBP, GIF'}
                    </p>
                  </motion.div>
                ) : uploadStage === 'uploading' || uploadStage === 'processing' ? (
                  <motion.div
                    key="upload-progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-white/5 bg-[#0a0a0a]/60 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">
                        {uploadStage === 'processing' ? 'Generating Thumbnails...' : 'Uploading Chunk Stream...'}
                      </span>
                      <span className="text-xs font-bold text-xtube-red">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-xtube-red to-red-500"
                      />
                    </div>
                    {uploadStage === 'uploading' ? (
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div>
                          <p className="text-[9px] text-white/25">Uploaded</p>
                          <p className="font-semibold text-white truncate">{uploadedSize} / {fileDetails?.size}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/25">Speed</p>
                          <p className="font-semibold text-white">{uploadSpeed}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/25">Time Left</p>
                          <p className="font-semibold text-white">{uploadRemaining}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                        <span>Realtime Video Thumbnail Generator Rendering 10 Frames...</span>
                      </div>
                    )}
                    <button onClick={handleResetUpload} className="text-xs text-xtube-red hover:underline">Cancel</button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload-success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">{fileDetails?.name}</p>
                        <p className="text-[10px] text-white/30">{fileDetails?.size} &bull; {fileDetails?.resolution} &bull; {fileDetails?.format}</p>
                      </div>
                      <button onClick={handleResetUpload} className="text-xs text-xtube-red hover:underline">Change</button>
                    </div>

                    {/* SELECT PRESETS / CAPTURED FRAMES */}
                    <div>
                      <p className="text-[11px] font-medium text-white/60 mb-1.5">
                        {adTab === 'video' ? 'Select Active Thumbnail (10 Generated Frame Captures)' : 'Preset Styles'}
                      </p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {extractedThumbnails.slice(0, 10).map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedThumbnail(i)}
                            className={`relative aspect-video overflow-hidden rounded border-2 transition-all ${
                              selectedThumbnail === i
                                ? 'border-xtube-red shadow-[0_0_8px_rgba(229,9,20,0.4)] scale-95'
                                : 'border-transparent hover:border-white/20 hover:scale-105'
                            }`}
                          >
                            <img src={url} alt="preset" className="h-full w-full object-cover" />
                            {selectedThumbnail === i && (
                              <div className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-xtube-red">
                                <CheckCircle2 className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* INPUT FIELDS */}
              <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/50">Campaign Title *</label>
                  <input
                    type="text"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40"
                    placeholder="e.g. Nike Anchored Footer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/50">Destination Redirect Link *</label>
                  <input
                    type="text"
                    value={adLink}
                    onChange={(e) => setAdLink(e.target.value)}
                    className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40"
                    placeholder="e.g. https://nike.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-white/50">Start Date (Open Time)</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40 [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-white/50">End Date (Close Time)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#ff1e1e]/40 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <motion.button
                  onClick={handleSaveAd}
                  disabled={saving || uploadStage === 'uploading' || uploadStage === 'processing'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-xtube-red px-5 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-all hover:bg-xtube-red-hover disabled:opacity-50"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CloudUpload className="h-4 w-4" />
                  )}
                  {saving ? 'Deploying to database...' : 'Deploy Footer Ad Campaign'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 2: INTERACTIVE LIVE PREVIEW PLAYER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 backdrop-blur-xl">
              <div className="p-3 lg:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Radio className="h-4 w-4 text-xtube-red animate-pulse" />
                    Layout Frame Mockup Preview
                  </h2>
                  <div className="flex gap-1">
                    {[
                      { id: 'desktop', icon: Monitor },
                      { id: 'tablet', icon: Tablet },
                      { id: 'mobile', icon: Smartphone },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setPreviewMode(mode.id as PreviewMode)}
                        className={`h-7 w-7 rounded flex items-center justify-center border transition-all ${
                          previewMode === mode.id
                            ? 'border-xtube-red bg-xtube-red/10 text-white'
                            : 'border-white/5 bg-[#0a0a0a] text-white/40 hover:border-white/20'
                        }`}
                      >
                        <mode.icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative aspect-video overflow-hidden rounded-lg bg-[#08080c] border border-white/5 shadow-2xl flex flex-col justify-between">
                  
                  {/* Mock Site Header */}
                  <div className="w-full h-8 bg-black/40 border-b border-white/5 flex items-center px-3 justify-between">
                    <span className="text-[8px] font-bold text-white uppercase">Xtube Landing</span>
                    <span className="text-[7px] text-white/40 font-semibold">Mock Viewport</span>
                  </div>

                  {/* Mock Site Body Content */}
                  <div className="w-full flex-grow p-3 space-y-2">
                    <div className="h-2 w-1/3 bg-white/5 rounded" />
                    <div className="h-1.5 w-1/2 bg-white/5 rounded" />
                  </div>

                  {/* STICKY FOOTER ANCHORED AD PLAYBACK CONTAINER */}
                  <div className="w-full p-1.5 sm:p-2 z-20">
                    <div className="relative w-full h-11 rounded-lg border border-[#ff1e1e]/20 bg-[#050508]/95 overflow-hidden flex items-center shadow-[0_0_15px_rgba(255,30,30,0.15)]">
                      {/* Cinematic Background Media */}
                      <div className="absolute inset-0 z-0 w-full h-full">
                        {adTab === 'video' && (localPreviewUrl || mediaUrl) ? (
                          <video
                            src={localPreviewUrl || mediaUrl || ''}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={localPreviewUrl || mediaUrl || extractedThumbnails[selectedThumbnail] || premiumPlaceholderImages[selectedThumbnail % 10]}
                            alt="footer ad"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      {/* Linear gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent z-10 pointer-events-none" />

                      {/* Texts */}
                      <div className="relative z-15 px-2.5 flex flex-col justify-center w-full max-w-[70%]">
                        <div className="flex items-center gap-1">
                          <span className="bg-[#ff1e1e] text-white text-[5px] font-black px-1 rounded uppercase">AD</span>
                          <span className="text-white/40 text-[5px] font-bold uppercase tracking-wider">&bull; ANCHORED</span>
                        </div>
                        <h4 className="text-white text-[7px] font-extrabold truncate uppercase leading-tight mt-0.5">{adTitle || 'Featured bottom campaign'}</h4>
                      </div>

                      {/* Mini Close Button */}
                      <div className="absolute top-1 right-1 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/50">
                        <span className="text-[6px]">×</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: 'Active Placement', value: 'ANCHORED FOOTER' },
                    { label: 'Target Size', value: '970×250 px' },
                    { label: 'Auto Rotate', value: '30s rotation enabled' },
                    { label: 'Redirect Link', value: adLink || '—' },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between rounded-lg bg-[#0a0a0a]/50 px-3 py-1.5 border border-white/5">
                      <span className="text-[9px] text-white/35 font-medium uppercase tracking-wider">{detail.label}</span>
                      <span className="text-[10px] font-bold text-white/80 truncate ml-2">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 3: PERFORMANCE GRAPH / PIE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 p-4 backdrop-blur-xl">
              <h2 className="mb-3 text-sm font-bold text-white">Creative Ratio</h2>
              <div className="h-44">
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                      {donutData.map((_entry, idx) => (
                        <Cell key={idx} fill={DONUT_COLORS[idx]} />
                      ))}
                    </Pie>
                    <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-xs font-bold">{totalFooterImpressions}</text>
                    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-white/30 text-[7px] uppercase font-bold">Impressions</text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>

        {/* FULL WIDTH TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="overflow-hidden rounded-xl border border-white/5 bg-[#111111]/80 backdrop-blur-xl"
        >
          <div className="p-3 lg:p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-white">Active Footer Campaigns</h2>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v) }}>
                  <SelectTrigger className="h-8 w-28 rounded-lg border-white/10 bg-[#0a0a0a] text-xs text-white/60 [&_svg]:text-white/30">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111111]">
                    <SelectItem value="all" className="text-xs text-white focus:bg-white/5">All Status</SelectItem>
                    <SelectItem value="active" className="text-xs text-white focus:bg-white/5">Active</SelectItem>
                    <SelectItem value="paused" className="text-xs text-white focus:bg-white/5">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                    <th className="pb-2 text-left">Creative Preview</th>
                    <th className="pb-2 text-left">Ad Name</th>
                    <th className="pb-2 text-left">Type</th>
                    <th className="pb-2 text-left">Placement</th>
                    <th className="pb-2 text-left">Size</th>
                    <th className="pb-2 text-left">Impressions</th>
                    <th className="pb-2 text-left">CTR</th>
                    <th className="pb-2 text-left">Revenue</th>
                    <th className="pb-2 text-left">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAds.map((ad, i) => (
                    <motion.tr key={ad.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5">
                        <div className="h-9 w-16 overflow-hidden rounded bg-black/60 border border-white/5">
                          <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = premiumPlaceholderImages[i % 10] }} />
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="text-xs font-semibold text-white group-hover:text-xtube-red transition-colors">{ad.title}</span>
                      </td>
                      <td className="py-2.5 text-xs text-white/45">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                          ad.type === 'Video' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {ad.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-white/40">{ad.placement}</td>
                      <td className="py-2.5 text-xs text-white/40">{ad.size}</td>
                      <td className="py-2.5 text-xs text-white/70">{ad.impressions}</td>
                      <td className="py-2.5 text-xs font-bold text-xtube-red">{ad.ctr}</td>
                      <td className="py-2.5 text-xs font-semibold text-emerald-400">{ad.revenue}</td>
                      <td className="py-2.5">
                        <button
                          onClick={() => toggleAdStatus(ad.id, ad.status !== 'Active')}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold transition-all hover:scale-105 active:scale-95 ${statusStyles[ad.status]}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${ad.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {ad.status}
                        </button>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => deleteAd(ad.id)}
                          className="rounded p-1 text-white/30 hover:bg-xtube-red/10 hover:text-xtube-red opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
