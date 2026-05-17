import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { mkdirSync, existsSync, writeFileSync, readdirSync, readFileSync, unlinkSync, rmdirSync, createWriteStream } from 'fs'
import { join } from 'path'
import { broadcastRealtimeEvent } from '@/lib/realtime'
import { isR2Configured, initMultipartUpload, uploadPart, completeMultipartUpload, generateStorageKey, uploadLocalFileToR2, getSignedUploadUrl, generatePresignedUrl } from '@/lib/storage/r2-client'

// Constants
const CHUNKS_BASE_DIR = join(process.cwd(), 'upload', 'video-chunks')
const VIDEOS_DIR = join(process.cwd(), 'public', 'videos')
const DEFAULT_CHUNK_SIZE = 6 * 1024 * 1024 // 6MB (satisfies Cloudflare R2 5MB minimum part size constraint)
const MIDROLL_INTERVAL_SECONDS = 1800 // 30 minutes

// Ensure directories exist
function ensureDir(dir: string) {
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  } catch (err) {
    console.error(`Failed to ensure directory ${dir}:`, err)
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
    const contentType = request.headers.get('content-type') || ''
    let body: any = {}

    // Support both JSON and form-data initialization
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      body = {
        action: 'init',
        fileName: formData.get('fileName') as string,
        fileSize: parseInt(formData.get('fileSize') as string, 10),
        mimeType: (formData.get('mimeType') as string) || 'video/mp4',
        chunkSize: parseInt(formData.get('chunkSize') as string, 10),
      }
    } else {
      body = await request.json()
    }

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

      // ─── CHECK FOR ACTIVE RESUMABLE SESSION ─────────────────────────────
      // If there is an active session for the same file (name & size) that is still pending or uploading,
      // and it was created in the last 24 hours, we can resume it!
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const existingSession = await db.uploadSession.findFirst({
        where: {
          fileName,
          fileSize: BigInt(parsedFileSize),
          status: { in: ['pending', 'uploading'] },
          createdAt: { gte: yesterday },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existingSession) {
        let isR2 = false
        let r2Key = ''
        let uploadId = ''
        try {
          const parsed = JSON.parse(existingSession.storageKey || '{}')
          if (parsed.provider === 'r2') {
            isR2 = true
            r2Key = parsed.r2Key
            uploadId = parsed.uploadId
          }
        } catch {}

        let parts: Array<{ partNumber: number; uploadUrl: string }> = []
        if (isR2 && uploadId && r2Key) {
          // Regenerate fresh, active presigned PUT URLs for all parts
          const MIN_PART_SIZE = 5 * 1024 * 1024
          const partCount = Math.max(1, Math.ceil(parsedFileSize / MIN_PART_SIZE))
          parts = Array.from({ length: partCount }, (_, i) => ({
            partNumber: i + 1,
            uploadUrl: generatePresignedUrl(r2Key, 'PUT', 3600, 'auto', 's3', {
              partNumber: String(i + 1),
              uploadId,
            }),
          }))
        }

        const completedParts = JSON.parse(existingSession.uploadedChunks || '[]')

        // Return the existing session to the client for instant resume!
        return NextResponse.json({
          sessionId: existingSession.id,
          totalChunks: existingSession.totalChunks,
          chunkSize: Number(existingSession.chunkSize),
          chunkUrls: uploadId ? [] : Array.from({ length: existingSession.totalChunks }, (_, i) => ({
            chunkIndex: i,
            uploadUrl: `/api/upload?chunkIndex=${i}&sessionId=${existingSession.id}`,
            method: 'PUT',
          })),
          parts,
          directUpload: !!uploadId,
          completedParts,
          resumed: true,
          status: existingSession.status,
        }, { status: 200 })
      }

      const useR2 = isR2Configured()
      let r2Key = ''
      let uploadId = ''
      let parts: Array<{ partNumber: number; uploadUrl: string }> = []

      if (useR2) {
        r2Key = generateStorageKey(fileName, 'video')
        try {
          // Initialize direct browser-to-R2 parallel chunk upload bypass!
          const initRes = await initMultipartUpload(
            r2Key,
            mimeType || 'video/mp4',
            parsedFileSize,
            'video',
            fileName
          )
          uploadId = initRes.uploadId
          parts = initRes.parts
        } catch (r2Error) {
          console.error('Failed to initialize R2 multipart upload, falling back to local chunks:', r2Error)
        }
      }

      const session = await db.uploadSession.create({
        data: {
          fileName,
          fileSize: BigInt(parsedFileSize),
          mimeType: mimeType || 'video/mp4',
          chunkSize: uploadId ? (5 * 1024 * 1024) : chunkSize,
          totalChunks: uploadId ? parts.length : totalChunks,
          status: 'pending',
          uploadedChunks: '[]',
          storageKey: JSON.stringify({
            provider: uploadId ? 'r2' : 'local',
            r2Key,
            uploadId,
          }),
        },
      })

      // Only create local session directory if using local fallback mode
      if (!uploadId) {
        ensureDir(CHUNKS_BASE_DIR)
        const sessionDir = join(CHUNKS_BASE_DIR, session.id)
        ensureDir(sessionDir)
      }

      // Generate local chunk routing URLs (which will be proxied to R2 in real-time or saved locally)
      const chunkUrls = uploadId ? [] : Array.from({ length: totalChunks }, (_, i) => ({
        chunkIndex: i,
        uploadUrl: `/api/upload?chunkIndex=${i}&sessionId=${session.id}`,
        method: 'PUT',
      }))

      return NextResponse.json({
        sessionId: session.id,
        totalChunks: uploadId ? parts.length : totalChunks,
        chunkSize: uploadId ? (5 * 1024 * 1024) : chunkSize,
        chunkUrls,
        parts: uploadId ? parts : [],
        directUpload: !!uploadId,
        status: 'pending',
      }, { status: 201 })
    }

    if (action === 'delete-session') {
      const { fileName, fileSize } = body
      if (!fileName || !fileSize) {
        return NextResponse.json({ error: 'fileName and fileSize are required' }, { status: 400 })
      }
      const parsedFileSize = Math.round(Number(fileSize))
      await db.uploadSession.deleteMany({
        where: {
          fileName,
          fileSize: BigInt(parsedFileSize),
        }
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'record-part') {
      const { sessionId, partNumber, etag } = body
      if (!sessionId || !partNumber || !etag) {
        return NextResponse.json(
          { error: 'sessionId, partNumber, and etag are required' },
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

      let uploadedChunksParsed: any[] = []
      try {
        uploadedChunksParsed = JSON.parse(session.uploadedChunks || '[]')
      } catch {
        uploadedChunksParsed = []
      }

      const filteredParts = uploadedChunksParsed.filter((p: any) => p && p.partNumber !== Number(partNumber))
      filteredParts.push({ partNumber: Number(partNumber), etag: String(etag).trim() })

      const sortedParts = filteredParts
        .filter((p: any) => p && typeof p === 'object' && p.partNumber && p.etag)
        .sort((a: any, b: any) => a.partNumber - b.partNumber)

      await db.uploadSession.update({
        where: { id: sessionId },
        data: {
          uploadedChunks: JSON.stringify(sortedParts),
          status: 'uploading',
        },
      })

      return NextResponse.json({ success: true, uploadedCount: sortedParts.length }, { status: 200 })
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

      // Check if we are running in R2 mode
      let isR2 = false
      let r2Key = ''
      let uploadId = ''
      if (session.storageKey) {
        try {
          const parsed = JSON.parse(session.storageKey)
          if (parsed.provider === 'r2') {
            isR2 = true
            r2Key = parsed.r2Key
            uploadId = parsed.uploadId
          }
        } catch { /* ignore */ }
      }

      // Update status to processing
      await db.uploadSession.update({
        where: { id: sessionId },
        data: { status: 'processing' },
      })

      let finalVideoUrl = ''
      let storageProvider = 'local'
      let storageKeyVal = ''
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

      // Estimate duration from file size (rough estimate: ~1MB per 10 sec for 1080p)
      const estimatedDuration = Math.round((Number(session.fileSize) / (1024 * 1024)) * 10)
      const midrollTimings = generateMidrollTimings(estimatedDuration)
      const qualityLevels = getQualityLevelsForResolution(resolution || '1080p', Number(session.fileSize))

      try {
        if (isR2 && uploadId === 'direct') {
          // Cloudflare R2 Direct Single Upload Complete (no multipart assembly needed)
          finalVideoUrl = process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL}/${r2Key}` : `/${r2Key}`
          storageProvider = 'r2'
          storageKeyVal = r2Key
        } else if (isR2 && uploadId) {
          // Cloudflare R2 Multipart Complete
          let uploadedParts = body.uploadedParts
          if (!uploadedParts || uploadedParts.length === 0) {
            try {
              uploadedParts = JSON.parse(session.uploadedChunks || '[]')
            } catch {
              uploadedParts = []
            }
          }

          // Clean, validate and sort the parts to avoid S3 validation/null errors
          const cleanedParts = (Array.isArray(uploadedParts) ? uploadedParts : [])
            .filter((p: any) => p && typeof p === 'object' && p.partNumber && p.etag)
            .map((p: any) => ({
              partNumber: Number(p.partNumber),
              etag: String(p.etag).trim()
            }))
            .sort((a: any, b: any) => a.partNumber - b.partNumber)

          if (cleanedParts.length === 0) {
            return NextResponse.json(
              { error: 'No uploaded parts found to complete multipart upload.' },
              { status: 400 }
            )
          }

          // Complete the multipart upload on Cloudflare R2 (R2 combines parts instantly)
          const completeResult = await completeMultipartUpload(r2Key, uploadId, cleanedParts)
          finalVideoUrl = completeResult.url
          storageProvider = 'r2'
          storageKeyVal = r2Key
        } else {
          // Local fallback — combine files on disk
          const uploadedChunks: number[] = JSON.parse(session.uploadedChunks || '[]')
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

          ensureDir(VIDEOS_DIR)
          const sessionDir = join(CHUNKS_BASE_DIR, sessionId)
          const finalPath = join(VIDEOS_DIR, `${videoId}.mp4`)

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

          // Clean up local chunks
          for (const chunkIndex of sortedChunks) {
            const chunkPath = join(sessionDir, `chunk_${chunkIndex}`)
            try { unlinkSync(chunkPath) } catch { /* ignore */ }
          }
          try { rmdirSync(sessionDir) } catch { /* ignore */ }

          finalVideoUrl = `/videos/${videoId}.mp4`
          storageProvider = 'local'
          storageKeyVal = `videos/${videoId}.mp4`
        }

        // Create Video record in Database
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
  } catch (error: any) {
    console.error('Error in upload POST:', error)
    try {
      const { appendFileSync } = require('fs')
      const { join } = require('path')
      appendFileSync(join(process.cwd(), 'upload_error.log'), `[${new Date().toISOString()}] POST error: ${error?.stack || error}\n`)
    } catch (e) {
      console.error('Failed to write POST error to log file:', e)
    }
    return NextResponse.json(
      { error: `Upload operation failed: ${error?.message || error}` },
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

    // Parse storage parameters
    let isR2 = false
    let uploadId = ''
    let r2Key = ''
    if (session.storageKey) {
      try {
        const parsed = JSON.parse(session.storageKey)
        if (parsed.provider === 'r2') {
          isR2 = true
          uploadId = parsed.uploadId
          r2Key = parsed.r2Key
        }
      } catch {}
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

    if (isR2 && uploadId) {
      // Cloudflare R2 chunk upload (proxied to R2 in real-time — stateless and serverless safe!)
      const partNumber = chunkIndex + 1
      const uploadResult = await uploadPart(r2Key, uploadId, partNumber, chunkData)

      // Store the etag in the database
      const uploadedChunksParsed = JSON.parse(session.uploadedChunks || '[]')
      // Remove any existing entry for this part index (for retry robustness)
      const filteredParts = uploadedChunksParsed.filter((p: any) => p.partNumber !== partNumber)
      filteredParts.push({ partNumber, etag: uploadResult.etag })

      await db.uploadSession.update({
        where: { id: sessionId },
        data: {
          uploadedChunks: JSON.stringify(filteredParts.sort((a: any, b: any) => a.partNumber - b.partNumber)),
          status: 'uploading',
        },
      })

      return NextResponse.json({
        sessionId,
        chunkIndex,
        received: true,
        uploadedChunks: filteredParts.length,
        totalChunks: session.totalChunks,
        progress: Math.round((filteredParts.length / session.totalChunks) * 100),
        etag: uploadResult.etag,
      })
    } else {
      // Local fallback mode — save chunk to local disk
      ensureDir(CHUNKS_BASE_DIR)
      const sessionDir = join(CHUNKS_BASE_DIR, sessionId)
      ensureDir(sessionDir)

      const chunkPath = join(sessionDir, `chunk_${chunkIndex}`)
      writeFileSync(chunkPath, chunkData)

      const uploadedChunksParsed = JSON.parse(session.uploadedChunks || '[]')
      if (!uploadedChunksParsed.includes(chunkIndex)) {
        uploadedChunksParsed.push(chunkIndex)
      }

      await db.uploadSession.update({
        where: { id: sessionId },
        data: {
          uploadedChunks: JSON.stringify(uploadedChunksParsed.sort((a: number, b: number) => a - b)),
          status: 'uploading',
        },
      })

      return NextResponse.json({
        sessionId,
        chunkIndex,
        received: true,
        uploadedChunks: uploadedChunksParsed.length,
        totalChunks: session.totalChunks,
        progress: Math.round((uploadedChunksParsed.length / session.totalChunks) * 100),
      })
    }
  } catch (error: any) {
    console.error('Error in upload PUT:', error)
    try {
      const { appendFileSync } = require('fs')
      const { join } = require('path')
      appendFileSync(join(process.cwd(), 'upload_error.log'), `[${new Date().toISOString()}] PUT error: ${error?.stack || error}\n`)
    } catch (e) {
      console.error('Failed to write PUT error to log file:', e)
    }
    return NextResponse.json(
      { error: `Chunk upload failed: ${error?.message || error}` },
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

    const uploadedChunks: any[] = JSON.parse(session.uploadedChunks || '[]')
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
  } catch (error: any) {
    console.error('Error in upload GET:', error)
    return NextResponse.json(
      { error: `Failed to get upload progress: ${error?.message || error}` },
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
