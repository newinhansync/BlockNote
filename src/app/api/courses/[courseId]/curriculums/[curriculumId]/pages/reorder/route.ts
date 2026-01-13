import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteParams = { params: Promise<{ courseId: string; curriculumId: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { curriculumId } = await params
    const { pageIds } = await request.json()

    if (!Array.isArray(pageIds)) {
      return NextResponse.json(
        { error: 'pageIds must be an array' },
        { status: 400 }
      )
    }

    // Update order for each page
    await Promise.all(
      pageIds.map((id: string, index: number) =>
        prisma.page.update({
          where: { id, curriculumId },
          data: { order: index }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder pages:', error)
    return NextResponse.json(
      { error: 'Failed to reorder pages' },
      { status: 500 }
    )
  }
}
