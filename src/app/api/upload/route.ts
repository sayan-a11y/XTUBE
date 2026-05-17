import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { mkdirSync, existsSync, writeFileSync, readdirSync, readFileSync, unlinkSync, rmdirSync, createWriteStream } from 'fs'
import { join } from 'path'
import { broadcastRealtimeEvent } from '@/lib/realtime'
import { isR2Configured, initMultipartUpload, uploadPart, completeMultipartUpload, generateStorageKey, uploadLocalFileToR2 } from '@/lib/storage/r2-client'


// Constants
const CHUNKS_BASE_DIR = join(process.cwd(), 'upload', 'video-chunks')
const VIDEOS_DIR = join(process.cwd(), 'public', 'videos')
const DEFAULT_CHUNK_SIZE = 3 * 1024 * 1024 // 3MB (safe from 4MB payload limits)
const MIDROLL_INTERVAL_SECONDS = 1800 // 30 minutes

// Ensure directories exist
function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

// Generate midroll timings based on video duration (every 30 min)
function generateMidrollTimings(durationSeconds: number): number[] {
  if (durationSeconds < MIDROLL_INTERVAL_SECONDS) return []
  const timings: number[] = []
  for (let t = MIDROLL_INTERVAL_SECONDS; t < durationSeconds - 30; t += MIDROLL_INTERVAL_SECONDS) {
    timings.push(t)
  }
  return timings
}

