import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Edit, Plus, ArrowLeft } from 'lucide-react'
import { DeleteCourseButton } from '../DeleteCourseButton'
import { SortableCurriculumList } from '@/components/admin/SortableCurriculumList'
import { ExportButton } from '@/components/admin/ExportButton'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ courseId: string }> }

async function getCourse(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      curriculums: {
        orderBy: { order: 'asc' },
        include: {
          pages: {
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  })
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params
  const course = await getCourse(courseId)

  if (!course) {
    notFound()
  }

  return (
    <div className="p-8">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={18} />
        콘텐츠 목록으로
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
          {course.description && (
            <p className="text-gray-500">{course.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <ExportButton courseId={course.id} courseTitle={course.title} />
          <Link
            href={`/admin/courses/${course.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Edit size={18} />
            수정
          </Link>
          <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">커리큘럼</h2>
        <Link
          href={`/admin/courses/${course.id}/curriculums/new`}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          커리큘럼 추가
        </Link>
      </div>

      {course.curriculums.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">등록된 커리큘럼이 없습니다.</p>
          <Link
            href={`/admin/courses/${course.id}/curriculums/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <Plus size={18} />
            첫 커리큘럼 만들기
          </Link>
        </div>
      ) : (
        <SortableCurriculumList
          courseId={course.id}
          initialCurriculums={course.curriculums}
        />
      )}
    </div>
  )
}
