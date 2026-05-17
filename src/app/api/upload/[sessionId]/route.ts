import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readdirSync, unlinkSync, rmdirSync } from 'fs'
import { join } from 'path'

const CHUNKS_BASE_DIR = join(process.cwd(), 'upload', 'video-chunks')

/**
 * GET /api/upload/[sessionId] — Get upload session status and progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

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
    const progress = session.totalChunks > 0
      ? Math.round((uploadedChunks.length / session.totalChunks) * 100)
      : 0

    // Check which chunks exist on disk
    const sessionDir = join(CHUNKS_BASE_DIR, sessionId)
    const diskChunks: number[] = []
    if (existsSync(sessionDir)) {
      const files = readdirSync(sessionDir)
      for (const file of files) {
        const match = file.match(/^chunk_(\d+)$/)
        if (match) {
          diskChunks.push(parseInt(match[1], 10))
        }
      }
    }

    return NextResponse.json({
      sessionId: session.id,
      fileName: session.fileName,
      fileSize: Number(session.fileSize),
      mimeType: session.mimeType,
      chunkSize: session.chunkSize,
      totalChunks: session.totalChunks,
      uploadedChunks: uploadedChunks.length,
      uploadedChunkIndices: uploadedChunks,
      diskChunks: diskChunks.sort((a, b) => a - b),
      progress,
      status: session.status,
      videoId: session.videoId,
      storageKey: session.storageKey,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching upload session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upload session' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload/[sessionId] — Cancel and cleanup upload session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    const session = await db.uploadSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Upload session not found' },
        { status: 404 }
      )
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete a completed upload session' },
        { status: 400 }
      )
    }

    // Clean up chunk files from disk
    const sessionDir = join(CHUNKS_BASE_DIR, sessionId)
    if (existsSync(sessionDir)) {
      const files = readdirSync(sessionDir)
      for (const file of files) {
        const filePath = join(sessionDir, file)
        try {
          unlinkSync(filePath)
        } catch {
          // Ignore individual file deletion errors
        }
      }
      try {
        rmdirSync(sessionDir)
      } catch {
        // Ignore directory deletion error
      }
    }

    // Delete the session from database
    await db.uploadSession.delete({
      where: { id: sessionId },
    })

    return NextResponse.json({
      success: true,
      message: 'Upload session cancelled and cleaned up',
      sessionId,
    })
  } catch (error) {
    console.error('Error deleting upload session:', error)
    return NextResponse.json(
      { error: 'Failed to delete upload session' },
      { status: 500 }
    )
  }
}