/**
 * POST /api/upload — Initialize upload session OR finalize upload
 *
 * Initialize: { action: "init", fileName, fileSize, mimeType, chunkSize? }
 * Complete:   { action: "complete", sessionId }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isR2Configured()) {
      ensureDir(CHUNKS_BASE_DIR)
      ensureDir(VIDEOS_DIR)
    }

    const contentType = request.headers.get('content-type') || ''

    // Handle multipart form data for init
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const fileName = formData.get('fileName') as string
      const fileSize = parseInt(formData.get('fileSize') as string, 10)
      const mimeType = (formData.get('mimeType') as string) || 'video/mp4'
      const chunkSize = parseInt(formData.get('chunkSize') as string, 10) || DEFAULT_CHUNK_SIZE

      if (!fileName || !fileSize) {
        return NextResponse.json(
          { error: 'fileName and fileSize are required' },
          { status: 400 }
        )
      }

      const totalChunks = Math.ceil(fileSize / chunkSize)

      // Create upload session in DB
      const session = await db.uploadSession.create({
        data: {
          fileName,
          fileSize: BigInt(fileSize),
          mimeType,
          chunkSize,
          totalChunks,
          status: 'pending',
          uploadedChunks: '[]',
        },
      })

      // Create session directory
      const sessionDir = join(CHUNKS_BASE_DIR, session.id)
      ensureDir(sessionDir)

      // Generate presigned URLs for each chunk (mock URLs for local storage)
      const chunkUrls = Array.from({ length: totalChunks }, (_, i) => ({
        chunkIndex: i,
        uploadUrl: `/api/upload?chunkIndex=${i}&sessionId=${session.id}`,
        method: 'PUT',
      }))

      return NextResponse.json({
        sessionId: session.id,
        totalChunks,
        chunkSize,
        chunkUrls,
        status: 'pending',
      }, { status: 201 })
    }

    // Handle JSON body
    const body = await request.json()
    const { action } = body

    if (action === 'init') {
      const { fileName, fileSize, mimeType, chunkSize: customChunkSize } = body

      if (!fileName || fileSize === undefined || fileSize === null) {
        return NextResponse.json(
          { error: 'fileName and fileSize are required' },
          { status: 400 }
        )
      }

      const parsedFileSize = Math.round(Number(fileSize))
      if (isNaN(parsedFileSize) || parsedFileSize <= 0) {
        return NextResponse.json(
          { error: 'Invalid fileSize. Must be a positive integer.' },
          { status: 400 }
        )
      }

      const chunkSize = customChunkSize || DEFAULT_CHUNK_SIZE
      const totalChunks = Math.ceil(parsedFileSize / chunkSize)

      const useR2 = isR2Configured()
      let r2Key = ''

      if (useR2) {
        r2Key = generateStorageKey(fileName, 'video')
      }

      const session = await db.uploadSession.create({
        data: {
          fileName,
          fileSize: BigInt(parsedFileSize),
          mimeType: mimeType || 'video/mp4',
          chunkSize,
          totalChunks,
          status: 'pending',
          uploadedChunks: '[]',
          storageKey: useR2 ? JSON.stringify({ provider: 'r2', r2Key }) : null,
        },
      })

      // Always create local session directory to save incoming chunks
      const sessionDir = join(CHUNKS_BASE_DIR, session.id)
      ensureDir(sessionDir)

      const chunkUrls = Array.from({ length: totalChunks }, (_, i) => ({
        chunkIndex: i,
        uploadUrl: `/api/upload?chunkIndex=${i}&sessionId=${session.id}`,
        method: 'PUT',
      }))

      return NextResponse.json({
        sessionId: session.id,
        totalChunks,
        chunkSize,
        chunkUrls,
        status: 'pending',
      }, { status: 201 })
    }

    if (action === 'complete') {
      const { sessionId, title, description, category, duration, isHd, resolution } = body

      if (!sessionId) {
        return NextResponse.json(
          { error: 'sessionId is required' },
          { status: 400 }
        )
      }

      const session = await db.uploadSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        return NextResponse.json(
          { error: 'Upload session not found' },
          { status: 404 }
        )
      }

      const uploadedChunks: number[] = JSON.parse(session.uploadedChunks)

      if (uploadedChunks.length !== session.totalChunks) {
        return NextResponse.json(
          {
            error: 'Not all chunks uploaded yet',
            uploaded: uploadedChunks.length,
            total: session.totalChunks,
          },
          { status: 400 }
        )
      }

      // Update status to processing
      await db.uploadSession.update({
        where: { id: sessionId },
        data: { status: 'processing' },
      })

      // Check if we are running in R2 mode
      let isR2 = false
      let r2Key = ''
      if (session.storageKey) {
        try {
          const parsed = JSON.parse(session.storageKey)
          if (parsed.provider === 'r2') {
            isR2 = true
            r2Key = parsed.r2Key
          }
        } catch { /* ignore */ }
      }

      // Combine chunks into final video file locally using write streams to prevent V8 memory allocation crashes
      const sessionDir = join(CHUNKS_BASE_DIR, sessionId)
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      const finalPath = join(VIDEOS_DIR, `${videoId}.mp4`)
      ensureDir(VIDEOS_DIR)

      try {
        // Sort chunks by index and combine
        const sortedChunks = uploadedChunks.sort((a, b) => a - b)
        const writeStream = createWriteStream(finalPath)

        await new Promise<void>((resolve, reject) => {
          writeStream.on('error', reject)
          writeStream.on('finish', resolve)

          try {
            for (const chunkIndex of sortedChunks) {
              const chunkPath = join(sessionDir, `chunk_${chunkIndex}`)
              if (!existsSync(chunkPath)) {
                throw new Error(`Chunk ${chunkIndex} is missing from disk`)
              }
              const chunkData = readFileSync(chunkPath)
              writeStream.write(chunkData)
            }
            writeStream.end()
          } catch (err) {
            writeStream.destroy()
            reject(err)
          }
        })

        // Clean up chunks
        for (const chunkIndex of sortedChunks) {
          const chunkPath = join(sessionDir, `chunk_${chunkIndex}`)
          try { unlinkSync(chunkPath) } catch { /* ignore */ }
        }
        try { rmdirSync(sessionDir) } catch { /* ignore */ }

        // Estimate duration from file size (rough estimate: ~1MB per 10 sec for 1080p)
        const estimatedDuration = Math.round((Number(session.fileSize) / (1024 * 1024)) * 10)
        const midrollTimings = generateMidrollTimings(estimatedDuration)

        // Determine quality levels based on selected resolution, falling back to file size
        const qualityLevels = getQualityLevelsForResolution(resolution || '1080p', Number(session.fileSize))

        let finalVideoUrl = `/videos/${videoId}.mp4`
        let storageProvider = 'local'
        let storageKeyVal = `videos/${videoId}.mp4`

        if (isR2) {
          try {
            // Upload the combined local file to Cloudflare R2
            finalVideoUrl = await uploadLocalFileToR2(finalPath, r2Key, session.mimeType || 'video/mp4')
            storageProvider = 'r2'
            storageKeyVal = r2Key

            // Delete local assembled file after successful R2 upload
            try { unlinkSync(finalPath) } catch { /* ignore */ }
          } catch (r2UploadError) {
            console.error('R2 upload failed, falling back to local storage:', r2UploadError)
            finalVideoUrl = `/videos/${videoId}.mp4`
            storageProvider = 'local'
            storageKeyVal = `videos/${videoId}.mp4`
          }
        }

        // Create Video record
        const video = await db.video.create({
          data: {
            title: title || session.fileName.replace(/\.[^/.]+$/, ''), // Remove extension
            description: description || `Uploaded video: ${session.fileName}`,
            thumbnail: '/placeholder.jpg',
            videoUrl: finalVideoUrl,
            category: category || 'New Videos',
            duration: duration || formatDuration(estimatedDuration),
            durationSeconds: estimatedDuration,
            isHd: isHd !== undefined ? isHd : (qualityLevels.includes('1080p') || qualityLevels.includes('1440p') || qualityLevels.includes('2K') || qualityLevels.includes('4K') || qualityLevels.includes('2k') || qualityLevels.includes('4k')),
            qualityLevels: JSON.stringify(qualityLevels),
            midrollTimings: JSON.stringify(midrollTimings),
            thumbnailUrls: JSON.stringify([]),
            subtitleTracks: JSON.stringify([]),
            storageProvider,
            storageKey: storageKeyVal,
            fileSize: session.fileSize,
            resolution: resolution || '1080p',
          },
        })

        // Update session as completed
        await db.uploadSession.update({
          where: { id: sessionId },
          data: {
            status: 'completed',
            videoId: video.id,
            storageKey: storageKeyVal,
          },
        })

        // Serialize BigInt safely for JSON responses and broadcast events
        const serializedVideo = {
          ...video,
          fileSize: video.fileSize ? Number(video.fileSize) : null,
        }

        // Broadcast the new video in real-time
        broadcastRealtimeEvent('video:created', serializedVideo)

        return NextResponse.json({
          video: serializedVideo,
          videoUrl: finalVideoUrl,
          midrollTimings,
          qualityLevels,
        }, { status: 201 })
      } catch (combineError) {
        // Mark session as failed
        await db.uploadSession.update({
          where: { id: sessionId },
          data: { status: 'failed' },
        })
        throw combineError
      }
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "init" or "complete"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in upload POST:', error)
    return NextResponse.json(
      { error: 'Upload operation failed' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/upload — Upload a chunk
 *
 * Query: chunkIndex, sessionId
 * Body: chunk data (raw binary or form data)
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chunkIndex = parseInt(searchParams.get('chunkIndex') || '', 10)
    const sessionId = searchParams.get('sessionId')

    if (isNaN(chunkIndex) || !sessionId) {
      return NextResponse.json(
        { error: 'chunkIndex and sessionId query parameters are required' },
        { status: 400 }
      )
    }

    const session = await db.uploadSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Upload session not found' },
        { status: 404 }
      )
    }

    if (session.status === 'completed' || session.status === 'processing') {
      return NextResponse.json(
        { error: 'Upload session already completed or processing' },
        { status: 400 }
      )
    }

    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      return NextResponse.json(
        { error: `chunkIndex must be between 0 and ${session.totalChunks - 1}` },
        { status: 400 }
      )
    }

    // Read chunk data — support both raw binary and form data
    const contentType = request.headers.get('content-type') || ''
    let chunkData: Buffer

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const chunkFile = formData.get('chunk') as File | null
      if (!chunkFile) {
        return NextResponse.json(
          { error: 'No chunk file found in form data. Use "chunk" field name.' },
          { status: 400 }
        )
      }
      const arrayBuffer = await chunkFile.arrayBuffer()
      chunkData = Buffer.from(arrayBuffer)
    } else {
      // Raw binary
      const arrayBuffer = await request.arrayBuffer()
      chunkData = Buffer.from(arrayBuffer)
    }

    // Save chunk to disk (always local temp storage during upload phase)
    const sessionDir = join(CHUNKS_BASE_DIR, sessionId)
    ensureDir(sessionDir)
    const chunkPath = join(sessionDir, `chunk_${chunkIndex}`)
    writeFileSync(chunkPath, chunkData)

    const uploadedChunks: number[] = JSON.parse(session.uploadedChunks)
    if (!uploadedChunks.includes(chunkIndex)) {
      uploadedChunks.push(chunkIndex)
    }

    const newStatus = uploadedChunks.length === session.totalChunks ? 'uploading' : 'uploading'

    await db.uploadSession.update({
      where: { id: sessionId },
      data: {
        uploadedChunks: JSON.stringify(uploadedChunks.sort((a, b) => a - b)),
        status: newStatus,
      },
    })

    return NextResponse.json({
      sessionId,
      chunkIndex,
      received: true,
      uploadedChunks: uploadedChunks.length,
      totalChunks: session.totalChunks,
      progress: Math.round((uploadedChunks.length / session.totalChunks) * 100),
    })
  } catch (error) {
    console.error('Error in upload PUT:', error)
    return NextResponse.json(
      { error: 'Chunk upload failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload — Check upload progress
 *
 * Query: sessionId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      )
    }

    const session = await db.uploadSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Upload session not found' },
        { status: 404 }
      )
    }

    const uploadedChunks: number[] = JSON.parse(session.uploadedChunks)
    const progress = Math.round((uploadedChunks.length / session.totalChunks) * 100)

    return NextResponse.json({
      sessionId: session.id,
      fileName: session.fileName,
      fileSize: Number(session.fileSize),
      totalChunks: session.totalChunks,
      uploadedChunks: uploadedChunks.length,
      progress,
      status: session.status,
      videoId: session.videoId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    })
  } catch (error) {
    console.error('Error in upload GET:', error)
    return NextResponse.json(
      { error: 'Failed to get upload progress' },
      { status: 500 }
    )
  }
}

// ─── Helper Functions ────────────────────────────────────────────────

function getQualityLevelsForResolution(resolution: string, fileSize: number): string[] {
  const norm = resolution.toLowerCase().trim()
  if (norm === '4k') {
    return ['480p', '720p', '1080p', '1440p', '2K', '4K']
  }
  if (norm === '2k') {
    return ['480p', '720p', '1080p', '1440p', '2K']
  }
  if (norm === '1440p') {
    return ['480p', '720p', '1080p', '1440p']
  }
  if (norm === '1080p') {
    return ['480p', '720p', '1080p']
  }
  if (norm === '720p') {
    return ['480p', '720p']
  }
  if (norm === '480p') {
    return ['480p']
  }
  return determineQualityLevels(fileSize)
}

function determineQualityLevels(fileSize: number): string[] {
  const sizeMB = fileSize / (1024 * 1024)
  const levels: string[] = ['480p']

  if (sizeMB > 50) levels.push('720p')
  if (sizeMB > 200) levels.push('1080p')
  if (sizeMB > 1000) levels.push('2K')
  if (sizeMB > 5000) levels.push('4K')

  return levels
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
