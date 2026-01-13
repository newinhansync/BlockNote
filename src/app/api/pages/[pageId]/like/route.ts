import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

type RouteContext = { params: Promise<{ pageId: string }> }

// Helper to get or create a session ID for anonymous users
async function getSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('viewer_session')?.value

  if (!sessionId) {
    sessionId = crypto.randomUUID()
  }

  return sessionId
}

// GET - Check like status
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { pageId } = await context.params
    const sessionId = await getSessionId()

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        likeCount: true,
        likes: {
          where: { userId: sessionId },
          select: { id: true },
        },
      },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({
      liked: page.likes.length > 0,
      count: page.likeCount,
    })
  } catch (error) {
    console.error('Failed to get like status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add like
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { pageId } = await context.params
    const sessionId = await getSessionId()

    // Check if already liked
    const existingLike = await prisma.pageLike.findUnique({
      where: {
        pageId_userId: {
          pageId,
          userId: sessionId,
        },
      },
    })

    if (existingLike) {
      const page = await prisma.page.findUnique({
        where: { id: pageId },
        select: { likeCount: true },
      })
      return NextResponse.json({
        liked: true,
        count: page?.likeCount || 0,
      })
    }

    // Create like and increment count in transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.pageLike.create({
        data: {
          pageId,
          userId: sessionId,
        },
      })

      const page = await tx.page.update({
        where: { id: pageId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      })

      return page
    })

    // Set cookie for session tracking
    const response = NextResponse.json({
      liked: true,
      count: result.likeCount,
    })

    response.cookies.set('viewer_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return response
  } catch (error) {
    console.error('Failed to add like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove like
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { pageId } = await context.params
    const sessionId = await getSessionId()

    // Check if like exists
    const existingLike = await prisma.pageLike.findUnique({
      where: {
        pageId_userId: {
          pageId,
          userId: sessionId,
        },
      },
    })

    if (!existingLike) {
      const page = await prisma.page.findUnique({
        where: { id: pageId },
        select: { likeCount: true },
      })
      return NextResponse.json({
        liked: false,
        count: page?.likeCount || 0,
      })
    }

    // Delete like and decrement count in transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.pageLike.delete({
        where: {
          pageId_userId: {
            pageId,
            userId: sessionId,
          },
        },
      })

      const page = await tx.page.update({
        where: { id: pageId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      })

      return page
    })

    return NextResponse.json({
      liked: false,
      count: Math.max(0, result.likeCount),
    })
  } catch (error) {
    console.error('Failed to remove like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
