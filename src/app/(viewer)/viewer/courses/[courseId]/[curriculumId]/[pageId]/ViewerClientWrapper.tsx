'use client'

import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LikeButton } from '@/components/viewer/LikeButton'
import { CommentDrawer, CommentButton } from '@/components/viewer/CommentDrawer'

interface PageInfo {
  curriculumId: string
  page: {
    id: string
    title: string
  }
}

interface ViewerClientWrapperProps {
  courseId: string
  pageId: string
  likeCount: number
  commentCount: number
  prevPage: PageInfo | null
  nextPage: PageInfo | null
  children: ReactNode
}

export function ViewerClientWrapper({
  courseId,
  pageId,
  likeCount,
  commentCount: initialCommentCount,
  prevPage,
  nextPage,
  children,
}: ViewerClientWrapperProps) {
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(initialCommentCount)

  // Mark page as viewed for progress tracking
  useEffect(() => {
    const markPageViewed = async () => {
      try {
        await fetch(`/api/courses/${courseId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId }),
        })
      } catch (error) {
        console.error('Failed to update progress:', error)
      }
    }

    // Mark as viewed after 3 seconds on the page
    const timer = setTimeout(markPageViewed, 3000)

    return () => clearTimeout(timer)
  }, [courseId, pageId])

  return (
    <div className="relative min-h-screen">
      {children}

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t z-20">
        <div className="max-w-4xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Prev Button */}
            {prevPage ? (
              <Link
                href={`/viewer/courses/${courseId}/${prevPage.curriculumId}/${prevPage.page.id}`}
                className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-900 text-sm transition-colors"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline max-w-24 truncate">{prevPage.page.title}</span>
                <span className="sm:hidden">이전</span>
              </Link>
            ) : (
              <div className="w-16" />
            )}

            {/* Center Actions */}
            <div className="flex items-center gap-2">
              <LikeButton pageId={pageId} initialCount={likeCount} size="sm" />
              <CommentButton count={commentCount} onClick={() => setIsCommentDrawerOpen(true)} size="sm" />
            </div>

            {/* Next Button */}
            {nextPage ? (
              <Link
                href={`/viewer/courses/${courseId}/${nextPage.curriculumId}/${nextPage.page.id}`}
                className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-900 text-sm transition-colors"
              >
                <span className="hidden sm:inline max-w-24 truncate">{nextPage.page.title}</span>
                <span className="sm:hidden">다음</span>
                <ChevronRight size={14} />
              </Link>
            ) : (
              <Link
                href={`/viewer/courses/${courseId}`}
                className="flex items-center gap-1 px-2 py-1 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
              >
                완료
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Comment drawer */}
      <CommentDrawer
        pageId={pageId}
        isOpen={isCommentDrawerOpen}
        onClose={() => setIsCommentDrawerOpen(false)}
        commentCount={commentCount}
        onCountChange={setCommentCount}
      />
    </div>
  )
}
