import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { mkdirSync, existsSync, writeFileSync, readdirSync, readFileSync, unlinkSync, rmdirSync, createWriteStream } from 'fs'
import { join } from 'path'
import { broadcastRealtimeEvent } from '@/lib/realtime'
import { isR2Configured, initMultipartUpload, uploadPart, completeMultipartUpload, generateStorageKey } from '@/lib/storage/r2-client'


// Constants
const CHUNKS_BASE_DIR = join(process.cwd(), 'upload', 'video-chunks')
const VIDEOS_DIR = join(process.cwd(), 'public', 'videos')
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
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

      if (!fileName || !fileSize) {
        return NextResponse.json(
          { error: 'fileName and fileSize are required' },
          { status: 400 }
        )
      }

      const chunkSize = customChunkSize || DEFAULT_CHUNK_SIZE
      const totalChunks = Math.ceil(fileSize / chunkSize)

      const useR2 = isR2Configured()
      let r2UploadId = ''
      let r2Key = ''

      if (useR2) {
        try {
          r2Key = generateStorageKey(fileName, 'video')
          const r2InitResult = await initMultipartUpload(
            r2Key,
            mimeType || 'video/mp4',
            fileSize,
            'video',
            fileName
          )
          r2UploadId = r2InitResult.uploadId
        } catch (r2InitError) {
          console.error('Failed to initialize R2 multipart upload, falling back to local:', r2InitError)
        }
      }

      const session = await db.uploadSession.create({
        data: {
          fileName,
          fileSize: BigInt(fileSize),
          mimeType: mimeType || 'video/mp4',
          chunkSize,
          totalChunks,
          status: 'pending',
          uploadedChunks: '[]',
          storageKey: r2UploadId ? JSON.stringify({ r2UploadId, r2Key, provider: 'r2', r2Parts: [] }) : null,
        },
      })

      if (!r2UploadId) {
        const sessionDir = join(CHUNKS_BASE_DIR, session.id)
        ensureDir(sessionDir)
      }

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
      let r2UploadId = ''
      let r2Key = ''
      let r2Parts: Array<{ partNumber: number; etag: string }> = []
      if (session.storageKey) {
        try {
          const parsed = JSON.parse(session.storageKey)
          if (parsed.provider === 'r2') {
            isR2 = true
            r2UploadId = parsed.r2UploadId
            r2Key = parsed.r2Key
            r2Parts = parsed.r2Parts || []
          }
        } catch { /* ignore */ }
      }

      if (isR2) {
        try {
          const completeResult = await completeMultipartUpload(r2Key, r2UploadId, r2Parts)
          
          const estimatedDuration = Math.round((Number(session.fileSize) / (1024 * 1024)) * 10)
          const midrollTimings = generateMidrollTimings(estimatedDuration)
          const qualityLevels = getQualityLevelsForResolution(resolution || '1080p', Number(session.fileSize))
          const finalVideoUrl = completeResult.url

          // Create Video record with R2 storage details
          const video = await db.video.create({
            data: {
              title: title || session.fileName.replace(/\.[^/.]+$/, ''),
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
              storageProvider: 'r2',
              storageKey: r2Key,
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
              storageKey: r2Key,
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
        } catch (r2CompleteError) {
          // Mark session as failed
          await db.uploadSession.update({
            where: { id: sessionId },
            data: { status: 'failed' },
          })
          throw r2CompleteError
        }
      } else {
        // Combine chunks into final video file using write streams to prevent V8 memory allocation crashes (supports up to 5GB)
        const sessionDir = join(CHUNKS_BASE_DIR, sessionId)
        const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
        const finalPath = join(VIDEOS_DIR, `${videoId}.mp4`)

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

          // Create Video record
          const video = await db.video.create({
            data: {
              title: title || session.fileName.replace(/\.[^/.]+$/, ''), // Remove extension
              description: description || `Uploaded video: ${session.fileName}`,
              thumbnail: '/placeholder.jpg',
              videoUrl: `/videos/${videoId}.mp4`,
              category: category || 'New Videos',
              duration: duration || formatDuration(estimatedDuration),
              durationSeconds: estimatedDuration,
              isHd: isHd !== undefined ? isHd : (qualityLevels.includes('1080p') || qualityLevels.includes('1440p') || qualityLevels.includes('2K') || qualityLevels.includes('4K') || qualityLevels.includes('2k') || qualityLevels.includes('4k')),
              qualityLevels: JSON.stringify(qualityLevels),
              midrollTimings: JSON.stringify(midrollTimings),
              thumbnailUrls: JSON.stringify([]),
              subtitleTracks: JSON.stringify([]),
              storageProvider: 'local',
              storageKey: `videos/${videoId}.mp4`,
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
              storageKey: `videos/${videoId}.mp4`,
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
            videoUrl: `/videos/${videoId}.mp4`,
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

    // Check if we are running in R2 mode
    let isR2 = false
    let r2UploadId = ''
    let r2Key = ''
    if (session.storageKey) {
      try {
        const parsed = JSON.parse(session.storageKey)
        if (parsed.provider === 'r2') {
          isR2 = true
          r2UploadId = parsed.r2UploadId
          r2Key = parsed.r2Key
        }
      } catch { /* ignore */ }
    }

    let etag = ''
    if (isR2) {
      // AWS S3 chunk index is 1-based, chunkIndex is 0-based, so partNumber is chunkIndex + 1
      const partNumber = chunkIndex + 1
      const uploadResult = await uploadPart(r2Key, r2UploadId, partNumber, chunkData)
      etag = uploadResult.etag
    } else {
      // Save chunk to disk (local mode)
      const sessionDir = join(CHUNKS_BASE_DIR, sessionId)
      ensureDir(sessionDir)
      const chunkPath = join(sessionDir, `chunk_${chunkIndex}`)
      writeFileSync(chunkPath, chunkData)
      etag = `"chunk-${chunkIndex}-${Date.now()}"`
    }

    // Update uploaded chunks in session
    let updatedStorageKey = session.storageKey
    if (isR2) {
      try {
        const parsed = JSON.parse(session.storageKey || '{}')
        const r2Parts = parsed.r2Parts || []
        const partNumber = chunkIndex + 1
        const existingIndex = r2Parts.findIndex((p: any) => p.partNumber === partNumber)
        if (existingIndex > -1) {
          r2Parts[existingIndex].etag = etag
        } else {
          r2Parts.push({ partNumber, etag })
        }
        parsed.r2Parts = r2Parts
        updatedStorageKey = JSON.stringify(parsed)
      } catch { /* ignore */ }
    }

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
        storageKey: updatedStorageKey,
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
