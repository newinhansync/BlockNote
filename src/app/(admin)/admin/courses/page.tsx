import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { DeleteCourseButton } from './DeleteCourseButton'

export const dynamic = 'force-dynamic'

async function getCourses() {
  return prisma.course.findMany({
    include: {
      _count: {
        select: { curriculums: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export default async function CoursesPage() {
  const courses = await getCourses()

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">콘텐츠 관리</h1>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          새 콘텐츠
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">등록된 콘텐츠가 없습니다.</p>
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            첫 콘텐츠 만들기
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">커리큘럼</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수정일</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/admin/courses/${course.id}`} className="text-blue-600 hover:underline font-medium">
                      {course.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                    {course.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {course._count.curriculums}개
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(course.updatedAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/viewer/courses/${course.id}`}
                        className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                        title="미리보기"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="편집"
                      >
                        <Edit size={18} />
                      </Link>
                      <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
