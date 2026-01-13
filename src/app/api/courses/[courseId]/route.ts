import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteParams = { params: Promise<{ courseId: string }> }

// GET /api/courses/[courseId] - 콘텐츠 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        curriculums: {
          orderBy: { order: 'asc' },
          include: {
            pages: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

// PUT /api/courses/[courseId] - 콘텐츠 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params
    const body = await request.json()
    const { title, description } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      }
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

// DELETE /api/courses/[courseId] - 콘텐츠 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params
    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
