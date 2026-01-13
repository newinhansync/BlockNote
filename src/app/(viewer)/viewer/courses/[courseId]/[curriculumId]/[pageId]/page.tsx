import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ChevronLeft, ChevronRight, List } from 'lucide-react'
import { PageContentViewer } from '@/components/editor/PageContentViewer'
import type { Block } from '@blocknote/core'
import { ViewerClientWrapper } from './ViewerClientWrapper'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ courseId: string; curriculumId: string; pageId: string }> }

async function getPageWithNavigation(courseId: string, curriculumId: string, pageId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      curriculums: {
        orderBy: { order: 'asc' },
        include: {
          pages: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              content: true,
              publishedContent: true,
              isPublished: true,
              likeCount: true,
              order: true,
            }
          }
        }
      }
    }
  })

  if (!course) return null

  // 현재 페이지 찾기
  let currentPage = null
  let prevPage = null
  let nextPage = null
  let currentCurriculum = null

  // 모든 페이지를 평면 배열로 만들기
  const allPages: { curriculumId: string; page: typeof course.curriculums[0]['pages'][0] }[] = []
  for (const curriculum of course.curriculums) {
    for (const page of curriculum.pages) {
      allPages.push({ curriculumId: curriculum.id, page })
    }
  }

  // 현재 페이지 인덱스 찾기
  const currentIndex = allPages.findIndex(p => p.page.id === pageId)
  if (currentIndex === -1) return null

  currentPage = allPages[currentIndex].page
  currentCurriculum = course.curriculums.find(c => c.id === curriculumId)

  if (currentIndex > 0) {
    prevPage = allPages[currentIndex - 1]
  }
  if (currentIndex < allPages.length - 1) {
    nextPage = allPages[currentIndex + 1]
  }

  // Get comment count
  const commentCount = await prisma.comment.count({
    where: { pageId }
  })

  return {
    course,
    currentPage,
    currentCurriculum,
    prevPage,
    nextPage,
    currentIndex,
    totalPages: allPages.length,
    commentCount,
  }
}

export default async function ViewerPagePage({ params }: PageProps) {
  const { courseId, curriculumId, pageId } = await params
  const data = await getPageWithNavigation(courseId, curriculumId, pageId)

  if (!data) {
    notFound()
  }

  const { course, currentPage, currentCurriculum, prevPage, nextPage, currentIndex, totalPages, commentCount } = data

  // Use published content if available, otherwise fall back to draft content
  const displayContent = currentPage.publishedContent || currentPage.content

  return (
    <ViewerClientWrapper
      courseId={courseId}
      pageId={pageId}
      likeCount={currentPage.likeCount}
      commentCount={commentCount}
      prevPage={prevPage}
      nextPage={nextPage}
    >
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Minimal Top navigation */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-3 py-1.5 flex items-center justify-between">
            <Link
              href={`/viewer/courses/${courseId}`}
              className="p-1 text-gray-500 hover:text-gray-900 transition-colors"
              title="목차"
            >
              <List size={16} />
            </Link>

            <div className="text-xs text-gray-400">
              {currentIndex + 1} / {totalPages}
            </div>

            <div className="flex gap-0.5">
              {prevPage ? (
                <Link
                  href={`/viewer/courses/${courseId}/${prevPage.curriculumId}/${prevPage.page.id}`}
                  className="p-1 text-gray-500 hover:text-gray-900 transition-colors"
                  title="이전"
                >
                  <ChevronLeft size={16} />
                </Link>
              ) : (
                <span className="p-1 text-gray-200">
                  <ChevronLeft size={16} />
                </span>
              )}
              {nextPage ? (
                <Link
                  href={`/viewer/courses/${courseId}/${nextPage.curriculumId}/${nextPage.page.id}`}
                  className="p-1 text-gray-500 hover:text-gray-900 transition-colors"
                  title="다음"
                >
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="p-1 text-gray-200">
                  <ChevronRight size={16} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 pb-24">
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-0.5">{currentCurriculum?.title}</p>
            <h1 className="text-xl font-semibold text-gray-900">{currentPage.title}</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 min-h-64">
            <PageContentViewer content={displayContent as Block[]} />
          </div>
        </div>
      </div>
    </ViewerClientWrapper>
  )
}
