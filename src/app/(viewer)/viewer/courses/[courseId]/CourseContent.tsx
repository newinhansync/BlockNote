'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, ChevronRight } from 'lucide-react'
import { useProgress } from './CourseProgressWrapper'

interface Curriculum {
  id: string
  title: string
  pages: {
    id: string
    title: string
    order: number
  }[]
}

interface Course {
  id: string
  title: string
  description: string | null
  curriculums: Curriculum[]
}

interface CourseContentProps {
  course: Course
  totalPages: number
  firstPageId?: string
  firstCurriculumId?: string
}

export function CourseContent({
  course,
  totalPages,
  firstPageId,
  firstCurriculumId,
}: CourseContentProps) {
  const { completedPages, progress } = useProgress()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/viewer"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={18} />
        콘텐츠 목록으로
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
        {course.description && (
          <p className="text-gray-500">{course.description}</p>
        )}

        {/* Progress indicator */}
        {totalPages > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">
              {completedPages.length} / {totalPages} 완료 ({Math.round(progress)}%)
            </span>
          </div>
        )}
      </div>

      {firstPageId && firstCurriculumId && (
        <div className="mb-8">
          <Link
            href={`/viewer/courses/${course.id}/${firstCurriculumId}/${firstPageId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {completedPages.length > 0 ? '이어서 학습하기' : '학습 시작하기'}
            <ChevronRight size={18} />
          </Link>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold">커리큘럼</h2>
        </div>

        {course.curriculums.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            등록된 커리큘럼이 없습니다.
          </div>
        ) : (
          <div className="divide-y">
            {course.curriculums.map((curriculum, index) => (
              <div key={curriculum.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-gray-400">Chapter {index + 1}</span>
                  <h3 className="font-medium">{curriculum.title}</h3>
                </div>

                {curriculum.pages.length === 0 ? (
                  <p className="text-sm text-gray-400 pl-4">페이지가 없습니다.</p>
                ) : (
                  <ul className="pl-4 space-y-1">
                    {curriculum.pages.map((page, pageIndex) => {
                      const isCompleted = completedPages.includes(page.id)
                      return (
                        <li key={page.id}>
                          <Link
                            href={`/viewer/courses/${course.id}/${curriculum.id}/${page.id}`}
                            className={`flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-50 transition-colors ${
                              isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {isCompleted ? (
                              <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                            ) : (
                              <FileText size={16} className="text-gray-400" />
                            )}
                            <span className="text-sm text-gray-400">{pageIndex + 1}.</span>
                            <span className={isCompleted ? 'text-green-600' : ''}>{page.title}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
