'use client'

import dynamic from 'next/dynamic'

const XtubeHomeClient = dynamic(
  () => import('@/components/streaming/XtubeHomeClient').then((m) => m.XtubeHomeClient),
  { ssr: false }
)

export default function Page() {
  return <XtubeHomeClient />
}
