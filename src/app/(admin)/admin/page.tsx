import Link from 'next/link'
import { prisma } from '@/lib/db'
import { BookOpen, FileText, Layers } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getStats() {
  const [courseCount, curriculumCount, pageCount] = await Promise.all([
    prisma.course.count(),
    prisma.curriculum.count(),
    prisma.page.count(),
  ])
  return { courseCount, curriculumCount, pageCount }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">대시보드</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">전체 콘텐츠</p>
              <p className="text-2xl font-bold">{stats.courseCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Layers className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">전체 커리큘럼</p>
              <p className="text-2xl font-bold">{stats.curriculumCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">전체 페이지</p>
              <p className="text-2xl font-bold">{stats.pageCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">빠른 작업</h2>
        <div className="flex gap-4">
          <Link
            href="/admin/courses"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            콘텐츠 목록 보기
          </Link>
          <Link
            href="/admin/courses/new"
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
          >
            새 콘텐츠 만들기
          </Link>
        </div>
      </div>
    </div>
  )
}
