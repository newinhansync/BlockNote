import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Viewer comments API - allows anonymous comments with guest name

// GET /api/viewer/comments?pageId=xxx - Get comments for a page
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pageId = searchParams.get('pageId')

    if (!pageId) {
      return NextResponse.json({ error: 'pageId가 필요합니다.' }, { status: 400 })
    }

    const comments = await prisma.comment.findMany({
      where: {
        pageId,
        parentId: null // Top-level comments only
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Viewer comments fetch error:', error)
    return NextResponse.json({ error: '댓글 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST /api/viewer/comments - Create anonymous comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageId, content, author: guestName } = body

    if (!pageId || !content || !guestName) {
      return NextResponse.json(
        { error: 'pageId, content, author가 필요합니다.' },
        { status: 400 }
      )
    }

    // Verify page exists
    const page = await prisma.page.findUnique({ where: { id: pageId } })
    if (!page) {
      return NextResponse.json({ error: '페이지를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Find or create guest user for anonymous comments
    let guestUser = await prisma.user.findFirst({
      where: { email: 'guest@viewer.local' }
    })

    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          email: 'guest@viewer.local',
          name: 'Guest',
          password: '', // No password for guest user
          role: 'VIEWER'
        }
      })
    }

    // Create comment with guest name stored for display
    const comment = await prisma.comment.create({
      data: {
        content,
        pageId,
        authorId: guestUser.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Transform response to show guest name
    const transformedComment = {
      ...comment,
      author: {
        ...comment.author,
        name: guestName
      }
    }

    return NextResponse.json(transformedComment, { status: 201 })
  } catch (error) {
    console.error('Viewer comment create error:', error)
    return NextResponse.json({ error: '댓글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
