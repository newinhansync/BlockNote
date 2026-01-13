import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Plus, BookOpen, Calendar, FileText, Check, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getCourses() {
  return prisma.course.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          curriculums: true,
        },
      },
      curriculums: {
        include: {
          _count: {
            select: {
              pages: true,
            },
          },
        },
      },
    },
  })
}

export default async function ContentsListPage() {
  const courses = await getCourses()

  // Calculate total pages for each course
  const coursesWithPageCount = courses.map((course) => ({
    ...course,
    totalPages: course.curriculums.reduce((sum, c) => sum + c._count.pages, 0),
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
          <p className="text-gray-500 mt-1">
            콘텐츠를 생성하고 관리하세요
          </p>
        </div>
        <Link
          href="/admin/contents/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          새 콘텐츠
        </Link>
      </div>

      {/* Content Grid */}
      {coursesWithPageCount.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            콘텐츠가 없습니다
          </h2>
          <p className="text-gray-500 mb-6">
            첫 번째 콘텐츠를 만들어 시작하세요
          </p>
          <Link
            href="/admin/contents/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            새 콘텐츠 만들기
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coursesWithPageCount.map((course) => (
            <Link
              key={course.id}
              href={`/admin/contents/${course.id}`}
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              {/* Title */}
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 truncate">
                {course.title}
              </h3>

              {/* Description */}
              {course.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {course.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {course._count.curriculums} 챕터
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={14} />
                  {course.totalPages} 페이지
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {/* Publish Status */}
                <span
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    course.isPublished
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {course.isPublished ? (
                    <>
                      <Check size={12} />
                      게시됨
                    </>
                  ) : (
                    <>
                      <Clock size={12} />
                      초안
                    </>
                  )}
                </span>

                {/* Updated Date */}
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={12} />
                  {new Date(course.updatedAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
