import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma'

type RouteParams = { params: Promise<{ courseId: string; curriculumId: string; pageId: string }> }

// GET /api/courses/[courseId]/curriculums/[curriculumId]/pages/[pageId] - 페이지 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { pageId } = await params
    const page = await prisma.page.findUnique({
      where: { id: pageId }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
  }
}

// PUT /api/courses/[courseId]/curriculums/[curriculumId]/pages/[pageId] - 페이지 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { pageId } = await params
    const body = await request.json()
    const { title, content, order, saveVersion } = body

    // If saveVersion is true, save current content as a version before updating
    if (saveVersion && content !== undefined) {
      const currentPage = await prisma.page.findUnique({
        where: { id: pageId },
        select: { content: true }
      })

      if (currentPage && currentPage.content) {
        await prisma.pageVersion.create({
          data: {
            pageId,
            content: currentPage.content as Prisma.InputJsonValue
          }
        })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    if (title && typeof title === 'string') {
      updateData.title = title.trim()
    }

    if (content !== undefined) {
      updateData.content = content
    }

    if (typeof order === 'number') {
      updateData.order = order
    }

    const page = await prisma.page.update({
      where: { id: pageId },
      data: updateData
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
  }
}

// DELETE /api/courses/[courseId]/curriculums/[curriculumId]/pages/[pageId] - 페이지 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { pageId } = await params
    await prisma.page.delete({
      where: { id: pageId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
}
