import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

type RouteContext = { params: Promise<{ courseId: string }> }

// Helper to get session ID
async function getSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('viewer_session')?.value

  if (!sessionId) {
    sessionId = crypto.randomUUID()
  }

  return sessionId
}

// GET - Get progress for a course
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseId } = await context.params
    const sessionId = await getSessionId()

    // Get course with total pages count
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        curriculums: {
          include: {
            _count: {
              select: { pages: true },
            },
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const totalPages = course.curriculums.reduce(
      (sum, c) => sum + c._count.pages,
      0
    )

    // Get user progress
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId: sessionId,
          courseId,
        },
      },
    })

    return NextResponse.json({
      completedPages: userProgress?.completedPages || [],
      lastPageId: userProgress?.lastPageId || null,
      progress: userProgress?.progress || 0,
      totalPages,
    })
  } catch (error) {
    console.error('Failed to get progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update progress (mark page as completed)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseId } = await context.params
    const sessionId = await getSessionId()
    const body = await request.json()
    const { pageId } = body

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID required' }, { status: 400 })
    }

    // Get total pages count
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        curriculums: {
          include: {
            _count: {
              select: { pages: true },
            },
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const totalPages = course.curriculums.reduce(
      (sum, c) => sum + c._count.pages,
      0
    )

    // Get or create progress
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_courseId: {
          userId: sessionId,
          courseId,
        },
      },
    })

    let completedPages: string[] = existingProgress?.completedPages || []

    // Add page if not already completed
    if (!completedPages.includes(pageId)) {
      completedPages = [...completedPages, pageId]
    }

    const progressValue = totalPages > 0
      ? (completedPages.length / totalPages) * 100
      : 0

    const userProgress = await prisma.userProgress.upsert({
      where: {
        userId_courseId: {
          userId: sessionId,
          courseId,
        },
      },
      update: {
        completedPages,
        lastPageId: pageId,
        progress: progressValue,
      },
      create: {
        userId: sessionId,
        courseId,
        completedPages,
        lastPageId: pageId,
        progress: progressValue,
      },
    })

    // Set cookie for session tracking
    const response = NextResponse.json({
      completedPages: userProgress.completedPages,
      lastPageId: userProgress.lastPageId,
      progress: userProgress.progress,
      totalPages,
    })

    response.cookies.set('viewer_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return response
  } catch (error) {
    console.error('Failed to update progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
