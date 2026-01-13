import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma'
import { auth } from '@/lib/auth'

type RouteParams = { params: Promise<{ courseId: string; curriculumId: string; pageId: string }> }

// POST /api/courses/.../pages/[pageId]/duplicate - 페이지 복제
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { curriculumId, pageId } = await params

    // Get the page to duplicate
    const page = await prisma.page.findUnique({
      where: { id: pageId },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Get max order for new page
    const maxOrder = await prisma.page.aggregate({
      where: { curriculumId },
      _max: { order: true },
    })

    // Create duplicated page
    const duplicatedPage = await prisma.page.create({
      data: {
        curriculumId,
        title: `${page.title} (복사본)`,
        content: page.content as Prisma.InputJsonValue,
        order: (maxOrder._max.order ?? -1) + 1,
        isPublished: false,
      },
    })

    return NextResponse.json(duplicatedPage)
  } catch (error) {
    console.error('Duplicate page error:', error)
    return NextResponse.json({ error: '페이지 복제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
