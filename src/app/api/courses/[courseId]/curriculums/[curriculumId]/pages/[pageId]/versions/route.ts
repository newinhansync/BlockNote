import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma'
import { auth } from '@/lib/auth'

type RouteParams = { params: Promise<{ courseId: string; curriculumId: string; pageId: string }> }

// GET /api/courses/[courseId]/curriculums/[curriculumId]/pages/[pageId]/versions - 버전 목록 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { pageId } = await params

    // Verify page exists
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, title: true }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Get all versions for this page, ordered by creation date (newest first)
    const versions = await prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        content: true
      }
    })

    return NextResponse.json({
      page: {
        id: page.id,
        title: page.title
      },
      versions: versions.map((v, index) => ({
        id: v.id,
        createdAt: v.createdAt,
        versionNumber: versions.length - index,
        contentPreview: getContentPreview(v.content)
      })),
      totalVersions: versions.length
    })
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}

// POST /api/courses/[courseId]/curriculums/[curriculumId]/pages/[pageId]/versions - 현재 버전 저장
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { pageId } = await params

    // Get current page content
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { content: true }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Create a new version with current content
    const version = await prisma.pageVersion.create({
      data: {
        pageId,
        content: page.content as Prisma.InputJsonValue
      }
    })

    return NextResponse.json({
      id: version.id,
      createdAt: version.createdAt,
      message: '버전이 저장되었습니다.'
    })
  } catch (error) {
    console.error('Error saving version:', error)
    return NextResponse.json({ error: 'Failed to save version' }, { status: 500 })
  }
}

// Helper function to get a preview of content
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getContentPreview(content: any): string {
  try {
    if (!Array.isArray(content)) return ''

    // Extract text from first few blocks
    const textParts: string[] = []
    for (const block of content.slice(0, 3)) {
      if (block.content && Array.isArray(block.content)) {
        for (const item of block.content) {
          if (item.type === 'text' && item.text) {
            textParts.push(item.text)
          }
        }
      }
    }

    const preview = textParts.join(' ').slice(0, 100)
    return preview.length === 100 ? preview + '...' : preview
  } catch {
    return ''
  }
}
