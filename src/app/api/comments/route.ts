import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/comments?pageId=xxx - 페이지의 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const pageId = searchParams.get('pageId')

    if (!pageId) {
      return NextResponse.json({ error: 'pageId가 필요합니다.' }, { status: 400 })
    }

    const comments = await prisma.comment.findMany({
      where: {
        pageId,
        parentId: null // 최상위 댓글만 조회
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
    console.error('Comments fetch error:', error)
    return NextResponse.json({ error: '댓글 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST /api/comments - 새 댓글 작성
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { pageId, content, parentId } = body

    if (!pageId || !content) {
      return NextResponse.json({ error: 'pageId와 content가 필요합니다.' }, { status: 400 })
    }

    // 페이지 존재 확인
    const page = await prisma.page.findUnique({ where: { id: pageId } })
    if (!page) {
      return NextResponse.json({ error: '페이지를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 부모 댓글 확인 (대댓글인 경우)
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } })
      if (!parentComment) {
        return NextResponse.json({ error: '부모 댓글을 찾을 수 없습니다.' }, { status: 404 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        pageId,
        authorId: session.user.id,
        parentId: parentId || null
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

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Comment create error:', error)
    return NextResponse.json({ error: '댓글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
