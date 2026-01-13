import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma'
import { auth } from '@/lib/auth'

type RouteParams = { params: Promise<{ courseId: string; curriculumId: string }> }

// POST /api/courses/[courseId]/curriculums/[curriculumId]/duplicate - 커리큘럼 복제
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { courseId, curriculumId } = await params

    // Get the curriculum to duplicate with all pages
    const curriculum = await prisma.curriculum.findUnique({
      where: { id: curriculumId },
      include: {
        pages: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!curriculum) {
      return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 })
    }

    // Get max order for new curriculum
    const maxOrder = await prisma.curriculum.aggregate({
      where: { courseId },
      _max: { order: true },
    })

    // Create duplicated curriculum with pages
    const duplicatedCurriculum = await prisma.curriculum.create({
      data: {
        courseId,
        title: `${curriculum.title} (복사본)`,
        order: (maxOrder._max.order ?? -1) + 1,
        pages: {
          create: curriculum.pages.map((page) => ({
            title: page.title,
            content: page.content as Prisma.InputJsonValue,
            order: page.order,
            isPublished: false,
          })),
        },
      },
      include: {
        pages: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(duplicatedCurriculum)
  } catch (error) {
    console.error('Duplicate curriculum error:', error)
    return NextResponse.json({ error: '커리큘럼 복제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
