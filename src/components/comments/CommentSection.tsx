'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, Trash2, Check, Reply, X } from 'lucide-react'

interface Author {
  id: string
  name: string | null
  email: string
}

interface Comment {
  id: string
  content: string
  resolved: boolean
  authorId: string
  author: Author
  replies: Comment[]
  createdAt: string
  updatedAt: string
}

interface CommentSectionProps {
  pageId: string
  currentUserId?: string
  isAdmin?: boolean
}

export function CommentSection({ pageId, currentUserId, isAdmin }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [pageId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?pageId=${pageId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, content: newComment })
      })

      if (response.ok) {
        setNewComment('')
        fetchComments()
      }
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, content: replyContent, parentId })
      })

      if (response.ok) {
        setReplyContent('')
        setReplyTo(null)
        fetchComments()
      }
    } catch (error) {
      console.error('Failed to post reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const handleResolve = async (commentId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: !resolved })
      })

      if (response.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error('Failed to update comment:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canModify = (authorId: string) => {
    return currentUserId === authorId || isAdmin
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        댓글 로딩 중...
      </div>
    )
  }

  return (
    <div className="border-t mt-8 pt-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <MessageSquare size={20} />
        피드백 ({comments.length})
      </h3>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="피드백을 남겨주세요..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
            등록
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            아직 피드백이 없습니다. 첫 번째 피드백을 남겨보세요!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border ${
                comment.resolved ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {comment.author.name || comment.author.email}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.resolved && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        해결됨
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="p-1 text-gray-400 hover:text-blue-500"
                    title="답글"
                  >
                    <Reply size={18} />
                  </button>
                  {canModify(comment.authorId) && (
                    <>
                      <button
                        onClick={() => handleResolve(comment.id, comment.resolved)}
                        className={`p-1 ${
                          comment.resolved
                            ? 'text-green-500 hover:text-gray-400'
                            : 'text-gray-400 hover:text-green-500'
                        }`}
                        title={comment.resolved ? '해결 취소' : '해결됨으로 표시'}
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {replyTo === comment.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답글을 입력하세요..."
                    className="flex-1 px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleReply(comment.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    답글
                  </button>
                  <button
                    onClick={() => {
                      setReplyTo(null)
                      setReplyContent('')
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 ml-6 space-y-2 border-l-2 border-gray-200 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="py-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {reply.author.name || reply.author.email}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{reply.content}</p>
                        </div>
                        {canModify(reply.authorId) && (
                          <button
                            onClick={() => handleDelete(reply.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
