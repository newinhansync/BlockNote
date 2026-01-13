import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { DeletePageButton } from './DeletePageButton'
import { PageForm } from '../PageForm'
import { VersionHistoryButton } from '@/components/versions/VersionHistoryButton'
import { CommentSection } from '@/components/comments/CommentSection'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ courseId: string; curriculumId: string; pageId: string }> }

async function getPage(pageId: string) {
  return prisma.page.findUnique({
    where: { id: pageId },
    include: {
      curriculum: {
        select: { title: true }
      }
    }
  })
}

export default async function PageEditPage({ params }: PageProps) {
  const { courseId, curriculumId, pageId } = await params
  const [page, session] = await Promise.all([
    getPage(pageId),
    auth()
  ])

  if (!page) {
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

      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm text-gray-500 mb-1">{page.curriculum.title}</p>
          <h1 className="text-2xl font-bold">페이지 편집</h1>
        </div>
        <div className="flex gap-2">
          <VersionHistoryButton
            courseId={courseId}
            curriculumId={curriculumId}
            pageId={pageId}
          />
          <DeletePageButton
            courseId={courseId}
            curriculumId={curriculumId}
            pageId={pageId}
            pageTitle={page.title}
          />
        </div>
      </div>

      <PageForm courseId={courseId} curriculumId={curriculumId} page={page} />

      {/* Comments/Feedback Section */}
      <CommentSection
        pageId={pageId}
        currentUserId={session?.user?.id}
        isAdmin={session?.user?.role === 'ADMIN'}
      />
    </div>
  )
}
