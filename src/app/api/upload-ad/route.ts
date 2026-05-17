import { NextRequest, NextResponse } from 'next/server'
import { generateStorageKey, uploadObject } from '@/lib/storage/r2-client'

export async function POST(request: NextRequest) {
  try {
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
