import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteParams = { params: Promise<{ courseId: string; curriculumId: string }> }

// GET /api/courses/[courseId]/curriculums/[curriculumId]/pages - 페이지 목록 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { curriculumId } = await params
    const pages = await prisma.page.findMany({
      where: { curriculumId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    return NextResponse.json(pages)
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}

// POST /api/courses/[courseId]/curriculums/[curriculumId]/pages - 새 페이지 생성
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { curriculumId } = await params
    const body = await request.json()
    const { title, content } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // 현재 최대 order 값 가져오기
    const maxOrder = await prisma.page.aggregate({
      where: { curriculumId },
      _max: { order: true }
    })
    const newOrder = (maxOrder._max.order ?? -1) + 1

    const page = await prisma.page.create({
      data: {
        title: title.trim(),
        content: content || [],
        order: newOrder,
        curriculumId,
      }
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}
