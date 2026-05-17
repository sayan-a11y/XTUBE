import { NextRequest, NextResponse } from 'next/server'
import { generateStorageKey, uploadObject, isR2Configured, getSignedUploadUrl } from '@/lib/storage/r2-client'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    // Support JSON initialization for direct browser-to-R2 upload bypass
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { action, fileName, fileType, category = 'ad' } = body

      if (action === 'init' && isR2Configured()) {
        const storageKey = generateStorageKey(fileName, category)
        const signedRes = await getSignedUploadUrl(storageKey, 3600)
        
        const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''
        const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${storageKey}` : `/${storageKey}`

        return NextResponse.json({
          direct: true,
          uploadUrl: signedRes.url,
          key: storageKey,
          publicUrl
        })
      }
    }

    // Standard fallback for multipart/form-data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoryInput = formData.get('category') as string || 'ad'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const storageKey = generateStorageKey(file.name, categoryInput as any)
    const fileUrl = await uploadObject(storageKey, buffer, file.type)

    return NextResponse.json({
      url: fileUrl,
      key: storageKey,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error('Ad media upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload ad media' }, { status: 500 })
  }
}

