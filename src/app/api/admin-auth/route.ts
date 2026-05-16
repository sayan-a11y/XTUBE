import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Hardcoded admin credentials for development
const ADMIN_EMAIL = 'admin@xtube.com'
const ADMIN_PASSWORD = 'xtube2024'

function generateToken(): string {
  // Simple UUID-like token generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken()

    // Set expiry to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Save session to database
    await db.adminSession.create({
      data: {
        email,
        token,
        isActive: true,
        expiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      token,
      admin: { email },
    })
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
