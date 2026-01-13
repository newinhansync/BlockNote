import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

type RouteParams = { params: Promise<{ commentId: string }> }

// PATCH /api/comments/[commentId] - 댓글 수정 또는 해결 상태 변경
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { commentId } = await params
    const body = await request.json()
    const { content, resolved } = body

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 본인 댓글이거나 관리자만 수정 가능
    if (comment.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const updateData: { content?: string; resolved?: boolean } = {}
    if (content !== undefined) updateData.content = content
    if (resolved !== undefined) updateData.resolved = resolved

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: updateData,
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

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Comment update error:', error)
    return NextResponse.json({ error: '댓글 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// DELETE /api/comments/[commentId] - 댓글 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { commentId } = await params

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 본인 댓글이거나 관리자만 삭제 가능
    if (comment.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Comment delete error:', error)
    return NextResponse.json({ error: '댓글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
