import Link from 'next/link'
import { prisma } from '@/lib/db'
import { BookOpen, Layers, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getCourses() {
  return prisma.course.findMany({
    include: {
      _count: {
        select: { curriculums: true }
      },
      curriculums: {
        include: {
          _count: {
            select: { pages: true }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export default async function ViewerPage() {
  const courses = await getCourses()

  const getTotalPages = (course: typeof courses[0]) => {
    return course.curriculums.reduce((acc, c) => acc + c._count.pages, 0)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">콘텐츠 목록</h1>

      {courses.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">등록된 콘텐츠가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/viewer/courses/${course.id}`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BookOpen className="text-green-600" size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-lg mb-2">{course.title}</h2>
                  {course.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Layers size={14} />
                      {course._count.curriculums}개 챕터
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {getTotalPages(course)}개 페이지
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
