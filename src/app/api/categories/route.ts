import { db } from '@/lib/db'
import { broadcastRealtimeEvent } from '@/lib/realtime'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, icon, order = 0 } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        icon: icon || 'flame',
        order: parseInt(order, 10) || 0,
      },
    })

    // Broadcast the catalog change to all active clients in real-time
    broadcastRealtimeEvent('category:created', category)

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, slug, icon, order } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name,
        slug,
        icon,
        order: order !== undefined ? parseInt(order, 10) : undefined,
      },
    })

    // Broadcast update in real-time
    broadcastRealtimeEvent('category:updated', category)

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.category.delete({
      where: { id },
    })

    // Broadcast deletion in real-time
    broadcastRealtimeEvent('category:deleted', { id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
