import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteParams = { params: Promise<{ courseId: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params
    const { curriculumIds } = await request.json()

    if (!Array.isArray(curriculumIds)) {
      return NextResponse.json(
        { error: 'curriculumIds must be an array' },
        { status: 400 }
      )
    }

    // Update order for each curriculum
    await Promise.all(
      curriculumIds.map((id: string, index: number) =>
        prisma.curriculum.update({
          where: { id, courseId },
          data: { order: index }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder curriculums:', error)
    return NextResponse.json(
      { error: 'Failed to reorder curriculums' },
      { status: 500 }
    )
  }
}
