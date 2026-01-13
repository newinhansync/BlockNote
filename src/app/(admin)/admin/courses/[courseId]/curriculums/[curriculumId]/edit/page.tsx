import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { CurriculumForm } from '../../CurriculumForm'

type PageProps = { params: Promise<{ courseId: string; curriculumId: string }> }

async function getCurriculum(curriculumId: string) {
  return prisma.curriculum.findUnique({
    where: { id: curriculumId }
  })
}

export default async function EditCurriculumPage({ params }: PageProps) {
  const { courseId, curriculumId } = await params
  const curriculum = await getCurriculum(curriculumId)

  if (!curriculum) {
    notFound()
  }

  return (
    <div className="p-8">
      <Link
        href={`/admin/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={18} />
        콘텐츠로 돌아가기
      </Link>

      <h1 className="text-2xl font-bold mb-8">커리큘럼 수정</h1>
      <CurriculumForm courseId={courseId} curriculum={curriculum} />
    </div>
  )
}
