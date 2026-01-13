import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageForm } from '../PageForm'

type PageProps = { params: Promise<{ courseId: string; curriculumId: string }> }

export default async function NewPagePage({ params }: PageProps) {
  const { courseId, curriculumId } = await params

  return (
    <div className="p-8">
      <Link
        href={`/admin/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={18} />
        콘텐츠로 돌아가기
      </Link>

      <h1 className="text-2xl font-bold mb-8">새 페이지 만들기</h1>
      <PageForm courseId={courseId} curriculumId={curriculumId} />
    </div>
  )
}
