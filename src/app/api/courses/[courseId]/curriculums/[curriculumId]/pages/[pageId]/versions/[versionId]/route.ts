import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma'
import { auth } from '@/lib/auth'

type RouteParams = { params: Promise<{ courseId: string; curriculumId: string; pageId: string; versionId: string }> }

// GET /api/courses/.../pages/[pageId]/versions/[versionId] - 특정 버전 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { pageId, versionId } = await params

    const version = await prisma.pageVersion.findFirst({
      where: {
        id: versionId,
        pageId: pageId
      }
    })

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    return NextResponse.json(version)
  } catch (error) {
    console.error('Error fetching version:', error)
    return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 })
  }
}

// POST /api/courses/.../pages/[pageId]/versions/[versionId] - 특정 버전으로 롤백
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { pageId, versionId } = await params

    // Get the version to restore
    const version = await prisma.pageVersion.findFirst({
      where: {
        id: versionId,
        pageId: pageId
      }
    })

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Save current content as a new version before rollback
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

    // Update page with version content
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: { content: version.content as Prisma.InputJsonValue }
    })

    return NextResponse.json({
      page: updatedPage,
      message: '버전이 복원되었습니다.'
    })
  } catch (error) {
    console.error('Error restoring version:', error)
    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 })
  }
}

// DELETE /api/courses/.../pages/[pageId]/versions/[versionId] - 특정 버전 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { pageId, versionId } = await params

    await prisma.pageVersion.delete({
      where: {
        id: versionId,
        pageId: pageId
      }
    })

    return NextResponse.json({ success: true, message: '버전이 삭제되었습니다.' })
  } catch (error) {
    console.error('Error deleting version:', error)
    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 })
  }
}
