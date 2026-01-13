import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteParams = { params: Promise<{ courseId: string }> }

// GET /api/courses/[courseId]/curriculums - 커리큘럼 목록 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params
    const curriculums = await prisma.curriculum.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { pages: true }
        }
      }
    })
    return NextResponse.json(curriculums)
  } catch (error) {
    console.error('Error fetching curriculums:', error)
    return NextResponse.json({ error: 'Failed to fetch curriculums' }, { status: 500 })
  }
}

// POST /api/courses/[courseId]/curriculums - 새 커리큘럼 생성
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params
    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // 현재 최대 order 값 가져오기
    const maxOrder = await prisma.curriculum.aggregate({
      where: { courseId },
      _max: { order: true }
    })
    const newOrder = (maxOrder._max.order ?? -1) + 1

    const curriculum = await prisma.curriculum.create({
      data: {
        title: title.trim(),
        order: newOrder,
        courseId,
      }
    })

    return NextResponse.json(curriculum, { status: 201 })
  } catch (error) {
    console.error('Error creating curriculum:', error)
    return NextResponse.json({ error: 'Failed to create curriculum' }, { status: 500 })
  }
}
