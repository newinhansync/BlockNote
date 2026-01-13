import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteParams = { params: Promise<{ courseId: string; curriculumId: string }> }

// GET /api/courses/[courseId]/curriculums/[curriculumId] - 커리큘럼 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { curriculumId } = await params
    const curriculum = await prisma.curriculum.findUnique({
      where: { id: curriculumId },
      include: {
        pages: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!curriculum) {
      return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 })
    }

    return NextResponse.json(curriculum)
  } catch (error) {
    console.error('Error fetching curriculum:', error)
    return NextResponse.json({ error: 'Failed to fetch curriculum' }, { status: 500 })
  }
}

// PUT /api/courses/[courseId]/curriculums/[curriculumId] - 커리큘럼 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { curriculumId } = await params
    const body = await request.json()
    const { title, order } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const updateData: { title: string; order?: number } = { title: title.trim() }
    if (typeof order === 'number') {
      updateData.order = order
    }

    const curriculum = await prisma.curriculum.update({
      where: { id: curriculumId },
      data: updateData
    })

    return NextResponse.json(curriculum)
  } catch (error) {
    console.error('Error updating curriculum:', error)
    return NextResponse.json({ error: 'Failed to update curriculum' }, { status: 500 })
  }
}

// DELETE /api/courses/[courseId]/curriculums/[curriculumId] - 커리큘럼 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { curriculumId } = await params
    await prisma.curriculum.delete({
      where: { id: curriculumId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting curriculum:', error)
    return NextResponse.json({ error: 'Failed to delete curriculum' }, { status: 500 })
  }
}
