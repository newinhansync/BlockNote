import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

type RouteParams = { params: Promise<{ courseId: string; curriculumId: string; pageId: string }> }

// PUT /api/courses/.../pages/[pageId]/move - 페이지를 다른 커리큘럼으로 이동
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { pageId } = await params
    const body = await request.json()
    const { toCurriculumId } = body

    if (!toCurriculumId) {
      return NextResponse.json({ error: 'toCurriculumId is required' }, { status: 400 })
    }

    // Verify page exists
    const page = await prisma.page.findUnique({
      where: { id: pageId },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Verify target curriculum exists
    const targetCurriculum = await prisma.curriculum.findUnique({
      where: { id: toCurriculumId },
    })

    if (!targetCurriculum) {
      return NextResponse.json({ error: 'Target curriculum not found' }, { status: 404 })
    }

    // Get max order in target curriculum
    const maxOrder = await prisma.page.aggregate({
      where: { curriculumId: toCurriculumId },
      _max: { order: true },
    })

    // Move the page
    const movedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        curriculumId: toCurriculumId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    })

    return NextResponse.json(movedPage)
  } catch (error) {
    console.error('Move page error:', error)
    return NextResponse.json({ error: '페이지 이동 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
