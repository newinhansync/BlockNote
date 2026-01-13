import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { EditorClientWrapper } from './EditorClientWrapper'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ contentId: string }> }

async function getCourse(courseId: string) {
  return prisma.course.findUnique({
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
              order: true,
              isPublished: true,
            },
          },
        },
      },
    },
  })
}

export default async function ContentEditorPage({ params }: PageProps) {
  const { contentId } = await params

  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const course = await getCourse(contentId)

  if (!course) {
    notFound()
  }

  const initialData = {
    contentId: course.id,
    title: course.title,
    isPublished: course.isPublished,
    publishedAt: course.publishedAt,
    curriculums: course.curriculums.map((c) => ({
      id: c.id,
      title: c.title,
      order: c.order,
      pages: c.pages.map((p) => ({
        id: p.id,
        title: p.title,
        order: p.order,
        isPublished: p.isPublished,
      })),
    })),
  }

  return <EditorClientWrapper initialData={initialData} />
}
