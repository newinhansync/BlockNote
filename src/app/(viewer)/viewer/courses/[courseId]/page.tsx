import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CourseProgressWrapper } from './CourseProgressWrapper'
import { CourseContent } from './CourseContent'

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
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              order: true,
            }
          }
        }
      }
    }
  })
}

export default async function ViewerCoursePage({ params }: PageProps) {
  const { courseId } = await params
  const course = await getCourse(courseId)

  if (!course) {
    notFound()
  }

  // Calculate total pages
  const totalPages = course.curriculums.reduce(
    (sum, c) => sum + c.pages.length,
    0
  )

  // 첫 번째 페이지 찾기
  const firstPage = course.curriculums[0]?.pages[0]
  const firstCurriculumId = course.curriculums[0]?.id

  return (
    <CourseProgressWrapper courseId={courseId}>
      <CourseContent
        course={course}
        totalPages={totalPages}
        firstPageId={firstPage?.id}
        firstCurriculumId={firstCurriculumId}
      />
    </CourseProgressWrapper>
  )
}
