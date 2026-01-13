import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma'
import { auth } from '@/lib/auth'

type RouteParams = { params: Promise<{ courseId: string }> }

// POST /api/courses/[courseId]/publish - 콘텐츠 게시
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { courseId } = await params

    // Get course with all pages
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        curriculums: {
          include: {
            pages: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const now = new Date()

    // Update all pages: copy content to publishedContent
    const pageUpdates = course.curriculums.flatMap((curriculum) =>
      curriculum.pages.map((page) =>
        prisma.page.update({
          where: { id: page.id },
          data: {
            isPublished: true,
            publishedContent: page.content as Prisma.InputJsonValue,
            publishedAt: now,
          },
        })
      )
    )

    // Update course publish status
    const courseUpdate = prisma.course.update({
      where: { id: courseId },
      data: {
        isPublished: true,
        publishedAt: now,
      },
    })

    // Execute all updates in a transaction
    await prisma.$transaction([...pageUpdates, courseUpdate])

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 게시되었습니다.',
      publishedAt: now,
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: '게시 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
