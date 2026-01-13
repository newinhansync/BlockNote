'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, Trash2, User } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer/Drawer'

interface CommentAuthor {
  id: string
  name: string | null
  email: string
}

interface Comment {
  id: string
  content: string
  author: CommentAuthor
  createdAt: string
}

interface CommentDrawerProps {
  pageId: string
  isOpen: boolean
  onClose: () => void
  commentCount: number
  onCountChange?: (count: number) => void
}

export function CommentDrawer({
  pageId,
  isOpen,
  onClose,
  commentCount,
  onCountChange,
}: CommentDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [author, setAuthor] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, pageId])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/viewer/comments?pageId=${pageId}`)
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
    if (!newComment.trim() || !author.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/viewer/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          content: newComment.trim(),
          author: author.trim(),
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments([comment, ...comments])
        setNewComment('')
        onCountChange?.(commentCount + 1)
      }
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
        onCountChange?.(commentCount - 1)
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`댓글 ${commentCount > 0 ? `(${commentCount})` : ''}`}
      position="right"
      width="400px"
    >
      <div className="flex flex-col h-full">
        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="p-4 border-b space-y-3">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="이름"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim() || !author.trim()}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageCircle size={48} strokeWidth={1} />
              <p className="mt-2 text-sm">아직 댓글이 없습니다</p>
              <p className="text-xs">첫 번째 댓글을 남겨보세요!</p>
            </div>
          ) : (
            <div className="divide-y">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {comment.author.name || comment.author.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}

// Comment Button component for triggering the drawer
interface CommentButtonProps {
  count: number
  onClick: () => void
  size?: 'sm' | 'md'
}

export function CommentButton({ count, onClick, size = 'md' }: CommentButtonProps) {
  const sizeClasses = size === 'sm'
    ? 'gap-1 px-2 py-1 text-xs'
    : 'gap-1.5 px-3 py-1.5 text-sm'
  const iconSize = size === 'sm' ? 14 : 18

  return (
    <button
      onClick={onClick}
      className={`flex items-center rounded-full border border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:text-green-600 transition-all ${sizeClasses}`}
    >
      <MessageCircle size={iconSize} />
      <span className="font-medium">{count}</span>
    </button>
  )
}
